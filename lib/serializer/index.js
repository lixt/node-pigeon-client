'use strict';

require('rootpath')();

var logger   = require('lib/logger')('serializer')
  , hessian  = require('lib/serializer/hessian')
  , json     = require('lib/serializer/json')
  , protobuf = require('lib/serializer/protobuf')
  ;

function Serializer(configs) {
  this.serializer   = whichSerializer(configs);
  this.SERIALIZE_ID = this.serializer.SERIALIZE_ID;
  this.URL_FIELD    = this.serializer.URL_FIELD;
  this.RESULT_FIELD = this.serializer.RESULT_FIELD;
}

Serializer.prototype.serialize = function serialize(body) {
  try {
    return this.serializer.serialize(body);
  }
  catch(err) {
    throw err;
  }
};

Serializer.prototype.deserialize = function deserialize(body) {
  try {
    return this.serializer.deserialize(body);
  }
  catch(err) {
    throw err;
  }
};

function whichSerializer(config) {
  var serialize = config.get('serialize');
  switch(serialize) {
    case 'hessian' : return hessian;
    case 'json'    : return json;
    case 'protobuf': return protobuf;
    default:
      logger.fatal('Unsupported serialize: %j.', serialize);
  }
}

module.exports = Serializer;
