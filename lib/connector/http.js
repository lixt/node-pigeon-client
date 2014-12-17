// Root require.
require('rootpath')();

var util    = require('util')
  , request = require('request')
  , logger  = require('lib/logger')('post')
  ;

function HttpConnector(hostport) {
  this.uri = 'http://' + hostport + '/service?serialize=7';
}

HttpConnector.prototype.request = _request;

function _request(url, methodName, parameters, cb) {
  var options = {
    uri : this.uri,
    json: true,
    body: {
      url       : url,
      methodName: methodName,
      parameters: parameters,
      serialize : '7'
    }
  };
  logger.debug('Request options: %j', options);

  request.post(options, function(err, response, body) {
    if (err) {
      logger.error('Request error: ', err);
      return cb(err);
    }
    if (response.statusCode !== 200) {
      err = util.format('Response status code %d.', response.statusCode);
      logger.error('Request error: ', err);
      return cb(err);
    }

    cb(body.response);
  });
}

module.exports = HttpConnector;
