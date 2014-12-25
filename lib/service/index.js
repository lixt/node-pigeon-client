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

Service.prototype.__clear__ = function clear(ips) {
  if (_.isNull(ips) || _.isUndefined(ips)) {
    this.__internal__.router.loadBalances = {};
    return;
  }

  if (!_.isArray(ips)) {
    ips = [ips];
  }

  var that = this;
  ips.forEach(function(ip) {
    delete that.__internal__.router.loadBalances[ip];
  });
}

module.exports = Service;

