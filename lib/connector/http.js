'use strict';

require('rootpath')();

var _          = require('underscore')
  , util       = require('util')
  , request    = require('request')
  , logger     = require('lib/logger')('httpConnector')
  , config     = require('lib/config')
  , serializer = require('lib/serializer/')
  ;

function HttpConnector(hostport) {
  this.uri = 'http://' + hostport + '/service?serialize=' + serializer.SERIALIZE_ID;
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
};

/*
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
    encoding: null,
    timeout: 2000
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
}*/

module.exports = HttpConnector;
