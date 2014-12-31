'use strict';

/**
 * Prober.
 * This module is designed to probe the network connection between Pigeon
 * server and client. The prober will be triggered if the service router
 * finds too little available server IPs.
 *
 * Module relationships:
 * Router ---> Prober
 */

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , logger    = require('lib/logger')('probe')
  ;

function Prober(service) {
  this.service = service;
}

Prober.prototype.probe = function probe(done) {
  logger.debug('Start probe: service(%s), router status(%j).',
    this.service.url, this.service.router.status);

  var that = this;

  async.each(
    this.service.router.probes(),
    function(ip, eachdone) {
      that.service.connector.connect(ip, function(err) {
        that.service.router.status[ip].reachability
          = (_.isEqual(err.type, 'network')) ? 0 : 1;
        eachdone();
      });
    },
    function() {
      logger.debug('End probe: service(%s), router status(%j).',
        that.service.url, that.service.router.status);
      done && done()
    }
  );
};

module.exports = Prober;

/*
function probe(service, done) {
  logger.debug('Start probe service(%s), states: %j.',
    service.url, service.router.status);

  async.each(
    getProbeIPs(service),
    function(ip, doneEach) {
      (new Connector(ip)).request(function(err) {
        service.router.status[ip].reachability = (err && err.network) ? 0 : 1;
        doneEach();
      });
    },
    function() {
      logger.debug('End probe service(%s), states: %j.',
        service.url, service.router.status);
      done && done();
    }
  );
}

function getProbeIPs(service) {
  return service.router.probes();
}

module.exports = probe;
*/
