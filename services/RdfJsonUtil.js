angular.module('rdfshare')
  .factory('RdfJsonUtil', [function() {
    'use strict';

    var objectsForSP = function(rdfJson, subjectUri, predicateUri) {
      if (!rdfJson[subjectUri] || !rdfJson[subjectUri][predicateUri]) {
        return [];
      }

      return rdfJson[subjectUri][predicateUri];
    };


    var tripleToRdfJson = function(subjectUri, predicateUri, object) {
      var rdfJson = {};

      rdfJson[subjectUri] = {};
      rdfJson[subjectUri][predicateUri] = [object];

      return rdfJson;
    };


    return {
      objectsForSP: objectsForSP,
      tripleToRdfJson: tripleToRdfJson
    };

  }]
);
