'use strict';

require('rootpath')();
require('harmonize')();

var logger   = require('lib/logger')
  , registry = require('lib/registry/')
  , reflect  = require('lib/reflect/')
  ;

function proxy(service, cb) {
  var url = service.__internal__.url;
  logger.debug('Proxy service(%s).', service.__internal__.url);

  registry.subscribe(
    service,
    function doneNotify(err) {
      if (err) {
        cb(util.format('Registry notify service(%s) ' +
          'error ===> %j', url, err));
      }
    },
    function doneSubscribe(err) {
      if (err) {
        return cb(util.format('Service(%s) subscribe ' +
          'from registry error ===> %j', url, err));
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
    }
  );
}

module.exports = proxy;
