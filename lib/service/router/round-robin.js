'use strict';

require('rootpath')();

var _ = require('underscore');


function next(router) {
  var loadBalance = _.pairs(router.loadBalances);

  if (_.isEmpty(loadBalance)) {
    return 0;
  }

  return loadBalance[++router.lastIndex % _.size(loadBalance)][0];
}

module.exports = {
  next: next
};
