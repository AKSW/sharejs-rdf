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
        var tripleId = nextTripleId++;

        finishEditingOfAllTriples();

        $scope.triples.push({
          id: tripleId,
          s: s,
          p: p,
          o: o
        });

        $scope.editingTriples[tripleId] = true;
        $scope.tripleJustAdded[tripleId] = true;
      };

      $scope.removeTriple = function (tripleId) {
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
        $scope.$emit('rdf-json-operation', {
          op: TRIPLE_OP_EDIT,
          triple: tripleById(tripleId),
          previous: $scope.triplePrevious[tripleId]
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
