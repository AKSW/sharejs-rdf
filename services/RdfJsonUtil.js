angular.module('rdfshare')
  .factory('RdfJsonUtil', [function() {
    'use strict';

    var objectsForSP = function(rdfJson, subjectUri, predicateUri) {
      if (!rdfJson[subjectUri] || !rdfJson[subjectUri][predicateUri]) {
        return [];
      }

      return rdfJson[subjectUri][predicateUri];
    };

    return {
      objectsForSP: objectsForSP
    };

  }]
);
