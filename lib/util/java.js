'use strict';

require('rootpath');

var _      = require('underscore')
  , logger = require('lib/logger')
  , config = require('lib/config')
  ;

function java(type, value) {

  return {
    '$class': type,
    '$'     : value
  };
}

function NULL() {
  return null;
}

/*
 *
 * Primitives.
 *
 */
function int(value) {
  return java('int', value);
}

function long(value) {
  return java('long', value);
}

function double(value) {
  return java('double', value);
}

function boolean(value) {
  return java('boolean', value);
}

/*
 *
 * java.lang.*
 *
 */
function Integer(value) {
  return java('java.lang.Integer', value);
}

function Long(value) {
  return java('java.lang.Long', value);
}

function Double(value) {
  return java('java.lang.Double', value);
}

function Boolean(value) {
  return java('java.lang.Boolean', value);
}

function String(value) {
  return java('java.lang.String', value);
}

function Object(object) {
  return object;
}

/*
 *
 * java.util.*
 *
 */
function List(type, values) {
  values = values.map(function(value) {
    return java(type, value);
  });
  return values;
}

List.int = _.bind(List, null, 'int');
List.Integer = _.bind(List, null, 'java.lang.Integer');
List.String = _.bind(List, null, 'java.lang.String');

function Map(type, map) {
  _.each(map, function(value, key) {
    map[key] = java(type, value);
  });
  return java('java.util.Map', map);
}

function Date(date) {
  return java('java.util.Date', date);
}

function Class(classname, value) {
  return java(classname, value);
}

var that = module.exports = {
  null   : NULL,

  int    : int,
  long   : long,
  double : double,
  boolean: boolean,

  Integer: Integer,
  Long   : Long,
  Double : Double,
  Boolean: Boolean,
  String : String,
  Object : Object,

  List   : List,
  Map    : {
    int    : _.bind(Map, that, 'int'),
    Integer: _.bind(Map, that, 'java.lang.Integer'),
    String : _.bind(Map, that, 'java.lang.String')
  },
  Date   : Date,
  Class  : Class
};
