'use strict';

require('rootpath')();

var _          = require('underscore')
  , util       = require('util')
  , request    = require('request')
  , logger     = require('lib/logger')('post')
  , serializer = require('lib/serializer/')
  ;


function HttpConnector(hostport) {
  this.uri = 'http://' + hostport + '/service?serialize=' + serializer.SERIALIZE_ID;
}

HttpConnector.prototype.request = _request;

function _request(url, methodName, parameters, cb) {
  var body = {
    serialize  : serializer.SERIALIZE_ID,
    methodName : methodName,
    parameters : parameters
  };
  body[serializer.URL_FIELD] = url;

  try {
    body = serializer.serialize(body);
  }
  catch(err) {
    return cb && _.defer(cb(err));
  }

  var options = {
    uri : this.uri,
    json: !(Buffer.isBuffer(body) || _.isString(body)),
    body: body,
    encoding: null
  };
  logger.debug('Request options of service(%s) method(%s): %j.',
    url, methodName, options);

  request.post(options, function(err, response, body) {
    if (err) {
      logger.error('Request service(%s) method(%s) error ===> %j.',
        url, methodName, err);
      return cb(err);
    }

    if (response.statusCode !== 200) {
      var err = util.format(
        'Request service(%s) method(%s) error ===> status code(%d).',
        url, methodName, response.statusCode
      );
      logger.error(err);
      return cb(err);
    }

    try {
      body = serializer.deserialize(body);
    }
    catch(err) {
      return cb && cb(err);
    }

    cb(null, body[serializer.RESULT_FIELD]);
  });
}

/**
 * Component the request body for http request.
 * Now the request body supports the following parameters:
 * @body {seq}
 * @body {serialization} Serialization method.
 * @body {callType} Type of the method call. Default to 'async' in nodejs.
 * @body {timeout}
 * @body {methodName} Name of the service method to be called.
 * @body {parameters} Aray of the service method parameters.
 * @body {messageType}
 * @body {context}
 * @body {version}
 * @body {serviceName | url} URL of the service. Hessian: serviceName. JSON: url.
 */
function _requestBody(url, methodName, parameters) {

}

module.exports = HttpConnector;
