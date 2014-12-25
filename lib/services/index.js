'use strict';

require('rootpath')();

var _      = require('underscore')
  , Router = require('lib/service/router/')
  ;

function Service(url) {
  this.__internal__ = {
    url   : url,
    router: new Router()
  };
}

Service.prototype.__get__ = function get(ip) {
  if (_.isNull(ip) || _.isUndefined(ip)) {
    return this.__internal__.router.loadBalances;
  }

  return this.__internal__.router.loadBalances[ip];
};

Service.prototype.__set__ = function set(ip, weight) {
  this.__internal__.router.loadBalances[ip] = weight;
};

Service.prototype.__clear__ = function clear() {
  this.__internal__.router.loadBalances = {};
}

module.exports = Service;

