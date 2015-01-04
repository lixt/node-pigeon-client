'use strict';

require('rootpath')();

var Config     = require('lib/config')
  , Registry   = require('lib/registry/')
  , Proxy      = require('lib/proxy/')
  , Reflector  = require('lib/reflector/')
  , Prober     = require('lib/prober/')
  , Connector  = require('lib/connector/')
  , Serializer = require('lib/serializer/')
  , Router     = require('lib/service/router/')
  ;

function Service(url, configs) {
  this.url        = url;
  this.configs    = new Config(configs);

  this.registry   = new Registry(this);
  this.proxy      = new Proxy(this);
  this.reflector  = new Reflector(this);
  this.prober     = new Prober(this);
  this.connector  = new Connector(this);
  this.serializer = new Serializer(this);
  this.router     = new Router(this);
}

module.exports = Service;

