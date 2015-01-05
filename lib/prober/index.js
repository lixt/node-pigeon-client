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
  , logger    = require('lib/logger')('prober')
  ;

function Prober(service) {
  this.service = service;
}

Prober.prototype.probe = function probe(done) {
  logger.debug('Probe: start probe, router status(%j), service(%s).',
    this.service.router.status, this.service.url);

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
      logger.debug('Probe: end probe, router status(%j), service(%s).',
        that.service.router.status, that.service.url);
      done && done()
    }
  );
};

module.exports = Prober;
