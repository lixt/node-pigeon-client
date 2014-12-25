'use strict';

require('rootpath')();

var logger     = require('lib/logger')('router')
  , config     = require('lib/config')
  , autoaware  = require('lib/reflector/router/autoaware')
  , roundRobin = require('lib/reflector/router/round-robin')
  , random     = require('lib/reflector/router/random')
  ;

function Router() {
  this.loadBalances = {};
  this.lastIndex = 0;
}

/**
 * Return the next ip address for querying.
 */
Router.prototype.next = function next() {
  return _polyRouter().next(this);
}

function _polyRouter() {
  var loadBalance = config.get('loadBalance');
  switch(loadBalance) {
    case 'autoaware' : return autoaware;
    case 'roundRobin': return roundRobin;
    case 'random'    : return random;
    default:
      logger.fatal('Unsupported load balance: %j.', loadBalance);
  }
}

module.exports = Router;


