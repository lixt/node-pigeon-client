'use strict';

/**
 * Reflector.
 * This module is designed to reflect the remote service procedure call.
 * All the remote service method call to the Pigeon server is wrapped here.
 *
 * Module relationships:
 * Proxy ---> Reflector ---> Connector
 */

require('rootpath')();

var _         = require('underscore')
  , async     = require('async')
  , Error     = require('lib/error')
  , logger    = require('lib/logger')('reflect')
  , type      = require('lib/util/type')
  ;

function Reflector(service) {
  this.service = service;
}

Reflector.prototype.reflect = function reflect(method) {
  logger.debug('Reflect: service(%s), method(%s).',
    this.service.url, method);

  var that = this;

  return function() {
    var params = _.initial(arguments)
      , cb     = _.last   (arguments)
      ;

    logger.debug('RPC: start RPC, service(%s), method(%s), params(%j).',
      that.service.url, method, params);

    // Callback checking.
    if (!cb || !_.isFunction(cb)) {
      // FATAL ERR!
      logger.fatal('Fatal error: A callback must be provided as the last ' +
        'argument in service(%s) method(%s).',that.service.url, method);
    }

    // Parameter checking.
    var errparam = _.find(params, function(param) {
      return type.check(param) ? true : false;
    });

    if (errparam) {
      _.defer(function() {
        // TOP ERROR!
        var toperr = new Error('top', 'Parameter error(%s), service(%s), ' +
          'method(%s), params(%j).', type.check(errparam).info, that.service.url, method, params);
        logger.error(toperr.info);
        cb(toperr.info);
      });
      return;
    }


    var retries = that.service.configs.get('retries');

    async.whilst(
      function() {
        return retries-- >= 0;
      },
      function(whilstdone) {
        var ip = that.service.router.next();
        if (!ip) {
          _.defer(function() {
            // TOP ERROR!
            var toperr = new Error('top', 'Network error(%s), ' +
              'service(%s), method(%s), params(%j).', 'No available servers',
              that.service.url, method, params);
            logger.error(toperr.info);
            cb(toperr.info);
            whilstdone(1);
          });
        } else {
          that.service.connector.connect(ip, method, params, function(err, result) {
            if (err && err.type === 'Network') {
              that.service.router.status[ip].reachability = 0;

              if (retries < 0) {
                // TOP ERROR!
                var toperr = new Error('top', 'Network error(%s), ' +
                  'service(%s), method(%s), params(%j).', err.info, that.service.url,
                  method, params);
                logger.error(toperr.info);
                cb(toperr.info);
                return whilstdone(1);
              }

              return whilstdone();
            }

            that.service.router.status[ip].reachability = 1;

            if (err) {
              // TOP ERROR!
              var toperr = new Error('top', '%s error(%s), service(%s), method(%s), ' +
                'params(%j).', err.type, err.info, that.service.url, method, params);
              logger.error(toperr.info);
              cb(toperr.info);
              return whilstdone(1);
            }

            cb(err, result);
            return whilstdone(1);
          });
        }
      },
      function() {
        logger.debug('RPC: end RPC, service(%s), method(%s), params(%j).',
          that.service.url, method, params);
      }
    );
  };
};

module.exports = Reflector;
