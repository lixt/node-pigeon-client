'use strict';

require('rootpath')();

var _ = require('underscore');

function next(router) {
  var nexts = router.nexts();

  return _.isEmpty(nexts) ? null :
    _.max(_.pairs(nexts), function(next) {
      return next[1];
    })[0];
}

module.exports = {
  next: next
};
