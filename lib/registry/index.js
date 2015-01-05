'use strict';

/**
 * Registry.
 * This module is designed to subscribe Pigeon servers and server weights from
 * the registry for remote service call.
 *
 * Module dependencies:
 * Index ---> Registry
 * Registry ---> Registry
 */

require('rootpath')();

var _            = require('underscore')
  , async        = require('async')
  , zookeeper    = require('node-zookeeper-client')
  , Error        = require('lib/error')
  , logger       = require('lib/logger')('registry')
  , tcpRegistry  = require('lib/registry/tcp')
  , httpRegistry = require('lib/registry/http')
  ;

/*
 *
 * Constants.
 *
 */
var SESSION_TIMEOUT = 30 * 1000
  , SPIN_DELAY      = 1000
  , RETRIES         = 1000
  , CONNECT_TIMEOUT = 5 * 1000
  ;

var PLACEHOLDER    = '^'
  , PATH_SEPARATOR = '/'
  , SERVER_PATH    = '/DP/SERVER'
  , WEIGHT_PATH    = '/DP/WEIGHT'
  ;

/*
 *
 * Globals.
 *
 */
var g_zk   = {}
  , g_init = false
  ;

function Registry(service) {
  this.service  = service;
  this.registry = whichRegistry(this.service.configs);
}

Registry.prototype.startup = function startup(done) {
  g_zk = zookeeper.createClient(this.service.configs.get('zkserver'), {
    sessionTimeout: SESSION_TIMEOUT,
    spinDelay: SPIN_DELAY,
    retries: RETRIES
  });

  var that = this;

  g_zk.on('connected', function() {
    logger.info('Zookeeper connection: state(connected).');
    g_init = true;
    done && done();
  });

  g_zk.on('expired', function() {
    logger.warn('Zookeeper connection: state(expired).');
    g_zk.close();
    that.startup();
  });

  [
    'connectedReadOnly',
    'disconnected',
    'authenticationFailed'
  ].forEach(function(state) {
      g_zk.on(state, function() {
        logger.warn('Zookeeper connection: state(%s).', state);
      });
    });

  logger.info('Zookeeper connection: connecting...');
  g_zk.connect();

  setTimeout(function() {
    if (!g_init) {
      var err = new Error('zookeeper',
        'Zookeeper connection: error(%s)', 'connection timeout');
      done(err);
      g_zk.close();
    }
  }, CONNECT_TIMEOUT);
};

Registry.prototype.subscribe = function subscribe(done) {
  logger.info('Zookeeper subscription: start subscripton, service(%s).',
    this.service.url);
  servers(this, done);
};

