'use strict';

/**
 * Router.
 * This module is designed to route the remote service call for the client.
 *
 * Module dependencies:
 *
 */

require('rootpath')();

/*
 *
 * Constants.
 *
 */
var PROBE_INTERVAL = 60 * 1000; // MilliSecond.

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
  this.timestamp = Date.now();
}

Router.prototype.next = function() {
  return whichRouter(this.service.configs).next(this);
};

Router.prototype.nexts = function() {
  var valids = {};
  _.each(this.status, function(status, ip) {
    if (status.loadBalance !== 0 && status.reachability !== 0) {
      valids[ip] = status.loadBalance + status.reachability;
    }
  });

  if (_.size(valids) <= 1 && (Date.now() - this.timestamp) > PROBE_INTERVAL) {
    this.timestamp = Date.now();
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


