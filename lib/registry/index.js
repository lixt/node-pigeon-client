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
  , RETRIES         = 1
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
var g_zk = {};

function Registry(service) {
  this.service  = service;
  this.registry = whichRegistry(this.service.configs);
}

Registry.prototype.startup = function startup(done) {
  g_zk = zookeeper.createClient(this.service.configs.get('zkserver'), {
    sessionTimeout: SESSION_TIMEOUT,
    spinDelay     : SPIN_DELAY,
    retries       : RETRIES
  });

  g_zk.on('connected', function() {
    logger.info('ZK client in state(connected).');
    done && done();
  });

  g_zk.on('expired', function() {
    logger.warn('ZK client in state(expired).');
    startup();
  });

  [
    'connectedReadOnly',
    'disconnected',
    'authenticationFailed'
  ].forEach(function(state) {
      g_zk.on(state, function() {
        logger.warn('ZK client in state(%s).', state);
      });
    });

  g_zk.connect();
};

Registry.prototype.subscribe = function subscribe(done) {

};

function servers(context, done) {
  logger.debug('Zookeeper server subscription: service(%s).',
    context.service.url);

  var path = serverPath(context, context.service.url);
  logger.debug('Zookeeper server subscription: service(%s), node(%s).',
    context.service.url, path);

  g_zk.exists(
    path,
    function(event) {
      logger.debug('Zookeeper server subscription(*): service(%s), node(%s), event(%s).',
        context.service.url, path, event.getName());
    },
    function(err, stat) {
      if (err) {
        return done(new Error('zookeeper', 'Zookeeper server subscription: ' +
          'error(%s), service(%s), node(%s).', err, context.service.url, path));
      }

      if (!stat) {
        return done(new Error('zookeeper', 'Zookeeper server subscritpion: ' +
          'error(%s), service(%s), node(%s).', 'node not found', context.service.url, path));
      }

      g_zk.getData(
        path,
        function(event) {
          var name = event.getName();
          switch(name) {
            case 'NODE_DELETED':
              logger.debug('Zookeeper server subscription: service(%s), ' +
                'node(%s), event(%s).', context.service.url, path, name);
              context.service.router.status = {};
              break;
            case 'NODE_DATA_CHANGED':
              logger.debug('Zookeeper server subscription: service(%s), ' +
                'node(%s), event(%s).', context.service.url, path, name);
              servers(context, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
            default:
              logger.debug('Zookeeper server subscription(*): service(%s), ' +
                'node(%s), event(%s).', context.service.url, path, name);
          }
        },
        function(err, data, stat) {
          if (err) {
            return done(new Error('zookeeper', 'Zookeeper error(%s): ' +
              'service(%s), node(%s).', err, context.service.url, path));
          }

          if (!stat) {
            return done(new Error('zookeeper', 'Zookeeper error(%s): ' +
              'service(%s), node(%s).', 'node not found', context.service.url, path));
          }

          var ips = (data && data.toString()) ? data.toString().split(',') : [];
          logger.info('Zookeeper server subscription: node(%s), data(%j).', path, ips);

          weights(context, ips, done);
        }
      )
    }
  );
}

function weights(context, ips, done) {
  logger.debug('Zookeeper weights subscription: service(%s), all servers(%s).',
    context.service.url, ips);

  var oldips = _.keys(context.router.status);

  _.difference(oldips, ips).forEach(function(ip) {
    delete context.router.status[ip];
  });

  var newips = _.difference(ips, oldips);
  newips.forEach(function(ip) {
    context.router.status[ip] = {
      loadBalance : 0.5,
      reachability: 0.5
    };
  });

  logger.debug('Zookeeper weights subscription: service(%s), new servers(%s).',
    context.service.url, newips);

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
  logger.debug('Zookeeper weight subscription: service(%s), server(%s).',
    context.service.url, ip);

  var path = weightPath(ip);
  logger.debug('Zookeeper weight subscription: service(%s), server(%s), node(%s).',
    context.service.url, ip, path);

  g_zk.exists(
    path,
    function(event) {
      var name = event.getName();
      switch(name) {
        case 'NODE_CREATED':
          logger.debug('Zookeeper weight subscription: service(%s), server(%s), ' +
            'node(%s), event(%s).', context.service.url, ip, path, name);
          weight(context, ip, function(err) {
            if (err) {
              logger.error(err);
            }
          });
          break;
        default:
          logger.debug('Zookeeper weight subscription(*): service(%s), server(%s), ' +
            'node(%s), event(%s).',context.service.url, ip, path, name);
      }
    },
    function(err, stat) {
      if (err) {
        return eachdone(new Error('zookeeper', 'Zookeeper weight subscription: error(%s), ' +
          'service(%s), server(%s), node(%s).', err, context.service.url, ip, path));
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
              logger.debug('Zookeeper weight subscription: service(%s), server(%s), ' +
                'node(%s), event(%s).', context.service.url, ip, path, name);
              weight(context, ip, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
            default:
              logger.debug('Zookeeper weight subscription(*): service(%s), server(%s), ' +
              'node(%s), event(%s).', context.service.url, ip, path, name);
          }
        },
        function(err, data, stat) {
          if (err) {
            return eachdone(new Error('zookeeper', 'Zookeeper weight subscription: ' +
              'error(%s), service(%s), server(%s), node(%s).', err, context.service.url, ip, path));
          }

          if (!stat) {
            return eachdone(new Error('zookeeper', 'Zookeeper weight subscription:' +
              'error(%s), service(%s), server(%s), node(%s).', 'node not found',
              context.service.url, ip, path));
          }

          var weight = (data && data.toString()) ? parseInt(data.toString()) : 0.5;
          logger.debug('Zookeeper weight subscription: service(%s), server(%s), ' +
            'node(%s), data(%j).', context.service.url, ip, path, weight);

          if (context.router.status[ip]) {
            context.router.status[ip].loadBalance = weight;
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

/*
module.exports = Registry;


(function init() {
  g_zk = zookeeper.createClient(
    config.get('zkserver'),
    {
      sessionTimeout: SESSION_TIMEOUT,
      spinDelay     : SPIN_DELAY,
      retries       : RETRIES
    }
  );

  [
    'connected',
    'state',
    'connectedReadOnly',
    'disconnected',
    'expired',
    'authenticationFailed'
  ].forEach(function(state) {
    g_zk.on(state, function() {
      logger.info('ZK client in state(%s).', state);
    });
  });

  g_zk.connect();

  setInterval(function() {
    console.log(g_zk.getState());
  }, 3000);
}());

function subscribe(service, done) {
  getServiceIPs(
    service,
    service.url,
    done
  );
}

function getServiceIPs(service, url, done) {
  var urlPrefix = _polyRegistry().PROTOCOL_PREFIX
    , zkPath    = _getServicePath(urlPrefix + url)
    ;

  logger.debug('ZK service(%s) node: %s.', url, zkPath);

  g_zk.exists(
    zkPath,
    function(event) {
      // Care about no event.
      var name = event.getName();
      logger.debug('ZK node(%s) watch event: %s.',zkPath, name);
    },
    function(err, stat) {
      if (err) {
        return done(
          util.format('ZK node(%s) error ===> %j', zkPath, err)
        );
      }

      if (!stat) {
        return done(
          util.format('ZK node(%s) not found.', zkPath)
        );
      }

      g_zk.getData(
        zkPath,
        function(event) {
          // Care about:
          // 1. NODE_DELETED.
          // 2. NODE_DATA_CHANGED.

          var name = event.getName();
          logger.debug('ZK node(%s) watch event: %s.',zkPath, name);

          switch(name) {
            case 'NODE_DELETED':
              logger.info('ZK node(%s) watch event: %s.',zkPath, name);
              service.router.status = {};
              break;
            case 'NODE_DATA_CHANGED':
              logger.info('ZK node(%s) watch event: %s.',zkPath, name);
              getServiceIPs(service, url, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
          }
        },
        function(err, data) {
          if (err) {
            return done(
              util.format('ZK node(%s) error ===> %j', zkPath, err)
            );
          }

          var ips = (data && data.toString()) ? data.toString().split(',') : [];
          logger.info('ZK data on node(%s): %j.', zkPath, ips);

          getServerWeights(
            service,
            ips,
            function(err) {
              done(err);
            }
          );
        }
      );
    }
  );
}

function getServerWeights(service, ips, done) {
  var newips = [];
  var oldips = _.keys(service.router.status);

  // Get the abandoned IPs.
  _.difference(oldips, ips).forEach(function(ip) {
    delete service.router.status[ip];
  });

  // Get the newly added IPs.
  newips = _.difference(ips, oldips);
  newips.forEach(function(ip) {
    service.router.status[ip] = {
      loadBalance : 0.5,
      reachability: 0.5
    };
  });

  console.log(newips);

  async.each(
    newips,
    function(ip, eachDone) {
      getServerWeight(service, ip, eachDone);
    },
    function(err) {
      done(err);
    }
  );
}

function getServerWeight(service, ip, eachDone) {
  if (_.isUndefined(service.router.status)) {
    return _.defer(function() {
      eachDone();
    });
  }

  var zkPath = _getWeightPath(ip);
  logger.debug('ZK ip(%s) weight node: %s.', ip, zkPath);

  g_zk.exists(
    zkPath,
    function(event) {
      // Care about:
      // 1. NODE_CREATED.

      var name = event.getName();
      logger.debug('ZK node(%s) watch event: %j.', zkPath, name);

      switch (name) {
        case 'NODE_CREATED':
          getServerWeight(service, ip, function(err) {
            if (err) {
              logger.error(err);
            }
          });
          break;
      }
    },
    function(err, stat) {
      if (err) {
        return eachDone(util.format('ZK node(%s) error ===> %j', zkPath, err));
      }

      if (!stat) {
        return eachDone();
      }

      g_zk.getData(
        zkPath,
        function(event) {
          // Care about.
          // 1. NODE_DATA_CHANGED.
          var name = event.getName();
          logger.debug('ZK node(%s) watch event: %j.', zkPath, name);

          switch(name) {
            case 'NODE_DATA_CHANGED':
              logger.info('ZK node(%s) watch event: %j.', zkPath, name);
              getServerWeight(service, ip, function(err) {
                if (err) {
                  logger.error(err);
                }
              });
              break;
          }
        },
        function(err, data) {
          if (err) {
            return eachDone(util.format('ZK node(%s) error ===> %j', zkPath, err));
          }

          var weight = (data && data.toString()) ? parseInt(data.toString()) : 0.5;
          logger.info('ZK data on node(%s): %j.', zkPath, weight);

          if (!service.router.status[ip]) {
            service.router.status[ip] = {
              reachability: 0.5
            };
          }
          service.router.status[ip].loadBalance = weight;
          eachDone();
        }
      )
    }
  );
}

function _polyRegistry() {
  var protocol = config.get('protocol');
  switch(protocol) {
    case 'tcp' : return tcpRegistry;
    case 'http': return httpRegistry;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}

function _getServicePath(serviceName) {
  return SERVICE_PATH + PATH_SEPARATOR + _escape(serviceName);
}

function _getWeightPath(serverAddress) {
  return WEIGHT_PATH + PATH_SEPARATOR + serverAddress;
}

function _escape(serviceName) {
  return serviceName.replace(new RegExp(PATH_SEPARATOR, 'g'), PLACEHOLDER);
}

module.exports = {
  subscribe: subscribe
};
*/