function servers(context, done) {
  logger.info('Zookeeper server subscription: start server subscription, ' +
    'service(%s).', context.service.url);

  var path = serverPath(context, context.service.url);
  logger.debug('Zookeeper server subscription: node(%s), service(%s).',
    path, context.service.url);

  g_zk.exists(
    path,
    function(event) {
      logger.debug('Zookeeper server subscription(*): event(%s), node(%s), service(%s)',
        event.getName(), path, context.service.url);
    },
    function(err, stat) {
      if (err) {
        return done(new Error('zookeeper', 'Zookeeper server subscription: ' +
          'error(%s), node(%s), service(%s).', err, path, context.service.url));
      }

      if (!stat) {
        return done(new Error('zookeeper', 'Zookeeper server subscritpion: ' +
          'error(%s), node(%s), service(%s).', 'node not found', path, context.service.url));
      }

      g_zk.getData(
        path,
        function(event) {
          var name = event.getName();
          switch(name) {
            case 'NODE_DELETED':
              logger.info('Zookeeper server subscription: event(%s), ' +
                'node(%s), service(%s).', name, path, context.service.url);
              context.service.router.status = {};
              break;
            case 'NODE_DATA_CHANGED':
              logger.info('Zookeeper server subscription: event(%s), ' +
              'node(%s), service(%s).', name, path, context.service.url);
              servers(context, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
            default:
              logger.debug('Zookeeper server subscription(*): event(%s), node(%s), ' +
                'service(%s).', name, path, context.service.url);
          }
        },
        function(err, data, stat) {
          if (err) {
            return done(new Error('zookeeper', 'Zookeeper server subscription: error(%s): ' +
              'node(%s), service(%s).', err, path, context.service.url));
          }

          if (!stat) {
            return done(new Error('zookeeper', 'Zookeeper error(%s): ' +
              'node(%s), service(%s).', 'node not found', path, context.service.url));
          }

          var ips = (data && data.toString()) ? data.toString().split(',') : [];
          logger.info('Zookeeper server subscription: data(%j), node(%s).', ips, path);

          weights(context, ips, done);
        }
      )
    }
  );
}

function weights(context, ips, done) {
  logger.debug('Zookeeper weights subscription: all servers(%s), service(%s).',
    ips, context.service.url);

  var oldips = _.keys(context.service.router.status);

  _.difference(oldips, ips).forEach(function(ip) {
    delete context.service.router.status[ip];
  });

  var newips = _.difference(ips, oldips);
  newips.forEach(function(ip) {
    context.service.router.status[ip] = {
      loadBalance : 0.5,
      reachability: 0.5
    };
  });

  logger.debug('Zookeeper weights subscription: service(%s), new servers(%s).',
    newips, context.service.url);

  async.each(
    newips,
    function(ip, eachdone) {
      weight(context, ip, eachdone);
    },
    function(err) {
      done(err);
    }
  );
}

function weight(context, ip, eachdone) {
  logger.info('Zookeeper weight subscription: start weight subscription, ' +
    'server(%s), service(%s).', ip, context.service.url);

  var path = weightPath(ip);
  logger.debug('Zookeeper weight subscription: node(%s), server(%s), service(%s).',
    path, ip, context.service.url);

  g_zk.exists(
    path,
    function(event) {
      var name = event.getName();
      switch(name) {
        case 'NODE_CREATED':
          logger.info('Zookeeper weight subscription: event(%s), node(%s), ' +
            'server(%s), service(%s).', name, path, ip, context.service.url);
          weight(context, ip, function(err) {
            if (err) {
              logger.error(err);
            }
          });
          break;
        default:
          logger.debug('Zookeeper weight subscription(*): event(%s), node(%s), ' +
            'server(%s), service(%s).', name, path, ip, context.service.url);
      }
    },
    function(err, stat) {
      if (err) {
        return eachdone(new Error('zookeeper', 'Zookeeper weight ' +
          'subscription: error(%s), node(%s), server(%s), service(%s).',
          err, path, ip, context.service.url));
      }

      if (!stat) {
        return eachdone();
      }

      g_zk.getData(
        path,
        function(event) {
          var name = event.getName();
          switch(name) {
            case 'NODE_DATA_CHANGED':
              logger.info('Zookeeper weight subscription: event(%s), node(%s), ' +
                'server(%s), service(%s).', name, path, ip, context.service.url);
              weight(context, ip, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
            default:
              logger.debug('Zookeeper weight subscription(*): event(%s), node(%s), ' +
              'server(%s), service(%s).', name, path, ip, context.service.url);
          }
        },
        function(err, data, stat) {
          if (err) {
            return eachdone(new Error('zookeeper', 'Zookeeper weight ' +
              'subscription: error(%s), node(%s), server(%s), service(%s).',
              err, path, ip, context.service.url));
          }

          if (!stat) {
            return eachdone(new Error('zookeeper', 'Zookeeper weight ' +
              'subscription: error(%s), node(%s), server(%s), service(%s).',
              'node not found', path, ip, context.service.url));
          }

          var weight = (data && data.toString()) ? parseInt(data.toString()) : 0.5;
          logger.info('Zookeeper weight subscription: data(%j), node(%s), ' +
            'server(%s), service(%s).', weight, path, ip, context.service.url);

          if (context.service.router.status[ip]) {
            context.service.router.status[ip].loadBalance = weight;
          }
          eachdone();
        }
      );
    }
  );
}

function serverPath(context, url) {
  return SERVER_PATH + PATH_SEPARATOR
    + escape(context.registry.PROTOCOL_PREFIX + url);
}

function weightPath(ip) {
  return WEIGHT_PATH + PATH_SEPARATOR + ip;
}

function escape(str) {
  return str.replace(new RegExp(PATH_SEPARATOR, 'g'), PLACEHOLDER);
}

function whichRegistry(configs) {
  var protocol = configs.get('protocol');
  switch(protocol) {
    case 'tcp' : return tcpRegistry;
    case 'http': return httpRegistry;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}

module.exports = Registry;
