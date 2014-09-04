/**
 *  Provides a TripleSet class.
 *
 *  Triples are stored as objects:
 *  {id: <integer id>, s: "<subject URI>", p: "<predicate URI>", o: "<object>"}
 *
 *  The `<object>` is an object whose syntax is equivalent to:
 *  https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html#overview-of-rdf-json
 */

angular.module('app').factory('TripleSet', function() {
  'use strict';

  var TripleSet = function () {
    this.triples = [];
    this.nextTripleId = 1;
  };

  TripleSet.prototype.getTriples = function () {
    return this.triples;
  };

  TripleSet.prototype.tripleById = function (tripleId) {
    for (var i = 0; i < this.triples.length; i++) {
      var triple = this.triples[i];

      if (triple.id === tripleId) {
        return triple;
      }
    }

    throw new Error('Triple not found: ' + tripleId);
  };

  TripleSet.prototype.tripleBySPO = function (s, p, o) {
    for (var i = 0; i < this.triples.length; i++) {
      var triple = this.triples[i];

      if (triple.s === s && triple.p === p && objectsEqual(triple.o, o)) {
        return triple;
      }
    }

    return null;
  };

  TripleSet.prototype.duplicateTripleExists = function (tripleId) {
    var triple1 = this.tripleById(tripleId);

    for (var i = 0; i < this.triples.length; i++) {
      var triple2 = this.triples[i];

      if (triple2.id === tripleId) {
        continue;
      }

      if (TripleSet.triplesEqual(triple1, triple2)) {
        return true;
      }
    }

    return false;
  };

  TripleSet.prototype.addTriple = function (s, p, o) {
    var tripleId = this.nextTripleId++;

    var triple = {
      id: tripleId,
      s: s,
      p: p,
      o: o
    };

    this.triples.push(triple);
    return triple;
  };

  // Note: was used statically before + returns the removed triple now (or null)
  TripleSet.prototype.removeTriple = function (tripleId) {
    var triple;

    for (var i = 0; i < this.triples.length; i++) {
      triple = this.triples[i];

      if (triple.id === tripleId) {
        this.triples = this.triples.slice(0, i).concat( this.triples.slice(i+1) );
        return triple;
      }
    }

    return null;
  };

  TripleSet.prototype.removeTripleBySPO = function (s, p, o) {
    var triple = this.tripleBySPO(s, p, o);

    if (triple) {
      this.removeTriple(triple.id);
      return triple;
    } else {
      return null;
    }
  };

  TripleSet.prototype.toRdfJson = function () {
    var rdfJson = {};

    for (var i = 0; i < this.triples.length; i++) {
      var triple = this.triples[i], s = triple.s, p = triple.p, o = triple.o;

      if (!rdfJson[s]) {
        rdfJson[s] = {};
      }
      if (!rdfJson[s][p]) {
        rdfJson[s][p] = [];
      }

      rdfJson[s][p].push(o);
    }

    return rdfJson;
  };


  // Static methods:

  TripleSet.cloneTriple = function (triple) {
    var clone = {};

    clone.id = triple.id;
    clone.s = triple.s;
    clone.p = triple.p;
    clone.o = {
      type: triple.o.type,
      value: triple.o.value
    };

    if (triple.o.lang) {
      clone.o.lang = triple.o.lang;
    }
    if (triple.o.dataType) {
      clone.o.dataType = triple.o.dataType;
    }

    return clone;
  };

  TripleSet.triplesEqual = function (triple1, triple2) {
    return triple1.s === triple2.s &&
           triple1.p === triple2.p &&
           objectsEqual(triple1.o, triple2.o);
  };

  TripleSet.createByRdfJson = function (rdfJson) {
    var tripleSet = new TripleSet();

    for (var subjectURI in rdfJson) {
      var predicates = rdfJson[subjectURI];

      for (var predicateURI in predicates) {
        var objects = predicates[predicateURI];

        for (var i = 0; i < predicates.lengt; i++) {
          var object = objects[i];

          tripleSet.addTriple(subjectURI, predicateURI, object);
        }
      }
    }

    return tripleSet;
  };


  // Private tool functions:

  var objectsEqual = function (o1, o2) {
    if (o1.type !== o2.type || o1.value !== o2.value) {
      return false;
    }

    if (o1.lang && (o1.lang !== o2.lang)) {
      return false;
    }

    if (o1.dataType && (o1.dataType !== o2.dataType)) {
      return false;
    }

    return true;
  };


  return TripleSet;

});
