'use strict';

require('rootpath')();

var Config = require('lib/config')
  , Router = require('lib/service/router/')
  ;

function Service(url, configs) {
  this.url    = url;
  this.config = new Config(configs);
  this.router = new Router(this);
}

module.exports = Service;

