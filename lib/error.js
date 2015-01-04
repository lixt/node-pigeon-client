'use strict';

require('rootpath')();

var util = require('util');

function Error(type) {
  this.type = type;
  this.info = util.format(arguments.slice(1));
}

module.exports = Error;


