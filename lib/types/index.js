(function() {
  var register;

  register = function(file) {
    var type;
    type = require(file);
    exports[type.name] = type;
    try {
      return require("" + file + "-api");
    } catch (_error) {}
  };

  register('./sharejs-rdf-json.js');

}).call(this);
