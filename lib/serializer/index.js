'use strict';

require('rootpath')();

var logger   = require('lib/logger')('serializer')
  , config   = require('lib/config')
  , hessian  = require('lib/serializer/hessian')
  , json     = require('lib/serializer/json')
  , protobuf = require('lib/serializer/protobuf')
  ;

/*
 *
 * Constants.
 *
 */
var SERIALIZE_ID = _polySerializer().SERIALIZE_ID
  , URL_FIELD    = _polySerializer().URL_FIELD
  , RESULT_FIELD = _polySerializer().RESULT_FIELD
  ;

function serialize(body) {
  try {
    return _polySerializer().serialize(body);
  }
  catch(err) {
    throw err;
  }
}

function deserialize(body) {
  try {
    return _polySerializer().deserialize(body);
  }
  catch(err) {
    throw err;
  }
}

function _polySerializer() {
  var serialize = config.get('serialize');
  switch(serialize) {
    case 'hessian' : return hessian;
    case 'json'    : return json;
    case 'protobuf': return protobuf;
    default:
      logger.fatal('Unsupported serialize: %j.', serialize);
  }
}

module.exports = {
  SERIALIZE_ID: SERIALIZE_ID,
  URL_FIELD   : URL_FIELD,
  RESULT_FIELD: RESULT_FIELD,
  serialize   : serialize,
  deserialize : deserialize
};