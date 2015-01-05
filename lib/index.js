'use strict';

require('rootpath')();

var _        = require('underscore')
  , Error    = require('lib/error')
  , logger   = require('lib/logger')('index')
  , Service  = require('lib/service/')
  , java     = require('lib/util/java')
  ;

function getService(url, configs, cb) {
  if (arguments.length <= 1) {
    logger.fatal('Too little arguments supplied in `getService`.');
  } else if (arguments.length === 2) {
    cb = configs;
    configs = null;
  } else if (arguments.length > 3) {
    logger.fatal('Too many arguments supplied in `getService`.');
  }

  if (!_.isFunction(cb)) {
    logger.fatal('A callback must be supplied as the last argument ' +
      'in `getService`.');
  }

  var service = new Service(url, configs);

  service.registry.startup(function(err) {
    if (err) {
      // TOP ERROR!
      var toperr = new Error('top', 'Zookeeper error(%s): ' +
        'service(%s).', err.info, url);
      logger.error(toperr.info);
      cb(toperr.info);
      return;
    }

    service.registry.subscribe(function(err) {
      if (err) {
        // TOP ERROR!
        var toperr = new Error('top', 'Zookeeper error(%s): ' +
          'service(%s).', err.info, url);
        logger.error(toperr.info);
        cb(toperr.info);
        return;
      }

      cb(null, service.proxy.proxy());
    });
  });
}

module.exports = {
  getService: getService,
  java      : java
};