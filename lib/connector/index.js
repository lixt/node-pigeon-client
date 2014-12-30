'use strict';

require('rootpath')();

var util          = require('util')
  , logger        = require('lib/logger')
  , config        = require('lib/config')
  , HttpConnector = require('lib/connector/http')
  , TcpConnector  = require('lib/connector/tcp')
  ;

function Connector(hostport) {
  whichConnector().call(this, hostport);
}
util.inherits(Connector, whichConnector());

function whichConnector() {
  var protocol = config.get('protocol');
  switch(protocol) {
    case 'tcp' : return TcpConnector;
    case 'http': return HttpConnector;
    default:
      logger.fatal('Unsupported protocol: %j.', protocol);
  }
}

module.exports = Connector;

