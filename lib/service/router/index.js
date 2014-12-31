'use strict';

require('rootpath')();

var _          = require('underscore')
  , logger     = require('lib/logger')('router')
  , probe      = require('lib/probe/')
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
  return whichRouter().next(this);
};

Router.prototype.nexts = function() {
  var valids = {};
  _.each(this.status, function(state, ip) {
    if (state.loadBalance !== 0 && state.reachability !== 0) {
      valids[ip] = state.loadBalance + state.reachability;
    }
  });

  if (_.size(valids) <= 1) {
    probe(this.service);
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

function whichRouter() {
  var loadBalance = this.service.config.get('loadBalance');
  switch(loadBalance) {
    case 'autoaware' : return autoaware;
    case 'roundRobin': return roundRobin;
    case 'random'    : return random;
    default:
      logger.fatal('Unsupported load balance: %j.', loadBalance);
  }
}

module.exports = Router;


