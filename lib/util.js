var SparkMD5, rdf, sharejs, util;

rdf = null;

util = {
  isTriplesEmpty: function(triples) {
    var k, v;
    for (k in triples) {
      v = triples[k];
      return false;
    }
    return true;
  },
  cloneTriples: function(triples) {
    var objKey, objValue, object, objectClone, objects, predUri, predicates, subjUri, triplesClone, _i, _len;
    triplesClone = {};
    for (subjUri in triples) {
      predicates = triples[subjUri];
      triplesClone[subjUri] = {};
      for (predUri in predicates) {
        objects = predicates[predUri];
        triplesClone[subjUri][predUri] = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          objectClone = {};
          for (objKey in object) {
            objValue = object[objKey];
            objectClone[objKey] = objValue;
          }
          triplesClone[subjUri][predUri].push(objectClone);
        }
      }
    }
    return triplesClone;
  },
  triplesIntersect: function(triples1, triples2) {
    var intersect, object1, object2, objects1, objects2, objects_intersect, predUri1, predicates1, subjUri1, _i, _j, _len, _len1;
    intersect = {};
    for (subjUri1 in triples1) {
      predicates1 = triples1[subjUri1];
      if (!triples2[subjUri1]) {
        continue;
      }
      for (predUri1 in predicates1) {
        objects1 = predicates1[predUri1];
        if (!triples2[subjUri1][predUri1]) {
          continue;
        }
        objects2 = triples2[subjUri1][predUri1];
        objects_intersect = [];
        for (_i = 0, _len = objects1.length; _i < _len; _i++) {
          object1 = objects1[_i];
          for (_j = 0, _len1 = objects2.length; _j < _len1; _j++) {
            object2 = objects2[_j];
            if (object1.type === object2.type && object1.value === object2.value && object1.lang === object2.lang && object1.datatype === object2.datatype) {
              objects_intersect.push(object1);
            }
          }
        }
        if (objects_intersect.length > 0) {
          if (!intersect[subjUri1]) {
            intersect[subjUri1] = {};
          }
          intersect[subjUri1][predUri1] = objects_intersect;
        }
      }
    }
    return intersect;
  },
  triplesUnion: function(triples1, triples2) {
    var addToUnion, objectsArrayContains, union, walkTriples;
    union = {};
    objectsArrayContains = function(objects, newObject) {
      var objectsMatch, properties, property, _i, _j, _len, _len1;
      properties = ['type', 'value', 'lang', 'datatype'];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        objects = objects[_i];
        objectsMatch = true;
        for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
          property = properties[_j];
          if (object[property] !== newObject[property]) {
            objectsMatch = false;
            break;
          }
        }
        if (objectsMatch) {
          return true;
        }
      }
      return false;
    };
    addToUnion = function(s, p, o) {
      if (!union[s]) {
        union[s] = {};
      }
      if (!union[s][p]) {
        union[s][p] = [];
      }
      if (!objectsArrayContains(union[s][p], o)) {
        return union[s][p].push(o);
      }
    };
    walkTriples = function(triples, cb) {
      var object, objects, predUri, predicates, subjUri, _results;
      _results = [];
      for (subjUri in triples) {
        predicates = triples[subjUri];
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (predUri in predicates) {
            objects = predicates[predUri];
            _results1.push((function() {
              var _i, _len, _results2;
              _results2 = [];
              for (_i = 0, _len = objects.length; _i < _len; _i++) {
                object = objects[_i];
                _results2.push(cb(subjUri, predUri, object));
              }
              return _results2;
            })());
          }
          return _results1;
        })());
      }
      return _results;
    };
    walkTriples(triples1, addToUnion);
    walkTriples(triples2, addToUnion);
    return union;
  },
  triplesDifference: function(triplesMinuend, triplesSubtrahend) {
    var object1, object2, objects, objects2, objectsDiff, predUri, predicates, subjUri, triplesDiff, _i, _j, _len, _len1;
    triplesDiff = {};
    for (subjUri in triplesMinuend) {
      predicates = triplesMinuend[subjUri];
      for (predUri in predicates) {
        objects = predicates[predUri];
        objectsDiff = [];
        if (triplesSubtrahend[subjUri] && triplesSubtrahend[subjUri][predUri]) {
          objects2 = triplesSubtrahend[subjUri][predUri];
          for (_i = 0, _len = objects.length; _i < _len; _i++) {
            object1 = objects[_i];
            for (_j = 0, _len1 = objects2.length; _j < _len1; _j++) {
              object2 = objects2[_j];
              if (object1.type !== object2.type || object1.value !== object2.value || object1.lang !== object2.lang || object1.datatype !== object2.datatype) {
                objectsDiff.push(object1);
              }
            }
          }
        } else {
          objectsDiff = objects;
        }
        if (objectsDiff.length > 0) {
          if (!triplesDiff[subjUri]) {
            triplesDiff[subjUri] = {};
          }
          triplesDiff[subjUri][predUri] = objectsDiff;
        }
      }
    }
    return triplesDiff;
  }
};

if (typeof WEB !== "undefined" && WEB !== null) {
  rdf = window.rdf;
  SparkMD5 = window.SparkMD5;
  sharejs = window.sharejs;
  sharejs.rdfUtil = util;
} else {
  rdf = require('node-rdf');
  SparkMD5 = require('spark-md5');
  module.exports = util;
}
