'use strict';

require('rootpath')();

var fs     = require('fs')
  , _      = require('underscore')
  , parser = require('properties-parser')
  ;

// Constants.
var APPENV_PATH = '/data/webapps/appenv';
var ENVS = [
  'local',
  'dev',
  'alpha',
  'beta',
  'qa',
  'prelease',
  'product'
];

function init() {
  if (fs.existsSync(APPENV_PATH)) {
    var properties = parser.read(APPENV_PATH);
    if (properties && _.contains(ENVS, properties['deployenv'])) {
      process.env.NODE_ENV = properties['deployenv'];
    }
  }
}

module.exports = init;

