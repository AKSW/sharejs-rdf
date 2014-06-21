(function() {
  var matchers;

  matchers = require('jasmine-expect');

  beforeEach(function() {
    var flattenTriples, _matchers;
    flattenTriples = function(triples) {
      var objStr, object, objects, predUri, predicates, serialized, subjUri, tripleStr, _i, _len;
      serialized = [];
      for (subjUri in triples) {
        predicates = triples[subjUri];
        for (predUri in predicates) {
          objects = predicates[predUri];
          for (_i = 0, _len = objects.length; _i < _len; _i++) {
            object = objects[_i];
            objStr = "" + object.type + ":" + object.value;
            if (object.lang) {
              objStr += "//" + object.lang;
            }
            if (object.datatype) {
              objStr += "^^" + object.datatype;
            }
            tripleStr = "<" + subjUri + "> <" + predUri + "> /" + objStr + "/";
            serialized.push(tripleStr);
          }
        }
      }
      return serialized;
    };
    _matchers = {
      triplesToEqual: function(other) {
        var actual_flat, actual_triple, i, other_flat, other_triple, _i, _len;
        actual_flat = flattenTriples(this.actual);
        other_flat = flattenTriples(other);
        actual_flat.sort();
        other_flat.sort();
        if (actual_flat.length !== other_flat.length) {
          return false;
        }
        for (i = _i = 0, _len = actual_flat.length; _i < _len; i = ++_i) {
          actual_triple = actual_flat[i];
          other_triple = other_flat[i];
          if (actual_triple !== other_triple) {
            return false;
          }
        }
        return true;
      }
    };
    return this.addMatchers(_matchers);
  });

}).call(this);
