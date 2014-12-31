'use strict';

require('rootpath')();

var _ = require('underscore');

function next(router) {
  var nexts = router.nexts();

  if (_.isEmpty(nexts)) {
    return null;
  } else {
    router.recent = router.recent % _.size(nexts);
    return _.pairs(nexts)[router.recent++][0];
  }
}

module.exports = {
  next: next
};
