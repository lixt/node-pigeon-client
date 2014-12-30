'use strict';

require('rootpath')();

var _            = require('underscore')
  , async        = require('async')
  , util         = require('util')
  , zookeeper    = require('node-zookeeper-client')
  , config       = require('lib/config')
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
  ;

var PLACEHOLDER    = '^'
  , PATH_SEPARATOR = '/'
  , SERVICE_PATH   = '/DP/SERVER'
  , WEIGHT_PATH    = '/DP/WEIGHT'
  ;

/*
 *
 * Globals.
 *
 */
var g_zk = {};

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
    'connectedReadOnly',
    'disconnected',
    'expired',
    'authenticationFailed'
  ].forEach(function(state) {
    g_zk.on(state, function() {
      logger.info('ZK client in %s state.', state);
    });
  });

  g_zk.connect();
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