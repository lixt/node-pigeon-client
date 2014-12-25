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

function subscribe(service, doneNotify, doneSubscribe) {
  getServiceIPs(
    service,
    service.__internal__.url,
    doneNotify,
    doneSubscribe
  );
}

function getServiceIPs(service, url, doneNotify, doneSubscribe) {
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
        return doneSubscribe(
          util.format('ZK node(%s) error ===> %j', zkPath, err)
        );
      }

      if (!stat) {
        return doneSubscribe(
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
              service.__clear__();
              doneNotify();
              break;
            case 'NODE_DATA_CHANGED':
              logger.info('ZK node(%s) watch event: %s.',zkPath, name);
              getServiceIPs(service, url, doneNotify, doneNotify);
              break;
            default:
              doneNotify();
          }
        },
        function(err, data) {
          if (err) {
            return doneSubscribe(
              util.format('ZK node(%s) error ===> %j', zkPath, err)
            );
          }

          var ips = (data) ? data.toString().split(',') : [];
          logger.info('ZK data on node(%s): %j.', zkPath, ips);

          getServerWeights(
            service,
            ips,
            function(err) {
              doneNotify(err);
            },
            function(err) {
              doneSubscribe(err);
            }
          );
        }
      );
    }
  );
}

function getServerWeights(service, ips, doneNotify, doneSubscribe) {
  var newips = [];
  var oldips = _.keys(service.__get__());

  // Get the abandoned IPs.
  _.difference(oldips, ips).forEach(function(ip) {
    service.__clear__(ip);
  });

  // Get the newly added IPs.
  newips = _.difference(ips, oldips);
  newips.forEach(function(ip) {
    service.__set__(ip, 0);
  });

  async.each(
    newips,
    function(ip, eachDone) {
      getServerWeight(service, ip, doneNotify, eachDone);
    },
    function(err) {
      doneSubscribe(err);
    }
  );
}

function getServerWeight(service, ip, doneNotify, eachDone) {
  if (_.isUndefined(service.__get__(ip))) {
    return _.defer(eachDone);
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
          getServerWeight(service, ip, doneNotify, doneNotify);
          break;
        default :
          doneNotify();
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
              getServerWeight(service, ip, doneNotify, doneNotify);
              break;
            default:
              doneNotify();
          }
        },
        function(err, data) {
          if (err) {
            return eachDone(util.format('ZK node(%s) error ===> %j', zkPath, err));
          }

          var weight = (data) ? data.toString() : 0;
          logger.info('ZK data on node(%s): %j.', zkPath, weight);

          service.__set__(ip, weight);
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