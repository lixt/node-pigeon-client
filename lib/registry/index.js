'use strict';

// Root require.
require('rootpath')();

var zookeeper = require('node-zookeeper-client')
  , util      = require('util')
  , config    = require('lib/config')
  , logger    = require('lib/logger')('registry')
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
}

module.exports = {
  getServiceAddress: getServiceAddress,
  getServerWeigth  : getServerWeight,
};