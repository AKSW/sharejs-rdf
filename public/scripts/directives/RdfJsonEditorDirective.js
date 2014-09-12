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

    controller: ['$scope', 'TripleSet', function ($scope, TripleSet) {

      var tripleSet = new TripleSet();

      $scope.tripleSet = tripleSet;
      $scope.editingTriples = {};
      $scope.tripleJustAdded = {};
      $scope.triplePrevious = {};


      $scope.$on('insertTriples', function (e, triples) {
        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];
          tripleSet.addTriple(triple.s, triple.p, triple.o);
        }

        $scope.$apply();
      });

      $scope.$on('deleteTriples', function (e, triples) {
        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];
          tripleSet.removeTripleBySPO(triple.s, triple.p, triple.o);
        }

        $scope.$apply();
      });

      $scope.$on('setTriples', function (e, triples) {
        $scope.tripleSet = tripleSet = new TripleSet();

        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];
          tripleSet.addTriple(triple.s, triple.p, triple.o);
        }

        $scope.$apply();
      });


      $scope.setTriplesByRdfJson = function (rdfJson) {
        tripleSet = $scope.tripleSet = TripleSet.createByRdfJson(rdfJson);
      };

      $scope.getTriples = function () {
        return tripleSet.getTriples();
      };

      $scope.getRdfJson = function () {
        return tripleSet.toRdfJson();
      };

      $scope.addTriple = function (s, p, o) {
        finishEditingOfAllTriples();

        var triple = tripleSet.addTriple(s, p, o);

        $scope.editingTriples[triple.id] = true;
        $scope.tripleJustAdded[triple.id] = true;
      };

      $scope.removeTriple = function (s, p, o) {
        var triple = tripleSet.removeTripleBySPO(s, p, o);

        if (triple) {
          tripleRemoved(triple);
        }
      };

      $scope.removeTripleById = function (tripleId) {
        if (window.confirm('Are you sure you want to delete this triple?')) {
          if ($scope.editingTriples[tripleId]) {
            $scope.finishEditing(tripleId);
          }

          var triple = tripleSet.removeTriple(tripleId);

          if (triple) {
            tripleRemoved(triple);
          }
        }
      };

      $scope.editingTriple = function (triple) {
        return $scope.editingTriples[triple.id] === true;
      };

      $scope.finishEditing = function (tripleId) {
        if (tripleSet.duplicateTripleExists(tripleId)) {
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

      var startTripleEditing = function (triple) {
        $scope.editingTriples[triple.id] = true;
        $scope.triplePrevious[triple.id] = TripleSet.cloneTriple(triple);
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
          triple: tripleSet.tripleById(tripleId)
        });
      };

      var tripleChanged = function (tripleId) {
        var triple = tripleSet.tripleById(tripleId);
        var previous = $scope.triplePrevious[tripleId];

        if (TripleSet.triplesEqual(triple, previous)) {
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

    }]
  };
});
