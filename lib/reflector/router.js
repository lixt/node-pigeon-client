'use strict';

require('rootpath')();

var _      = require('underscore')
  , logger = require('lib/logger')
  , config = require('lib/config')
  ;

function Router(addresses, loadBalance) {
  this.loadBalance = loadBalance || config.get('loadBalance');
  this.addresses   = addresses;
  this.weights     = {};
  this.last        = 0;
}

/**
 * Get the next service ip.
 */
Router.prototype.next = function next() {
  switch(this.loadBalance) {
    case 'autoaware':
      return _autoaware(this);
      break;
    case 'roundRobin':
      return _roundRobin(this);
      break;
    case 'random':
      return _random(this);
      break;
    default:
      logger.fatal('Unsupported load balance: %s', this.loadBalance);
  }
};

function _autoaware(router) {

}

function _roundRobin(router) {
  return router.addresses[(router.last++) % router.addresses.length];
}

function _random(router) {
  return _.sample(router.addresses);
}

module.exports = Router;


