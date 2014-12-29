'use strict';

require('rootpath')();

var util      = require('util')
  , _         = require('underscore')
  , logger    = require('lib/logger')('reflect')
  , Connector = require('lib/connector/')
  ;

function reflect(service, methodName) {
  logger.debug('Reflect service(%s) method(%s).', service.url, methodName);

  return function() {
    var params = _.initial(arguments)
      , cb     = _.last(arguments)
      ;

    if (!cb || !_.isFunction(cb)) {
      logger.fatal('A callback must be provided as the last ' +
        'argument in service method.');
    }

    var ip = service.router.next();
    if (_.isNull(ip) || _.isUndefined(ip)) {
      var err = util.format('No valid ip address for ' +
        'service(%s) method(%s)', service.url, methodName);
      return _.defer(cb(err));
    }

    (new Connector(ip)).request(url, methodName, params, cb);
  };
}

module.exports = reflect;