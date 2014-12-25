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
  g_zk = zookeeper.createClient(config.get('zkserver'));

  g_zk.on('connected', function() {
    logger.info('ZK client has connected to the server.');
  });

  g_zk.connect();
}());

function registry(service, watch, done) {
  getServiceIPs(service, service.__internal__.url, done);
}

function getServiceIPs(service, url, done) {
  var urlPrefix = _polyRegistry().PROTOCOL_PREFIX
    , zkPath    = _getServicePath(urlPrefix + url)
    ;

  logger.debug('ZK path of service(%s) is %s.', url, zkPath);

  g_zk.getData(
    zkPath,

    // Watcher.
    function(event) {
      logger.info('ZK path(%s) watcher event: %j.', zkPath, event);

      // Service is deleted.
      if (event.getName() === 'NODE_DELETED') {
        service.__clear__();
      }

      // Retry.
      if (event.getName() === 'NODE_DATA_CHANGED') {
        getServiceIPs(service, url, done);
      }
    },

    // Callback.
    function(err, data, stat) {
      if (err) {
        return done(util.format('ZK get data on path(%s) error ===> %j',
          zkPath, err));
      }

      var ips = (data) ? data.toString().split(',') : [];
      logger.info('ZK get data on path(%s): %j.', zkPath, ips);

      getServerWeights(service, ips, function(err) {
        done(err);
      });
    }
  );
}

function getServerWeights(service, ips, done) {
  // Three kinds of ips.
  // 1. IP abandoned.
  // 2. IP remained.
  // 3. IP newly added.
  var newips = [];
  var oldips = _.keys(service.__get__());

  // Get the abandoned IPs.
  _.difference(oldips, ips).forEach(function(ip) {
    service.__set__(ip, undefined);
  });

  // Get the newly added IPs.
  newips = _.difference(ips, oldips);
  newips.forEach(function(ip) {
    service.__set__(ip, 0);
  });

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

function getServerWeight(service, ip, done) {
  if (_.isUndefined(service.__get__(ip))) {
    return _.defer(done);
  }

  var zkPath = _getWeightPath(ip);
  logger.debug('ZK path of ip(%s) weight is %s.', ip, zkPath);

  g_zk.exists(
    zkPath,

    // Watcher.
    function(event) {
      logger.info('ZK path(%s) watcher event: %j.', zkPath, event);

      if (event.getName() === 'NODE_CREATED') {
        getServerWeight(service, ip, function() {

        });
      }
    },

    // Callback.
    function(err, stat) {
      if (err) {
        return done(util.format('ZK get data on path(%s) error ===> %j',
          zkPath, err));
      }

      // Node exists.
      if (stat) {
        g_zk.getData(
          zkPath,

          // Watcher.
          function(event) {
            logger.info('ZK path(%s) watcher event: %j.', zkPath, event);

            if (event.getName() === 'NODE_DATA_CHANGED') {
              getServerWeight(service, ip, done);
            }
          },

          // Callback.
          function(err, data) {
            if (err) {
              return done(util.format('ZK get data on path(%s) error ===> %j',
                zkPath, err));
            }

            var weight = (data) ? data.toString() : 0;
            logger.info('ZK get data on path(%s): %j.', zkPath, weight);

            service.__set__(ip, weight);
            done();
          }
        )
      } else {
        done();
      }
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


/*
var zk = {};


(function init() {
  zk = zookeeper.createClient(config.get('zkserver'));

  zk.on('connected', function() {
    logger.info('ZK client has connected to the server.');
  });

  zk.connect();
}());

function getServiceAddress(serviceName, cb) {
  serviceName = _configServiceName(serviceName);
  var path = _getServicePath(serviceName);
  logger.debug('ZK path of service(%s) is %s.', serviceName, path);

  zk.getData(
    path,
    function(event) {

    },
    function(err, data, stat) {
      if (err) {
        logger.error('ZK get data on path(%s) error: %j.', path, err);
        return cb && cb(err);
      }

      var addresses = (data) ? data.toString().split(',') : [];
      if (addresses.length === 0) {
        var errinfo = util.format('ZK get no data on path(%s).', path);
        logger.error(errinfo);
        return cb && cb(errinfo);
      }

      cb && cb(null, addresses);
    }
  );
}

function getServerWeight(serverAddress, cb) {
  var path = _getWeightPath(serverAddress);
  logger.debug('ZK path of server weight(%s) is %s.', serverAddress, path);

  zk.getData(
    path,
    function(event) {

    },
    function(err, data, stat) {
      if (err) {
        logger.error('ZK get data on path(%s) error: %j.', path, err);
        return cb && cb(err);
      }

      cb && cb(null, data.toString());
    }
  )
}

function _configServiceName(serviceName) {
  var protocol = config.get('protocol');

  switch (protocol) {
    case 'tcp' :
      return serviceName;
    case 'http':
      return '@HTTP@' + serviceName;
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
}*/

module.exports = {
  subscribe: subscribe
}