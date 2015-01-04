'use strict';

/**
 * Router.
 * This module is designed to route the remote service call for the client.
 *
 * Module dependencies:
 *
 */

require('rootpath')();

var _          = require('underscore')
  , logger     = require('lib/logger')('router')
  , autoaware  = require('lib/service/router/autoaware')
  , roundRobin = require('lib/service/router/round-robin')
  , random     = require('lib/service/router/random')
  ;

function Router(service) {
  this.service = service;
  this.status = {};
  this.recent = 0;
}

Router.prototype.next = function() {
  return whichRouter(this.service.configs).next(this);
};

Router.prototype.nexts = function() {
  var valids = {};
  _.each(this.status, function(state, ip) {
    if (state.loadBalance !== 0 && state.reachability !== 0) {
      valids[ip] = state.loadBalance + state.reachability;
    }
  });

  if (_.size(valids) <= 1) {
    this.service.prober.probe();
  }

  return valids;
};

Router.prototype.probes = function() {
  var probes = [];
  _.each(this.status, function(state, ip) {
    if (state.reachability !== 1) {
      probes.push(ip);
    }
  });
  return probes;
};

function whichRouter(configs) {
  var loadBalance = configs.get('loadBalance');
  switch(loadBalance) {
    case 'autoaware' : return autoaware;
    case 'roundRobin': return roundRobin;
    case 'random'    : return random;
    default:
      logger.fatal('Unsupported load balance: %j.', loadBalance);
  }
}

module.exports = Router;


