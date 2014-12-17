'use strict';

require('rootpath')();

var util          = require('util')
  , logger        = require('lib/logger')
  , config        = require('lib/config')
  , HttpConnector = require('lib/connector/http')
  , TcpConnector  = require('lib/connector/tcp')
  ;

function Connector(hostport) {
  var protocol = config.get('protocol');

  switch(protocol) {
    case 'http':
      HttpConnector.call(this, hostport);
      break;
    case 'tcp':
      TcpConnector.call(this, hostport);
      break;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}
util.inherits(Connector, HttpConnector);

module.exports = Connector;

