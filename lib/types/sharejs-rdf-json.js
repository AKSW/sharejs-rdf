(function() {
  var RdfJsonDoc, RdfJsonOperation, SparkMD5, WEB, cloneExportTriples, cloneTriples, hashTripleObject, jsonld, md5, objectPropertiesToArray, rdfJson, sharejs;

  WEB = typeof window === 'object' && window.document;

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

  objectPropertiesToArray = function(object) {
    var array, key, value;
    array = [];
    for (key in object) {
      value = object[key];
      array.push(value);
    }
    return array.sort(function(a, b) {
      if (typeof a.value === "string" || typeof b.value === "string") {
        return aValue.localeCompare(b.value);
      } else {
        return 0;
      }
    });
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
      var object, objectHash, objects, predicateUri, predicates, subjectUri, _export, _ref;
      _export = {};
      _ref = this._triples;
      for (subjectUri in _ref) {
        predicates = _ref[subjectUri];
        _export[subjectUri] = {};
        for (predicateUri in predicates) {
          objects = predicates[predicateUri];
          _export[subjectUri][predicateUri] = [];
          for (objectHash in objects) {
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

    RdfJsonDoc.prototype.remove = function(triples) {
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
    RdfJsonOperation.prototype.OP_INSERT = 'insert';

    RdfJsonOperation.prototype.OP_REMOVE = 'remove';

    RdfJsonOperation.insert = function(triplesToAdd) {
      return new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, triplesToAdd);
    };

    RdfJsonOperation.remove = function(triplesToRemove) {
      return new RdfJsonOperation(RdfJsonOperation.prototype.OP_REMOVE, triplesToRemove);
    };

    function RdfJsonOperation(operation, triples) {
      this.operation = function() {
        return operation;
      };
      this.triples = function() {
        return triples;
      };
    }

    RdfJsonOperation.prototype.clone = function() {
      return new RdfJsonOperation(this.operation(), cloneExportTriples(this.triples()));
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
      switch (op.operation()) {
        case RdfJsonOperation.prototype.OP_INSERT:
          newSnapshot.insert(op.triples());
          break;
        case RdfJsonOperation.prototype.OP_REMOVE:
          newSnapshot.remove(op.triples());
      }
      return newSnapshot;
    },
    transform: function(op1, op2, side) {
      var op1t;
      op1t = op1.clone();
      if (side !== 'left' && side !== 'right') {
        throw new Error("Bad parameter 'side' given: " + side);
      }
      return op1t;
    }
  };

  if (WEB) {
    jsonld = window.jsonld;
    sharejs = window.sharejs;
    sharejs.types || (sharejs.types = {});
    sharejs.types.rdfJson = rdfJson;
  } else {
    jsonld = require('jsonld');
    SparkMD5 = require('spark-md5');
    module.exports = rdfJson;
  }

}).call(this);
