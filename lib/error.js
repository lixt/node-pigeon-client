'use strict';

require('rootpath')();

var util = require('util');

function Error(type) {
  this.type = type;
  this.info = util.format.apply(util, Array.prototype.slice.call(arguments, 1));
}

module.exports = Error;


