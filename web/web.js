/**
  jshint unused: true
  @const
  @type {boolean}
*/
var WEB = true;

var RdfJsonDoc, RdfJsonOperation, SparkMD5, WEB, cloneExportTriples, cloneTriples, exportTriplesDifference, exportTriplesIntersect, exportTriplesUnion, hashTripleObject, isTriplesEmpty, md5, rdfJson, sharejs;

if (typeof window === 'object' && window.document) {
  WEB = true;
}

md5 = function(str) {
  return SparkMD5.hash(str);
};

hashTripleObject = function(obj) {
  var hashObject;
  hashObject = function(obj, properties) {
    var prop, str, _i, _len;
    str = "";
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      if (typeof obj[prop] !== "undefined") {
        str += "" + prop + ":'" + obj[prop] + "';";
      }
    }
    return md5(str);
  };
  return hashObject(obj, ['type', 'value', 'lang', 'datatype']);
};

isTriplesEmpty = function(triples) {
  var k, v;
  for (k in triples) {
    v = triples[k];
    return false;
  }
  return true;
};

cloneTriples = function(triples) {
  var objKey, objValue, object, objectClone, objectHash, objects, predUri, predicates, subjUri, triplesClone;
  triplesClone = {};
  for (subjUri in triples) {
    predicates = triples[subjUri];
    triplesClone[subjUri] = {};
    for (predUri in predicates) {
      objects = predicates[predUri];
      triplesClone[subjUri][predUri] = {};
      for (objectHash in objects) {
        object = objects[objectHash];
        objectClone = {};
        for (objKey in object) {
          objValue = object[objKey];
          objectClone[objKey] = objValue;
        }
        triplesClone[subjUri][predUri][objectHash] = objectClone;
      }
    }
  }
  return triplesClone;
};

cloneExportTriples = function(triples) {
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
};

exportTriplesIntersect = function(triples1, triples2) {
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
};

exportTriplesUnion = function(triples1, triples2) {
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
};

exportTriplesDifference = function(triplesMinuend, triplesSubtrahend) {
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
};

