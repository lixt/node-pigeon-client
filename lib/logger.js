var winston = require('winston')
  , util    = require('util')
  ;

/*
 *
 * Constants.
 *
 */
var packagename = 'node-pigeon';

winston.cli();

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level          : 'debug',
      handleException: true,
      json           : false,
      colorize       : true
    })
  ],

  exitOnError: false
});

logger.cli();

module.exports = function createLogger(modulename) {
  modulename  = '[' + modulename + ']';

  return {
    debug: function() {
      logger.debug(packagename, modulename,
        util.format.apply(util, arguments));
    },
    info: function() {
      logger.info(packagename, modulename,
        util.format.apply(util, arguments));
    },
    warn: function() {
      logger.warn(packagename, modulename,
        util.format.apply(util, arguments));
    },
    error: function() {
      logger.error(packagename, modulename,
        util.format.apply(this, arguments));
    },
    fatal: function() {
      logger.error(packagename, modulename,
        util.format.apply(this, arguments),
        function() {
          process.exit(1);
        }
      );
    }
  };
};
