'use strict';

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , logger    = require('lib/logger')('probe')
  , Connector = require('lib/connector/')
  ;

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
