'use strict';

// Root require.
require('rootpath')();

var config = require('config')
  , logger = require('lib/logger')
  ;

var configs = {}

function init() {
  configs.zkserver = config.get('zkserver') || '127.0.0.1:2181';
}

function get(key) {
  return configs[key];
}

module.exports = init;
module.exports.get = get;
