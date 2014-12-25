'use strict';

require('rootpath')();
require('harmonize')();

var Service = require('lib/reflector/service')
  , reflector = require('lib/reflector/reflector')
  ;

function getService(url) {
  var service = new Service(url);

  var proxied = new Proxy(service, {
    get: function(target, methodName, receiver) {
      var method = target[methodName];

      if (method) {
        return method;
      }

      target[methodName] = reflector.reflect(service, methodName);
      return target[methodName];
    }
  });

  return proxied;
}

module.exports = {
  getService: getService
};
