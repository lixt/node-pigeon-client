'use strict';

require('rootpath')();

var logger     = require('lib/logger')('router')
  , config     = require('lib/config')
  , autoaware  = require('lib/service/router/autoaware')
  , roundRobin = require('lib/service/router/round-robin')
  , random     = require('lib/service/router/random')
  ;

function Router() {
  this.states = {};
  this.recent = 0;
}

Router.prototype.next = function() {
  whichRouter().next(this);
};

Router.prototype.nexts = function() {
  var valids = {};
  _.each(this.states, function(state, ip) {
    if (state.loadBalances !== 0 && state.reachability !== 0) {
      valids[ip] = state.loadBalances + state.reachability;
    }
  });
  return valids;
};

Router.prototype.probes = function() {
  var probes = [];
  _.each(this.states, function(state, ip) {
    if (state.reachability !== 1) {
      probes.push(ip);
    }
  });
  return probes;
};

function whichRouter() {
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


