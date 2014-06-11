'use strict';

module.exports = function (sharejs) {
  var types = require('./lib/types');

  for (var i = 0; i < types.length; i++) {
    var type = types[i];
    sharejs.types[type.name] = type;
  }
};
