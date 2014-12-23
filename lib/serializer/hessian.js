'use strict';

require('rootpath');

var hessian = require('hessian.js');

/*
 *
 * Constants.
 *
 */
var SERIALIZE_ID = 2
  , URL_FIELD    = 'serviceName'
  , RESULT_FIELD = 'returnVal'
  ;

function serialize(body) {
  body = {
    $class: 'com.dianping.dpsf.protocol.DefaultRequest',
    $: body
  };

  try {
    return hessian.encode(body, '2.0');
  }
  catch(err) {
    throw err;
  }
}

function deserialize(body) {
  try {
    return hessian.decode(body, '2.0');
  }
  catch(err) {
    throw err;
  }
}

module.exports = {
  SERIALIZE_ID: SERIALIZE_ID,
  URL_FIELD   : URL_FIELD,
  RESULT_FIELD: RESULT_FIELD,
  serialize   : serialize,
  deserialize : deserialize
};
