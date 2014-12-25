'use strict';

require('rootpath')();

var util    = require('util')
  , logger  = require('lib/logger')('index')
  , Service = require('lib/service/')
  , proxy   = require('lib/proxy/')
  ;

function getService(url, cb) {
  var service = new Service(url);

  proxy(service, function(err, proxyService) {
    if (err) {
      var err = util.format('Get service(%s) error ===> %j', url, err);
      logger.error(err);
      return cb(err);
    }

    cb(null, proxyService);
  });
}

module.exports = {
  getService: getService
};