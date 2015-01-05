'use strict';

/**
 * HttpConnector.
 * This module is designed to make http post request to the server for network
 * probe or remote service call.
 *
 * Module relationship:
 * Connector = HttpConnector || TcpConnector
 */

require('rootpath')();

var _          = require('underscore')
  , request    = require('request')
  , Error      = require('lib/error')
  , logger     = require('lib/logger')('httpConnector')
  , serializer = require('lib/serializer/')
  ;

function HttpConnector(service) {
  this.service = service;
}

HttpConnector.prototype.connect =
  function connect(hostport, method, params, cb) {

  (arguments.length === 4)
    ? rpcConnect(this, hostport, method, params, cb)
    : probeConnect(this, hostport, method);
};

function rpcConnect(context, hostport, method, params, cb) {
  logger.debug('RPC connection: service(%s), hostport(%s), method(%s)' +
    ', params(%j).', context.service.url, hostport, method, params);

  var body = {
    serialize  : context.service.serializer.SERIALIZE_ID,
    methodName : method,
    parameters : params
  };
  body[context.service.serializer.URL_FIELD] = context.service.url;

  try {
    body = context.service.serializer.serialize(body);
  }
  catch(err) {
    // RAW ERROR!
    return _.defer(function() { cb(new Error('Serialization', err)); });
  }

  var options = {
    uri     : 'http://' + hostport + '/service?serialize='
              + context.service.serializer.SERIALIZE_ID,
    encoding: null,
    timeout : context.service.configs.get('timeout'),
    body    : body
  };

  logger.debug('RPC connection: service(%s), request options(%j).',
    context.service.url, options);

  request.post(options, function(err, response, body) {
    if (err) {
      // RAW ERROR!
      return cb(new Error('Network', err));
    }

    if (response.statusCode !== 200) {
      // RAW ERROR!
      return cb(new Error('Server', 'Status code: %d', response.statusCode));
    }

    try {
      body = context.service.serializer.deserialize(body);
    }
    catch(err) {
      // RAW ERROR!
      return cb(new Error('Deserialization', err));
    }

    cb(null, body[context.service.serializer.RESULT_FIELD]);
  });
}

function probeConnect(context, hostport, cb) {
  logger.debug('Probe connection: service(%s), hostport(%s).',
    context.service.url, hostport);

  var options = {
    uri     : 'http://' + hostport + '/service?serialize='
    + context.service.serializer.SERIALIZE_ID,
    encoding: null,
    timeout : context.service.configs.get('timeout')
  };

  logger.debug('Probe connection: service(%s), hostport(%s).',
    context.service.url, hostport);

  request.post(options, function(err, response) {
    if (err) {
      // RAW ERROR!
      return cb(new Error('Network', err));
    }

    if (response.statusCode !== 200) {
      // RAW ERROR!
      return cb(new Error('Server', 'Status code: %d', response.statusCode));
    }
  });
}

module.exports = HttpConnector;
