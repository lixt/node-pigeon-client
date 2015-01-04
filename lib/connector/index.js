'use strict';

/**
 * Connector.
 * This module is designed to make request to the server for network probe or
 * remote service call.
 *
 * Module relationships:
 * (Prober, Reflector) ---> Connector ---> Serializer
 */

require('rootpath')();

var logger        = require('lib/logger')
  , TcpConnector  = require('lib/connector/tcp')
  , HttpConnector = require('lib/connector/http')
  ;

function Connector(service) {
  this.service   = service;
  this.connector = whichConnector(service.configs)(service);
}

Connector.prototype.connect
  = function connect(hostport, methodName, params, cb) {

  this.connector.connect(hostport, methodName, params, cb);
};

function whichConnector(configs) {
  var protocol = configs.get('protocol');
  switch(protocol) {
    case 'tcp' : return TcpConnector;
    case 'http': return HttpConnector;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}

module.exports = Connector;

