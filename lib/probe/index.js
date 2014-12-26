'use strict';

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , logger    = require('lib/logger')
  , Connector = require('lib/connector/')
  ;

function probe(service, done) {
  logger.debug('Start probe service(%s), load balance: %j.',
    service.url, service.router.loadBalances);

  async.each(
    getProbeIPs(),
    function(ip, doneEach) {
      (new Connector(ip)).request(function(err) {
        service.access(ip, err ? false : true);
        doneEach();
      });
    },
    function() {
      logger.debug('End probe service(%s), load balance: %j.',
        service.url, service.router.loadBalances);
      done();
    }
  );
}

function getProbeIPs(service) {
  return service.unaccessibles();
}

module.exports = probe;
