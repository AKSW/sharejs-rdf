var RdfJsonDoc, RdfJsonOperation, SparkMD5, cloneInternalTriples, exportTriples, hashTripleObject, md5, rdfJson, sharejs, util;

SparkMD5 = null;

util = null;

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

cloneInternalTriples = function(triples) {
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

exportTriples = function(triples) {
  var object, objectHash, objectHashes, objects, predicateUri, predicates, subjectUri, _export, _i, _len;
  _export = {};
  for (subjectUri in triples) {
    predicates = triples[subjectUri];
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

RdfJsonDoc = (function() {
  function RdfJsonDoc(triples) {
    if (triples == null) {
      triples = {};
    }
    this.triples = {};
    this.insert(triples);
  }

  RdfJsonDoc.fromData = function(data) {
    return RdfJsonDoc.byInternalTripleSet(data.triples);
  };

  RdfJsonDoc.byInternalTripleSet = function(triples) {
    var doc;
    doc = new RdfJsonDoc;
    doc.triples = triples;
    return doc;
  };

  RdfJsonDoc.prototype.exportTriples = function() {
    return exportTriples(this.triples);
  };

  RdfJsonDoc.prototype.clone = function() {
    var doc;
    doc = new RdfJsonDoc;
    doc.triples = cloneInternalTriples(this.triples);
    return doc;
  };

  RdfJsonDoc.prototype.insert = function(triples) {
    var object, objectHash, objects, predicateUri, predicates, subjectUri, _results;
    _results = [];
    for (subjectUri in triples) {
      predicates = triples[subjectUri];
      this.assertSubjectIsUri(subjectUri);
      if (!this.triples[subjectUri]) {
        this.triples[subjectUri] = {};
      }
      _results.push((function() {
        var _results1;
        _results1 = [];
        for (predicateUri in predicates) {
          objects = predicates[predicateUri];
          this.assertPredicateIsUri(predicateUri, subjectUri);
          this.assertObjectsArray(objects, subjectUri, predicateUri);
          if (!this.triples[subjectUri][predicateUri]) {
            this.triples[subjectUri][predicateUri] = {};
          }
          _results1.push((function() {
            var _i, _len, _results2;
            _results2 = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              objectHash = hashTripleObject(object);
              _results2.push(this.triples[subjectUri][predicateUri][objectHash] = object);
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
      if (!this.triples[subjectUri]) {
        continue;
      }
      predicateCount = 0;
      for (predicateUri in predicates) {
        objects = predicates[predicateUri];
        this.assertPredicateIsUri(predicateUri, subjectUri);
        this.assertObjectsArray(objects, subjectUri, predicateUri);
        predicateCount++;
        if (!this.triples[subjectUri][predicateUri]) {
          continue;
        }
        presentObjects = this.triples[subjectUri][predicateUri];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          objectToRemove = objects[_i];
          objectToRemoveHash = hashTripleObject(objectToRemove);
          if (presentObjects[objectToRemoveHash]) {
            delete this.triples[subjectUri][predicateUri][objectToRemoveHash];
          }
        }
        objectCount = 0;
        for (presentObjectHash in presentObjects) {
          presentObject = presentObjects[presentObjectHash];
          objectCount++;
        }
        if (objectCount === 0) {
          predicateCount--;
          delete this.triples[subjectUri][predicateUri];
        }
      }
      if (predicateCount === 0) {
        _results.push(delete this.triples[subjectUri]);
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
    return str.match(/^\w+:\/\/\w+(\.\w+)+\//);
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

  RdfJsonOperation.fromData = function(data) {
    return new RdfJsonOperation(data.triplesAdd, data.triplesDel);
  };

  function RdfJsonOperation(triplesToAdd, triplesToDelete) {
    this.triplesAdd = triplesToAdd;
    this.triplesDel = triplesToDelete;
  }

  RdfJsonOperation.prototype.clone = function() {
    return new RdfJsonOperation(util.cloneTriples(this.getInsertions()), util.cloneTriples(this.getDeletions()));
  };

  RdfJsonOperation.prototype.getInsertions = function() {
    return this.triplesAdd;
  };

  RdfJsonOperation.prototype.setInsertions = function(triples) {
    return this.triplesAdd = triples;
  };

  RdfJsonOperation.prototype.hasInsertions = function() {
    return !this._triplesEmpty(this.triplesAdd);
  };

  RdfJsonOperation.prototype.getDeletions = function() {
    return this.triplesDel;
  };

  RdfJsonOperation.prototype.setDeletions = function(triples) {
    return this.triplesDel = triples;
  };

  RdfJsonOperation.prototype.hasDeletions = function() {
    return !this._triplesEmpty(this.triplesDel);
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
  name: 'rdf-json',
  doc: RdfJsonDoc,
  op: RdfJsonOperation,
  create: function() {
    return new RdfJsonDoc;
  },
  apply: function(snapshot, op) {
    var newSnapshot;
    snapshot = this._ensureDoc(snapshot);
    op = this._ensureOp(op);
    newSnapshot = snapshot.clone();
    if (op.hasInsertions()) {
      newSnapshot.insert(op.getInsertions());
    }
    if (op.hasDeletions()) {
      newSnapshot["delete"](op.getDeletions());
    }
    return newSnapshot;
  },
  transform: function(op1, op2, side) {
    var op1First, op1t, transformTriples;
    transformTriples = function(op1Triples, op2Triples) {
      var intersect;
      intersect = util.triplesIntersect(op1Triples, op2Triples);
      return util.triplesDifference(op1Triples, intersect);
    };
    op1t = op1.clone();
    op1First = side === 'right';
    if (side !== 'left' && side !== 'right') {
      throw new Error("Bad parameter 'side' given: " + side);
    }
    if (op1First) {
      return op1t;
    }
    if (util.isTriplesEmpty(op1.getInsertions()) && util.isTriplesEmpty(op2.getInsertions())) {
      return op1t;
    }
    if (util.isTriplesEmpty(op1.getDeletions()) && util.isTriplesEmpty(op2.getDeletions())) {
      return op1t;
    }
    op1t.setInsertions(util.triplesDifference(op1.getInsertions(), op2.getDeletions()));
    op1t.setDeletions(util.triplesDifference(op1.getDeletions(), op2.getInsertions()));
    return op1t;
  },
  compose: function(op1, op2) {
    var triplesToAdd, triplesToAddUnion, triplesToDel, triplesToDelUnion;
    triplesToAddUnion = util.triplesUnion(op1.getInsertions(), op2.getInsertions());
    triplesToDelUnion = util.triplesUnion(op1.getDeletions(), op2.getDeletions());
    triplesToAdd = util.triplesDifference(triplesToAddUnion, triplesToDelUnion);
    triplesToDel = util.triplesDifference(triplesToDelUnion, triplesToAddUnion);
    return new RdfJsonOperation(triplesToAdd, triplesToDel);
  },
  _ensureDoc: function(doc) {
    if (doc instanceof RdfJsonDoc) {
      return doc;
    }
    if (typeof doc === 'object' && doc.triples) {
      return RdfJsonDoc.fromData(doc);
    }
    throw new Error("Snapshot must be a rdf-json document. Given: " + doc);
  },
  _ensureOp: function(op) {
    if (op instanceof RdfJsonOperation) {
      return op;
    }
    if (typeof op === 'object' && op.triplesAdd && op.triplesDel) {
      return RdfJsonOperation.fromData(op);
    }
    throw new Error("Operation must be a rdf-json operation. Given: " + op);
  }
};

if (typeof WEB !== "undefined" && WEB !== null) {
  sharejs = window.sharejs;
  util = sharejs.rdfUtil;
  SparkMD5 = window.SparkMD5;
  sharejs.types || (sharejs.types = {});
  sharejs.types['rdf-json'] = rdfJson;
} else {
  SparkMD5 = require('spark-md5');
  util = require('../util');
  module.exports = rdfJson;
}
