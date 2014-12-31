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
  , util       = require('util')
  , request    = require('request')
  , logger     = require('lib/logger')('httpConnector')
  , config     = require('lib/config')
  , serializer = require('lib/serializer/')
  ;

function HttpConnector(service) {
  this.service = service;
}

HttpConnector.prototype.connect =
  function connect(hostport, method, params, cb) {

  (arguments.length === 4)
    ? rpcConnect(this, hostport, method, params, cb)
    : probeConnect(this, hostport, cb);
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
    return _.defer(function() { cb(new Error('user || client', err)); });
  }

  var options = {
    uri     : 'http://' + hostport + '/service?serialize='
              + this.service.serializer.SERIALIZE_ID,
    encoding: null,
    timeout : this.service.configs.get('timeout'),
    body    : body
  };

  logger.debug('RPC connection: service(%s), request options(%s).',
    context.service.url, options);

  request.post(options, function(err, response, body) {
    if (err) {
      // RAW ERROR!
      return cb(new Error('network', err));
    }

    if (response.statusCode !== 200) {
      // RAW ERROR!
      return cb(new Error('server', 'Status code: %d', response.statusCode));
    }

    try {
      body = context.service.serializer.deserialize(body);
    }
    catch(err) {
      // RAW ERROR!
      return cb(new Error('client || server', err));
    }

    cb(null, body[context.serializer.RESULT_FIELD]);
  });
}

function probeConnect(context, hostport, cb) {
  logger.debug('Probe connection: service(%s), hostport(%s).',
    context.service.url, hostport);

  var options = {
    uri     : 'http://' + hostport + '/service?serialize='
    + this.service.serializer.SERIALIZE_ID,
    encoding: null,
    timeout : this.service.configs.get('timeout')
  };

  logger.debug('Probe connection: service(%s), hostport(%s).',
    context.service.url, hostport);

  request.post(options, function(err, response, body) {
    if (err) {
      // RAW ERROR!
      return cb(new Error('network', err));
    }

    if (response.statusCode !== 200) {
      // RAW ERROR!
      return cb(new Error('server', 'Status code: %d', response.statusCode));
    }
  });
}

module.exports = HttpConnector;

/*
function HttpConnector(hostport, config) {
  this.uri = 'http://' + hostport + '/service?serialize=' + serializer.SERIALIZE_ID;
  this.config = config;
}

HttpConnector.prototype.request = function httpRequest(url, methodName, parameters, cb) {
  var options = {
    uri: this.uri,
    encoding: null,
    //timeout: config.get('timeout')
    timeout: 2000
  };

  // Prober.
  if (arguments.length === 1) {
    cb = url;

    request.post(options, function(err) {
      if (err) {
        err.network = true;
      }
      cb(err);
    });

    return;
  }

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
    console.log(err);
    return cb && _.defer(function() { cb(err); });
  }

  options.body = body;
  logger.debug('Request options of service(%s) method(%s): %j.',
    url, methodName, options);

  request.post(options, function(err, response, body) {
    if (err) {
      err.errinfo = err;
      err.network = true;
      return cb(err);
    }

    if (response.statusCode !== 200) {
      return cb(util.format('Request service(%s) method(%s) error ===> ' +
        'status code(%d)', url, methodName, response.statusCode));
    }

    try {
      body = serializer.deserialize(body);
    }
    catch(err) {
      return cb(err);
    }

    cb(null, body[serializer.RESULT_FIELD]);
  });
};*/
