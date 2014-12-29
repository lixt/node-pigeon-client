'use strict';

require('rootpath')();

var Router = require('lib/service/router/');

function Service(url) {
  this.url    = url;
  this.router = new Router();
}

module.exports = Service;

