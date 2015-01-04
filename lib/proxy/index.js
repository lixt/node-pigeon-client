'use strict';

/**
 * Proxy.
 * This module is designed to retrieve a proxy of the service in order to make
 * the remote service act like a local one.
 *
 * Module relationships:
 * Index ---> Proxy ---> Reflector
 */

require('rootpath')();
require('harmonize')();
require('harmony-reflect');

var logger   = require('lib/logger')('proxy');

function Proxy(service) {
  this.service = service;
}

Proxy.prototype.proxy = function proxy() {
  logger.debug('Proxy: service(%s).', this.service.url);

  var that = this;

  return new Proxy(this.service, {
    get: function get(target, method) {
      if (!target[method]) {
        target[method] = that.service.reflector.reflect(method);
      }
      return target[method];
    }
  });
};

module.exports = Proxy;
