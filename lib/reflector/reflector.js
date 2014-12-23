'use strict';

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , util      = require('util')
  , shimmer   = require('shimmer')
  , args      = require('arguments-extended')
  , logger    = require('lib/logger')('reflector')
  , config    = require('lib/config')
  , registry  = require('lib/registry/')
  , Connector = require('lib/connector/')
  , Router    = require('lib/invoker/router')
  ;

function reflect(url, service, cb) {
  var router = new Router();

  async.waterfall([
    function(done) {
      registry.getServiceAddress(url, function(err, addresses) {
        if (err) {
          done(util.format('Get service(%s) address error: %j.', url, err));
        }

        logger.info('Get service(%s) address: %j.', url, addresses);
        router.addresses = addresses;
        done(null, addresses);
      });
    },
    function(addresses, done) {
      async.each(
        addresses,
        function(address, done_) {
          registry.getServerWeigth(address, function(err, weight) {
            if (err) {
              done_(util.format('Get service(%s) weight error: %j.', err));
            }

            logger.info('Get service(%s) address(%s) weight: %j.', url, address, weight);
            router.weights[address] = weight;
            done_();
          });
        },
        function(err) {
          done(err);
        }
      );
    }
  ], function(err) {
    if (err) {
      logger.error(err);
      return cb && cb(err);
    }

    service._router = router;
    _reflectMethods(url, service);
    cb(null, service);
  })
}

function _reflectMethods(url, service) {
  _.functions(service).forEach(function(methodName) {
    _reflectMethod(url, service, methodName);
  });
}

/**
 * Reflect the given method in a service.
 *
 * @param {string} URL URL of the service.
 * @param {object} SERVICE Service skeleton object.
 * @param {string} METHODNAME Name of the method.
 */
function _reflectMethod(url, service, methodName) {
  logger.debug('Reflect service(%s) method(%s).', url, methodName);

  shimmer.wrap(service, methodName, function() {
    return function() {
      var params
        , cb = _.last(arguments)
        ;

      if (_.isFunction(cb)) {
        params = _.initial(arguments);
      } else {
        params = arguments;
        cb = null;
      }

      var connector = new Connector(service._router.next());
      connector.request(url, methodName, params, cb);
    };
  });
}

module.exports = reflect;
