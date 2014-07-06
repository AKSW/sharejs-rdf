/**
 *  Triples are stored as objects:
 *  {id: <integer id>, s: "<subject URI>", p: "<predicate URI>", o: "<object>"}
 *
 *  The `<object>` is an object whose syntax is equivalent to:
 *  https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html#overview-of-rdf-json
 */

angular.module('app').directive('rdfJsonEditor', function () {
  'use strict';

  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/rdf-json-editor.html',

    controller: ['$scope', function ($scope) {
      var nextTripleId = 1;

      $scope.editingTriples = {};
      $scope.triples = [];

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
        $scope.triples.push({
          id: nextTripleId++,
          s: s,
          p: p,
          o: o
        });
      };

      $scope.removeTriple = function (tripleId) {
        if (window.confirm('Are you sure you want to delete this triple?')) {
          $scope.triples = removeTriple($scope.triples, tripleId);
        }
      };

      $scope.editingTriple = function (tripleId) {
        return $scope.editingTriples[tripleId] === true;
      };

      $scope.finishEditing = function (triple) {
        $scope.editingTriples[triple.id] = false;
        tripleChanged(triple.id);
      };
      $scope.keyPress = function (triple, event) {
        if (event.keyCode === 13) {
          $scope.finishEditing(triple);
        }
      };

      $scope.toggleTripleEdit = function (triple) {
        $scope.editingTriples[triple.id] = $scope.editingTriples[triple.id] !== true;

        if (!$scope.editingTriples[triple.id]) {
          tripleChanged(triple.id);
        }
      };


      $scope.editSubject = function (triple) {
        $scope.editingTriples[triple.id] = true;
        $scope.$broadcast('setFocus', 'subject');
      };

      $scope.editPredicate = function (triple) {
        $scope.editingTriples[triple.id] = true;
        $scope.$broadcast('setFocus', 'predicate');
      };

      $scope.editObject = function (triple) {
        $scope.editingTriples[triple.id] = true;
        $scope.$broadcast('setFocus', 'object');
      };


      ////////////////////
      // Tool functions:

      var removeTriple = function (triples, tripleId) {
        for (var i = 0; i < triples.length; i++) {
          var triple = triples[i];

          if (triple.id === tripleId) {
            triples = triples.slice(0, i).concat( triples.slice(i+1) );
            break;
          }
        }

        return triples;
      };

      var tripleChanged = function (tripleId) {
        // Just logging for now:

        var triple;
        for (var i = 0; i < $scope.triples.length; i++) {
          triple = $scope.triples[i];
        }
        console.log('Triple changed: ' + tripleId + ': ', triple);
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
