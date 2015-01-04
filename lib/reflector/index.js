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
  ;

function Reflector(service) {
  this.service = service;
}

Reflector.prototype.reflect = function reflect(method) {
  logger.debug('Reflect: service(%s), method(%s).',
    this.service.url, method);

  var that = this;
  var retries = this.service.configs.get('retries');

  return function() {
    logger.debug('Start RPC: service(%s), method(%s), arguments(%j).',
      that.service.url, method, arguments);

    var params = _.initial(arguments)
      , cb     = _.last   (arguments)
      ;

    if (!cb || !_.isFunction(cb)) {
      // FATAL ERR!
      logger.fatal('Fatal error: A callback must be provided as the last ' +
        'argument in service(%s) method(%s).',that.service.url, method);
    }

    async.whilst(
      function() {
        return retries-- >= 0;
      },
      function(whilstdone) {
        var ip = that.service.router.next();
        if (!ip) {
          _.defer(function() {
            // TOP ERROR!
            var toperr = new Error('top', 'Network error(No available servers): ' +
              'service(%s), method(%s), params(%j).', that.service.url, method, params);
            logger.error(toperr);
            cb(toperr.info);
            whilstdone(1);
          });
        } else {
          that.service.connector.connect(ip, method, params, function(err, result) {
            if (err && err.type === 'network') {
              that.service.router.status[ip].reachability = 0;

              if (retries < 0) {
                // TOP ERROR!
                var toperr = new Error('top', 'Network error(%s): service(%s), ' +
                  'method(%s), params(%j).', err.info, that.service.url, method, params);
                logger.error(toperr);
                cb(toperr);
                whilstdone(1);
              }

              whilstdone();
            }

            if (err) {
              // TOP ERROR!
              var toperr = new Error('top', 'Server error(%s): service(%s), ' +
                'method(%s), params(%j).', err.info, that.service.url, method, params);
              logger.error(toperr);
              cb(toperr);
            }

            cb(err, result);
            whilstdone(1);
          });
        }
      },
      function() {
        logger.debug('End RPC: service(%s), method(%s), arguments(%j).',
          that.service.url, method, arguments);
      }
    );
  };
};

module.exports = Reflector;

/*
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

    var timeoutRetries = service.config.get('timeoutRetries');
    var cberr, cbresult;
    async.whilst(
      function() {
        return timeoutRetries >= 0;
      },
      function(done) {
        --timeoutRetries;

        var ip = service.router.next();
        if (_.isNull(ip) || _.isUndefined(ip)) {
          return _.defer(function() {
            cberr = util.format('No valid ip address for ' +
              'service(%s) method(%s)', service.url, methodName);
            done(1);
          });
        }

        (new Connector(ip, config)).request(service.url, methodName, params, function(err, result) {
          if (err && err.network) {
            service.router.status[ip].reachability = 0;
            cberr = err;
            done();
          } else {
            if (err) {
              cberr = err;
            } else {
              cberr = null;
              cbresult = result;
            }
            done(1);
          }
        });
      },
      function() {
        cb(cberr, cbresult);
      }
    );
  };
}

module.exports = reflect;
*/