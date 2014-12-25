'use strict';

require('rootpath')();

var logger     = require('lib/logger')('router')
  , config     = require('lib/config')
  , autoaware  = require('lib/service/router/autoaware')
  , roundRobin = require('lib/service/router/round-robin')
  , random     = require('lib/service/router/random')
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