RdfJsonDoc = (function() {
  function RdfJsonDoc(triples) {
    if (triples == null) {
      triples = {};
    }
    this._uriRegex = /^\w+:\/\/\w+(\.\w+)+\//;
    this._triples = {};
    this.insert(triples);
  }

  RdfJsonDoc.prototype.exportTriples = function() {
    var object, objectHash, objectHashes, objects, predicateUri, predicates, subjectUri, _export, _i, _len, _ref;
    _export = {};
    _ref = this._triples;
    for (subjectUri in _ref) {
      predicates = _ref[subjectUri];
      _export[subjectUri] = {};
      for (predicateUri in predicates) {
        objects = predicates[predicateUri];
        _export[subjectUri][predicateUri] = [];
        objectHashes = [];
        for (objectHash in objects) {
          object = objects[objectHash];
          objectHashes.push(objectHash);
        }
        objectHashes.sort();
        for (_i = 0, _len = objectHashes.length; _i < _len; _i++) {
          objectHash = objectHashes[_i];
          object = objects[objectHash];
          _export[subjectUri][predicateUri].push(object);
        }
      }
    }
    return _export;
  };

  RdfJsonDoc.prototype.clone = function() {
    var doc;
    doc = new RdfJsonDoc;
    doc._triples = cloneTriples(this._triples);
    return doc;
  };

  RdfJsonDoc.prototype.insert = function(triples) {
    var object, objectHash, objects, predicateUri, predicates, subjectUri, _results;
    _results = [];
    for (subjectUri in triples) {
      predicates = triples[subjectUri];
      this.assertSubjectIsUri(subjectUri);
      if (!this._triples[subjectUri]) {
        this._triples[subjectUri] = {};
      }
      _results.push((function() {
        var _results1;
        _results1 = [];
        for (predicateUri in predicates) {
          objects = predicates[predicateUri];
          this.assertPredicateIsUri(predicateUri, subjectUri);
          this.assertObjectsArray(objects, subjectUri, predicateUri);
          if (!this._triples[subjectUri][predicateUri]) {
            this._triples[subjectUri][predicateUri] = {};
          }
          _results1.push((function() {
            var _i, _len, _results2;
            _results2 = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              objectHash = hashTripleObject(object);
              _results2.push(this._triples[subjectUri][predicateUri][objectHash] = object);
            }
            return _results2;
          }).call(this));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  RdfJsonDoc.prototype["delete"] = function(triples) {
    var objectCount, objectToRemove, objectToRemoveHash, objects, predicateCount, predicateUri, predicates, presentObject, presentObjectHash, presentObjects, subjectUri, _i, _len, _results;
    _results = [];
    for (subjectUri in triples) {
      predicates = triples[subjectUri];
      this.assertSubjectIsUri(subjectUri);
      if (!this._triples[subjectUri]) {
        continue;
      }
      predicateCount = 0;
      for (predicateUri in predicates) {
        objects = predicates[predicateUri];
        this.assertPredicateIsUri(predicateUri, subjectUri);
        this.assertObjectsArray(objects, subjectUri, predicateUri);
        predicateCount++;
        if (!this._triples[subjectUri][predicateUri]) {
          continue;
        }
        presentObjects = this._triples[subjectUri][predicateUri];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          objectToRemove = objects[_i];
          objectToRemoveHash = hashTripleObject(objectToRemove);
          if (presentObjects[objectToRemoveHash]) {
            delete this._triples[subjectUri][predicateUri][objectToRemoveHash];
          }
        }
        objectCount = 0;
        for (presentObjectHash in presentObjects) {
          presentObject = presentObjects[presentObjectHash];
          objectCount++;
        }
        if (objectCount === 0) {
          predicateCount--;
          delete this._triples[subjectUri][predicateUri];
        }
      }
      if (predicateCount === 0) {
        _results.push(delete this._triples[subjectUri]);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  RdfJsonDoc.prototype.assertSubjectIsUri = function(subject) {
    if (typeof subject !== 'string' || !this.isUri(subject)) {
      throw new Error("Subject must be an URI: " + subject);
    }
  };

  RdfJsonDoc.prototype.assertPredicateIsUri = function(predicate, subject) {
    if (typeof predicate !== 'string' || !this.isUri(predicate)) {
      throw new Error("Predicate must be an URI: " + predicate + " (of subject " + subject + ")");
    }
  };

  RdfJsonDoc.prototype.assertObjectsArray = function(objects, subject, predicate) {
    if (typeof objects !== 'object' || !(objects instanceof Array)) {
      throw new Error("Objects must be an array of objects: " + objects + " (of subject " + subject + ", predicate " + predicate + ")");
    }
  };

  RdfJsonDoc.prototype.isUri = function(str) {
    return str.match(this._uriRegex);
  };

  return RdfJsonDoc;

})();

RdfJsonOperation = (function() {
  RdfJsonOperation.insert = function(triplesToAdd) {
    return new RdfJsonOperation(triplesToAdd, {});
  };

  RdfJsonOperation["delete"] = function(triplesToDelete) {
    return new RdfJsonOperation({}, triplesToDelete);
  };

  function RdfJsonOperation(triplesToAdd, triplesToDelete) {
    this._triplesAdd = triplesToAdd;
    this._triplesDel = triplesToDelete;
  }

  RdfJsonOperation.prototype.clone = function() {
    return new RdfJsonOperation(cloneExportTriples(this.getTriplesToAdd()), cloneExportTriples(this.getTriplesToDel()));
  };

  RdfJsonOperation.prototype.getTriplesToAdd = function() {
    return this._triplesAdd;
  };

  RdfJsonOperation.prototype.setTriplesToAdd = function(triples) {
    return this._triplesAdd = triples;
  };

  RdfJsonOperation.prototype.hasTriplesToAdd = function() {
    return !this._triplesEmpty(this._triplesAdd);
  };

  RdfJsonOperation.prototype.getTriplesToDel = function() {
    return this._triplesDel;
  };

  RdfJsonOperation.prototype.setTriplesToDel = function(triples) {
    return this._triplesDel = triples;
  };

  RdfJsonOperation.prototype.hasTriplesToDel = function() {
    return !this._triplesEmpty(this._triplesDel);
  };

  RdfJsonOperation.prototype._triplesEmpty = function(triples) {
    var k, v;
    for (k in triples) {
      v = triples[k];
      return false;
    }
    return true;
  };

  return RdfJsonOperation;

})();

rdfJson = {
  Doc: RdfJsonDoc,
  Operation: RdfJsonOperation,
  name: 'rdf-json',
  create: function() {
    return new RdfJsonDoc;
  },
  apply: function(snapshot, op) {
    var newSnapshot;
    if (!(snapshot instanceof RdfJsonDoc)) {
      throw new Error("Snapshot must be a RdfJsonDoc instance. Given: " + snapshot);
    }
    if (!(op instanceof RdfJsonOperation)) {
      throw new Error("Operation must be a RdfJsonOperation instance. Given: " + op);
    }
    newSnapshot = snapshot.clone();
    if (op.hasTriplesToAdd()) {
      newSnapshot.insert(op.getTriplesToAdd());
    }
    if (op.hasTriplesToDel()) {
      newSnapshot["delete"](op.getTriplesToDel());
    }
    return newSnapshot;
  },
  transform: function(op1, op2, side) {
    var op1First, op1t, transformTriples;
    transformTriples = function(op1Triples, op2Triples) {
      var intersect;
      intersect = exportTriplesIntersect(op1Triples, op2Triples);
      return exportTriplesDifference(op1Triples, intersect);
    };
    op1t = op1.clone();
    op1First = side === 'right';
    if (side !== 'left' && side !== 'right') {
      throw new Error("Bad parameter 'side' given: " + side);
    }
    if (op1First) {
      return op1t;
    }
    if (isTriplesEmpty(op1.getTriplesToAdd()) && isTriplesEmpty(op2.getTriplesToAdd())) {
      return op1t;
    }
    if (isTriplesEmpty(op1.getTriplesToDel()) && isTriplesEmpty(op2.getTriplesToDel())) {
      return op1t;
    }
    op1t.setTriplesToAdd(exportTriplesDifference(op1.getTriplesToAdd(), op2.getTriplesToDel()));
    op1t.setTriplesToDel(exportTriplesDifference(op1.getTriplesToDel(), op2.getTriplesToAdd()));
    return op1t;
  },
  compose: function(op1, op2) {
    var triplesToAdd, triplesToAddUnion, triplesToDel, triplesToDelUnion;
    triplesToAddUnion = exportTriplesUnion(op1.getTriplesToAdd(), op2.getTriplesToAdd());
    triplesToDelUnion = exportTriplesUnion(op1.getTriplesToDel(), op2.getTriplesToDel());
    triplesToAdd = exportTriplesDifference(triplesToAddUnion, triplesToDelUnion);
    triplesToDel = exportTriplesDifference(triplesToDelUnion, triplesToAddUnion);
    return new RdfJsonOperation(triplesToAdd, triplesToDel);
  }
};

if (WEB != null) {
  sharejs = window.sharejs;
  sharejs.types || (sharejs.types = {});
  sharejs.types['rdf-json'] = rdfJson;
} else {
  SparkMD5 = require('spark-md5');
  module.exports = rdfJson;
}

var rdfJson;

if (typeof WEB === 'undefined') {
  rdfJson = require('./rdf-json');
}

rdfJson.api = {
  provides: {
    rdfJson: true
  },
  insert: function(triples, callback) {
    var op;
    op = rdfJson.Operation.insert(triples);
    this.submitOp(op, callback);
    return op;
  },
  "delete": function(triples, callback) {
    var op;
    op = rdfJson.Operation["delete"](triples);
    this.submitOp(op, callback);
    return op;
  },
  update: function(triplesToIns, triplesToDel, callback) {
    var op;
    op = new rdfJson.Operation(triplesToIns, triplesToDel);
    this.submitOp(op, callback);
    return op;
  },
  _register: function() {
    return this.on('remoteop', function(op) {
      return this.emit('update', op._triplesToAdd, op._triplesToDel);
    });
  }
};
