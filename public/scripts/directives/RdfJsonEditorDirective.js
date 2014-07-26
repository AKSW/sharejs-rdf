/**
 *  Triples are stored as objects:
 *  {id: <integer id>, s: "<subject URI>", p: "<predicate URI>", o: "<object>"}
 *
 *  The `<object>` is an object whose syntax is equivalent to:
 *  https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html#overview-of-rdf-json
 */

angular.module('app').directive('rdfJsonEditor', function () {
  'use strict';

  var TRIPLE_OP_ADD     = '+';
  var TRIPLE_OP_REMOVE  = '-';
  var TRIPLE_OP_EDIT    = 'e';

  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/rdf-json-editor.html',

    controller: ['$scope', function ($scope) {
      var nextTripleId = 1;

      $scope.triples = [];
      $scope.editingTriples = {};
      $scope.tripleJustAdded = {};
      $scope.triplePrevious = {};


      $scope.$on('insertTriples', function (e, triples) {
        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];
          addTriple(triple.s, triple.p, triple.o);
        }

        $scope.$apply();
      });

      $scope.$on('deleteTriples', function (e, triples) {
        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];
          $scope.removeTriple(triple.s, triple.p, triple.o);
        }

        $scope.$apply();
      });


      $scope.setTriplesByRdfJson = function (rdfJson) {
        $scope.triples = rdfJson2Triples(rdfJson);
      };

      $scope.getTriples = function () {
        return $scope.triples;
      };

      $scope.getRdfJson = function () {
        return triples2RdfJson($scope.triples);
      };

      $scope.addTriple = function (s, p, o) {
        finishEditingOfAllTriples();

        var triple = addTriple(s, p, o);

        $scope.editingTriples[triple.id] = true;
        $scope.tripleJustAdded[triple.id] = true;
      };

      $scope.removeTriple = function (s, p, o) {
        for (var i = 0; i < $scope.triples.length; i++) {
          var triple = $scope.triples[i];
          if (triple.s === s && triple.p === p && objectsEqual(triple.o, o)) {
            $scope.triples = removeTriple($scope.triples, triple.id);
          }
        }
      };

      $scope.removeTripleById = function (tripleId) {
        if (window.confirm('Are you sure you want to delete this triple?')) {
          if ($scope.editingTriples[tripleId]) {
            $scope.finishEditing(tripleId);
          }

          $scope.triples = removeTriple($scope.triples, tripleId);
        }
      };

      $scope.editingTriple = function (triple) {
        return $scope.editingTriples[triple.id] === true;
      };

      $scope.finishEditing = function (tripleId) {
        if (duplicateTripleExists(tripleId)) {
          return window.alert('Duplicate triples are not allowed.');
        }

        $scope.editingTriples[tripleId] = false;

        if ($scope.tripleJustAdded[tripleId]) {
          tripleAdded(tripleId);
          $scope.tripleJustAdded[tripleId] = false;
        } else {
          tripleChanged(tripleId);
        }
      };
      $scope.keyPress = function (triple, event) {
        if (event.keyCode === 13) {
          $scope.finishEditing(triple.id);
        }
      };

      $scope.toggleTripleEdit = function (triple) {
        $scope.editingTriples[triple.id] = $scope.editingTriples[triple.id] !== true;

        if ($scope.editingTriples[triple.id]) {
          startTripleEditing(triple);
        } else {
          $scope.finishEditing(triple.id);
        }
      };


      $scope.editSubject = function (triple) {
        startTripleEditing(triple);
        $scope.$broadcast('setFocus', 'subject');
      };

      $scope.editPredicate = function (triple) {
        startTripleEditing(triple);
        $scope.$broadcast('setFocus', 'predicate');
      };

      $scope.editObject = function (triple) {
        startTripleEditing(triple);
        $scope.$broadcast('setFocus', 'object');
      };


      ////////////////////
      // Tool functions:

      var tripleById = function (tripleId) {
        for (var i = 0; i < $scope.triples.length; i++) {
          var triple = $scope.triples[i];

          if (triple.id === tripleId) {
            return triple;
          }
        }

        throw new Error('Triple not found: ' + tripleId);
      };

      var duplicateTripleExists = function (tripleId) {
        var triple1 = tripleById(tripleId);

        for (var i = 0; i < $scope.triples.length; i++) {
          var triple2 = $scope.triples[i];

          if (triple2.id === tripleId) {
            continue;
          }

          if (triplesEqual(triple1, triple2)) {
            return true;
          }
        }

        return false;
      };

      var triplesEqual = function (triple1, triple2) {
        return triple1.s === triple2.s &&
               triple1.p === triple2.p &&
               objectsEqual(triple1.o, triple2.o);
      };

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

      var cloneTriple = function (triple) {
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

      var addTriple = function (s, p, o) {
        var tripleId = nextTripleId++;

        var triple = {
          id: tripleId,
          s: s,
          p: p,
          o: o
        };

        $scope.triples.push(triple);
        return triple;
      };

      var removeTriple = function (triples, tripleId) {
        var triple;

        for (var i = 0; i < triples.length; i++) {
          triple = triples[i];

          if (triple.id === tripleId) {
            triples = triples.slice(0, i).concat( triples.slice(i+1) );
            tripleRemoved(triple);
            break;
          }
        }

        return triples;
      };

      var startTripleEditing = function (triple) {
        $scope.editingTriples[triple.id] = true;
        $scope.triplePrevious[triple.id] = cloneTriple(triple);
      };

      var finishEditingOfAllTriples = function () {
        for (var tripleId in $scope.editingTriples) {
          if ($scope.editingTriples[tripleId]) {
            $scope.finishEditing( parseInt(tripleId) );
          }
        }
      };

      var tripleAdded = function (tripleId) {
        $scope.$emit('rdf-json-operation', {
          op: TRIPLE_OP_ADD,
          triple: tripleById(tripleId)
        });
      };

      var tripleChanged = function (tripleId) {
        var triple = tripleById(tripleId);
        var previous = $scope.triplePrevious[tripleId];

        if (triplesEqual(triple, previous)) {
          return;
        }

        $scope.$emit('rdf-json-operation', {
          op: TRIPLE_OP_EDIT,
          triple: triple,
          previous: previous
        });
      };

      var tripleRemoved = function (triple) {
        $scope.$emit('rdf-json-operation', {
          op: TRIPLE_OP_REMOVE,
          triple: triple
        });
      };


      var triples2RdfJson = function (triples) {
        var rdfJson = {};

        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i], s = triple.s, p = triple.p, o = triple.o;

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

      var rdfJson2Triples = function (rdfJson) {
        var triples = [];

        for (var subjectURI in rdfJson) {
          var predicates = rdfJson[subjectURI];

          for (var predicateURI in predicates) {
            var objects = predicates[predicateURI];

            for (var i = 0; i < predicates.lengt; i++) {
              var object = objects[i];

              triples.push({
                s: subjectURI,
                p: predicateURI,
                o: object
              });
            }
          }
        }

        return triples;
      };
    }]
  };
});
