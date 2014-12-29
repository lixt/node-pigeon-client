'use strict';

require('rootpath')();

var _ = require('underscore');

function next(router) {
  var nexts = router.nexts();
  return _.isEmpty(nexts) ? null :
    _.pairs(nexts)[++router.recent % _.size(nexts)][0];
}

module.exports = {
  next: next
};
