'use strict';

require('rootpath')();

var _ = require('underscore');

function next(router) {
  var nexts = router.nexts();
  return _.isEmpty(nexts) ? null : _.sample(_.pairs(nexts))[0];
}

module.exports = {
  next: next
};
