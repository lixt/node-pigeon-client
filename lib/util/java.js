'use strict';

require('rootpath');

var logger = require('lib/logger')
  , config = require('lib/config')
  ;

function java(type, value) {
  return {
    '$class': type,
    '$'     : value
  };
}

/*
 *
 * Primitives.
 *
 */
function byte(value) {
  return java('byte', value);
}

function short(value) {
  return java('java.lang.Short', value);
}

function int(value) {
  return java('int', value);
}

function long(value) {
  return java('long', value);
}

function float(value) {
  return java('float', value);
}

function double(value) {
  return java('double', value);
}

function boolean(value) {
  return java('boolean', value);
}

function char(value) {
  return java('char', value);
}

/*
 *
 * java.lang.*
 *
 */
function Byte(value) {
  return java('java.lang.Byte', value);
}

function Short(value) {
  return java('java.lang.Short', value);
}

function Integer(value) {
  return java('java.lang.Integer', value);
}

function Long(value) {
  return java('java.lang.Long', value);
}

function Float(value) {
  return java('java.lang.Float', value);
}

function Double(value) {
  return java('java.lang.Double', value);
}

function Boolean(value) {
  return java('java.lang.Boolean', value);
}

function Character(value) {
  return java('java.lang.Character', value);
}

function String(value) {
  return java('java.lang.String', value);
}

/*
 *
 * java.util.*
 *
 */
function List(value) {
  return java('java.util.List', value);
}

function Map(value) {
  return java('java.util.Map', value);
}

/*
 *
 * User-Defined.
 *
 */
function Class(classname, value) {
  return java(classname, value);
}

module.exports = {
  byte   : byte,
  short  : short,
  int    : int,
  long   : long,
  float  : float,
  double : double,
  boolean: boolean,
  char   : char,

  Short  : Short,
  Integer: Integer,
  Long   : Long,
  Float  : Float,
  Double : Double,
  Boolean: Boolean,
  Character: Character,

  Class  : Class
}
