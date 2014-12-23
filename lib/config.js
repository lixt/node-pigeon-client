'use strict';

// Root require.
require('rootpath')();

var config = require('config')
  , logger = require('lib/logger')
  ;

/*
 *
 * Constants.
 *
 */
var CONFIGS      = ['protocol', 'serialize', 'loadBalance']
  , PROTOCOLS    = ['tcp', 'http']
  , SERIALIZES   = ['hessian', 'json', 'protobuf']
  , LOADBALANCES = ['autoaware', 'roundRobin', 'random']
  ;


/*
 *
 * Globals.
 *
 */
var configs = {}

function init() {
  configs.zkserver = config.get('zkserver') || '127.0.0.1:2181';

  CONFIGS.forEach(function(CONFIG) {
    _init(CONFIG);
  });
}

function _init(configName) {
  var configArray = _array(configName);
  var configValue = config.get(configName);

  if (!configValue) {
    configValue = configArray[0];
  } else {
    if (configArray.indexOf(configValue) === -1) {
      logger.fatal('Unsupported %s: %j.', configName, configValue);
    }
  }

  configs[configName] = configValue;
}

function _array(configName) {
  return eval(configName.toUpperCase() + 'S');
}

function get(key) {
  return configs[key];
}

module.exports = init;
module.exports.get = get;
