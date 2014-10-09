angular.module('rdfshare')
  .directive('rdfshareConnect', [function() {
    'use strict';

    return {
      scope: {
        url: '@rdfshareConnect'
      },
      link: function(scope) {
        var url = scope.url;

        
      }
    };
  }]
);
