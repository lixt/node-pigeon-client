'use strict';

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , logger    = require('lib/logger')
  , Connector = require('lib/connector/')
  ;

function probe(service, done) {
  logger.debug('Start probe service(%s), states: %j.',
    service.url, service.router.states);

  async.each(
    getProbeIPs(),
    function(ip, doneEach) {
      (new Connector(ip)).request(function(err) {
        service.router.states[ip] = (err && err.network) ? 0 : 1;
        doneEach();
      });
    },
    function() {
      logger.debug('End probe service(%s), states: %j.',
        service.url, service.router.states);
      done();
    }
  );
}

function getProbeIPs(service) {
  return service.probes();
}

module.exports = probe;
