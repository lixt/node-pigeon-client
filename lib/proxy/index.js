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

function ServiceProxy(service) {
  this.service = service;
}

ServiceProxy.prototype.proxy = function proxy() {
  logger.debug('Proxy: service(%s).', this.service.url);

  var that = this;

  return new Proxy(this.service, {
    get: function (target, method) {
      if (!target.__method__[method]) {
        target.__method__[method] = that.service.reflector.reflect(method);
      }
      return target.__method__[method];
    }
  });
};

module.exports = ServiceProxy;
