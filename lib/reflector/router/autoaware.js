'use strict';

require('rootpath')();

var _ = require('underscore');


function next(router) {
  if (_.isEmpty(router.loadBalances)) {
    return 0;
  }

  return _.max(
    _.pairs(router.loadBalances),
    function(loadBalance) {
      return loadBalance[1];
    }
  )[0];
}

module.exports = {
  next: next
};
