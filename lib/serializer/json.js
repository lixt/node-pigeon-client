'use strict';

require('rootpath');

/*
 *
 * Constants.
 *
 */
var SERIALIZE_ID = 7
  , URL_FIELD    = 'url'
  , RESULT_FIELD = 'response'
  ;

function serialize(body) {
  return body;
}

function deserialize(body) {
  return body;
}

module.exports = {
  SERIALIZE_ID: SERIALIZE_ID,
  URL_FIELD   : URL_FIELD,
  RESULT_FIELD: RESULT_FIELD,
  serialize   : serialize,
  deserialize : deserialize
};
