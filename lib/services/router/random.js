'use strict';

require('rootpath')();

var _ = require('underscore');

function next(router) {
  var loadBalances = _.pairs(router.loadBalances);

  if (_.isEmpty(loadBalances)) {
    return 0;
  }

  return _.sample(loadBalances)[0];
}

module.exports = {
  next: next
};
