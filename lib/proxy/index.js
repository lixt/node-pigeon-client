'use strict';

require('rootpath')();
require('harmonize')();
require('harmony-reflect');

var util     = require('util')
  , logger   = require('lib/logger')('proxy')
  , registry = require('lib/registry/')
  , reflect  = require('lib/reflect/')
  ;

function proxy(service, cb) {
  logger.debug('Proxy service(%s).', service.url);

  registry.subscribe(service, function(err) {
    if (err) {
      return cb(util.format('Service(%s) subscribe from ' +
        'registry error ===> %j', service.url, err));
    }

    var proxyService = new Proxy(service, {
      get: function get(target, methodName) {
        if (!target[methodName]) {
          target[methodName] = reflect(service, methodName);
        }
        return target[methodName];
      }
    });

    cb(null, proxyService);
  });
}

module.exports = proxy;
