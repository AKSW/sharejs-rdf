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
        predicateCount = 0;
        for (predicateUri in predicates) {
          objects = predicates[predicateUri];
          this.assertPredicateIsUri(predicateUri, subjectUri);
          this.assertObjectsArray(objects, subjectUri, predicateUri);
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
      return null;
    },

    /*
      switch op.operation()
        when RdfJsonOperation::OP_INSERT
          newSnapshot = null  # TODO
        when RdfJsonOperation::OP_REMOVE
          newSnapshot = null  # TODO
    
      newSnapshot
     */
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
