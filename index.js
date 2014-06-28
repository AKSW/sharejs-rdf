'use strict';

module.exports = function (sharejs) {
  var types = require('./lib/types');

  for (var name in types) {
    var type = types[name];
    sharejs.types[type.name] = type;
  }
};
