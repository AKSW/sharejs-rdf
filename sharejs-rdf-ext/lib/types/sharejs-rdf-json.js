(function() {
  var RdfJsonDoc, RdfJsonOperation, WEB, jsonld, rdfJson, sharejs;

  WEB = typeof window === 'object' && window.document;

  RdfJsonDoc = (function() {
    function RdfJsonDoc(triples) {
      if (triples == null) {
        triples = {};
      }
      this._uriRegex = /^\w+:\/\/\w+(\.\w+)+\//;
      this._triples = triples;
    }

    RdfJsonDoc.prototype.triples = function() {
      return this._triples;
    };

    RdfJsonDoc.prototype.clone = function() {
      var cloneTriples;
      cloneTriples = function(triples) {
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
      return new RdfJsonDoc(cloneTriples(this.triples()));
    };

    RdfJsonDoc.prototype.insert = function(triples) {
      var objects, predicateUri, predicates, subjectUri, _results;
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
              this._triples[subjectUri][predicateUri] = [];
            }
            _results1.push(this._triples[subjectUri][predicateUri] = this._triples[subjectUri][predicateUri].concat(objects));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    RdfJsonDoc.prototype.remove = function(triples) {
      var objectToRemove, objects, predicateCount, predicateUri, predicates, presentObject, presentObjectIndex, presentObjects, subjectUri, _i, _j, _len, _len1, _results;
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
          if (!this._triples[subjectUri][predicateUri]) {
            continue;
          }
          predicateCount++;
          for (_i = 0, _len = objects.length; _i < _len; _i++) {
            objectToRemove = objects[_i];
            presentObjects = this._triples[subjectUri][predicateUri];
            for (presentObjectIndex = _j = 0, _len1 = presentObjects.length; _j < _len1; presentObjectIndex = ++_j) {
              presentObject = presentObjects[presentObjectIndex];
              if (presentObject.type === objectToRemove.type && presentObject.value === objectToRemove.value) {
                this._triples[subjectUri][predicateUri] = presentObjects.slice(0, presentObjectIndex).concat(presentObjects.slice(presentObjectIndex + 1));
              }
            }
          }
          if (this._triples[subjectUri][predicateUri].length === 0) {
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
      var op;
      return op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, triplesToAdd);
    };

    RdfJsonOperation.remove = function(triplesToRemove) {
      var op;
      return op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_REMOVE, triplesToRemove);
    };

    function RdfJsonOperation(operation, triples) {
      this.operation = function() {
        return operation;
      };
      this.triples = function() {
        return triples;
      };
    }

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
      return null;
    }
  };

  if (WEB) {
    jsonld = window.jsonld;
    sharejs = window.sharejs;
    sharejs.types || (sharejs.types = {});
    sharejs.types.rdfJson = rdfJson;
  } else {
    jsonld = require('jsonld');
    module.exports = rdfJson;
  }

}).call(this);
