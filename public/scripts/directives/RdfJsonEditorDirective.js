'use strict';

/**
 *  Triples are stored as objects:
 *  {id: <integer id>, s: "<subject URI>", p: "<predicate URI>", o: "<object>"}
 *
 *  The `<object>` is an object whose syntax is equivalent to:
 *  https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html#overview-of-rdf-json
 */

angular.module('app')
.directive('rdfJsonEditor', function () {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/rdf-json-editor.html',

    controller: ['$scope', function ($scope) {
      var nextTripleId = 1;

      $scope.triples = [];

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
        for (var i = 0; i < $scope.triples.length; i++) {
          var triple = $scope.triples[i];

          if (triple.id === tripleId) {
            $scope.triples = $scope.triples.slice(0, i).concat( $scope.triples.slice(i+1) );
            break;
          }
        }
      };


      ////////////////////
      // Tool functions:

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
    }]
  };
});
