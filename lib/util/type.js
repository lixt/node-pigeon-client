'use strict';

require('rootpath');

var _ = require('underscore');

/*
 *
 * Constants.
 *
 */
var PRIMITIVES = [
  'int',
  'long',
  'double',
  'boolean',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Double',
  'java.lang.Boolean',
  'java.lang.String',
  'java.util.Date'
];

function check(javaObject) {
  if (javaObject['$err']) {
    return javaObject['$err'];
  }

  if (_.contains(PRIMITIVES, javaObject['$class'])) {
    return null;
  }

  var err = null;
  _.each(javaObject['$'], function(field) {
    var fielderr = check(field);
    if (fielderr && !err) {
      err = fielderr;
    }
  });

  return err;
}

function isJava(javaObject) {
  if (javaObject['$err']) {
    return javaObject['$err'];
  }

  if (_.contains(PRIMITIVES, javaObject['$class'])) {
    return true;
  }

  var err;
  var result = _.every(javaObject['$'], function(i) {
    var result = isJava(i);

    if (result === true) {
      return true;
    } else {
      err = result;
      return false;
    }
  });

  if (result === true) {
    return true;
  } else {
    return err;
  }
}

/**
 * int.
 * MIN_INT <= int < MAX_INT
 */
var MAX_INT = +Math.pow(2, 31)
  , MIN_INT = -Math.pow(2, 31)
  ;
function isint(jsObject) {
  return _.isNumber(jsObject) && jsObject % 1 === 0
    && jsObject >= MIN_INT && jsObject < MAX_INT;
}

/**
 * long.
 * MIN_LONG <= long < MAX_LONG
 */
var MAX_LONG = +Math.pow(2, 63)
  , MIN_LONG = -Math.pow(2, 63)
  ;
function islong(jsObject) {
  return _.isNumber(jsObject) && jsObject % 1 === 0
    && jsObject >= MIN_LONG && jsObject < MAX_LONG;
}

/**
 * double.
 */
function isdouble(jsObject) {
  return _.isNumber(jsObject)
}

/**
 * boolean.
 */
function isboolean(jsObject) {
  return _.isBoolean(jsObject);
}

/**
 * java.lang.Integer.
 */
function isInteger(jsObject) {
  return isint(jsObject);
}

/**
 * java.lang.Long.
 */
function isLong(jsObject) {
  return islong(jsObject);
}

/**
 * java.lang.Double.
 */
function isDouble(jsObject) {
  return isdouble(jsObject);
}

/**
 * java.lang.Boolean.
 */
function isBoolean(jsObject) {
  return isboolean(jsObject);
}

/**
 * java.lang.String.
 */
function isString(jsObject) {
  return _.isString(jsObject);
}

/**
 * java.lang.Object.
 */
function isObject(jsObject) {
  return _.isObject(jsObject) && !_.isArray(jsObject) && !_.isFunction(jsObject);
}

/**
 * user defined.
 */
function isClass(jsObject) {
  return isObject(jsObject);
}

/**
 * java.util.Date.
 */
function isDate(jsObject) {
  return _.isDate(jsObject);
}

/**
 * array.
 */
function isarray(jsObject) {
  return _.isArray(jsObject);
}

/**
 * java.util.List.
 */
function isList(jsObject) {
  return _.isArray(jsObject);
}

/**
 * java.util.Map.
 */
function isMap(jsObject) {
  return isObject(jsObject);
}

module.exports = {
  check    : check,
  isint    : isint,
  islong   : islong,
  isdouble : isdouble,
  isboolean: isboolean,
  isInteger: isInteger,
  isLong   : isLong,
  isDouble : isDouble,
  isBoolean: isBoolean,
  isString : isString,
  isObject : isObject,
  isClass  : isClass,
  isDate   : isDate,
  isarray  : isarray,
  isList   : isList,
  isMap    : isMap
};