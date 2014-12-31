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

var util          = require('util')
  , logger        = require('lib/logger')
  , config        = require('lib/config')
  , HttpConnector = require('lib/connector/http')
  , TcpConnector  = require('lib/connector/tcp')
  ;

function Connector(service) {
  this.connector = whichConnector(configs);
}

Connector.prototype.request =
  function request(hostport, url, methodName, params, cb) {

  this.connector.request(hostport, url, methodName, params, cb);
};

function whichConnector(config) {
  var protocol = config.get('protocol');
  switch(protocol) {
    case 'tcp' : return TcpConnector;
    case 'http': return HttpConnector;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}

module.exports = Connector;

