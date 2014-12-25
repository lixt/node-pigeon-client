'use strict';

require('rootpath')();

var _         = require('underscore')
  , logger    = require('lib/logger')('reflect')
  , Connector = require('lib/connector/')
  ;

function reflect(service, methodName) {
  var url = service.__internal__.url;

  logger.debug('Reflect service(%s) method(%s).', url, methodName);

  return function() {
    var params = _.initial(arguments)
      , cb     = _.last(arguments)
      ;

    if (!cb || !_.isFunction(cb)) {
      logger.fatal('A callback must be provided as the last ' +
        'argument in service method.');
    }

    var connector = new Connector(service.__internal__.router.next());
    connector.request(service.__internal__.url, methodName, params, cb);
  };
}

module.exports = reflect;