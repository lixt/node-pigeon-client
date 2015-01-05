'use strict';

require('rootpath')();

var _      = require('underscore')
  , parser = require('properties-parser')
  , logger = require('lib/logger')('config')
  ;

/*
 *
 * Constants.
 *
 */
var ENV_PATH     = '/data/webapps/appenv'
  , TIMEOUT      = 2000
  , RETRIES      = 1
  , PROTOCOLS    = ['http']
  , SERIALIZES   = ['hessian']
  , LOADBALANCES = ['autoaware', 'roundRobin', 'random']
  ;

/*
 *
 * Globals.
 *
 */
var g_zkserver = [];

(function init() {
  try {
    var properties = parser.read(ENV_PATH);
  }
  catch(err) {
    logger.warn('Reading `appenv` error: %j.', err);
  }

  if (!properties['zkserver']) {
    return logger.warn('No zookeeper address supplied in `appenv`.');
  }

  g_zkserver = properties['zkserver'];
}());

function Config(configs) {
  configs          = configs || {};
  this.zkserver    = config('zkserver'   , configs.zkserver   );
  this.timeout     = config('timeout'    , configs.timeout    );
  this.retries     = config('retries'    , configs.retries    );
  this.protocol    = config('protocol'   , configs.protocol   );
  this.serialize   = config('serialize'  , configs.serialize  );
  this.loadBalance = config('loadBalance', configs.loadBalance);
}

Config.prototype.get = function(name) {
  return this[name];
};

function config(name, value) {
  switch(name) {
    case 'zkserver':
      if (!value) {
        value = g_zkserver;
      }

      if (value) {
        return value;
      } else {
        logger.fatal('No zookeeper address supplied.');
      }
      break;

    case 'timeout':
      return value || TIMEOUT;

    case 'retries':
      return value || RETRIES;

    case 'protocol':
      if (!value) {
        return PROTOCOLS[0];
      }
      if (_.contains(PROTOCOLS, value)) {
        return value;
      }
      logger.fatal('Unsupported %s: %j.', name, value);
      break;

    case 'serialize':
      if (!value) {
        return SERIALIZES[0];
      }
      if (_.contains(SERIALIZES, value)) {
        return value;
      }
      logger.fatal('Unsupported %s: %j.', name, value);
      break;

    case 'loadBalance':
      if (!value) {
        return LOADBALANCES[0];
      }
      if (_.contains(LOADBALANCES, value)) {
        return value;
      }
      logger.fatal('Unsupported %s: %j.', name, value);
      break;

    default:
      logger.warn('Unsupported config :%s.', name);
  }
}

module.exports = Config;
