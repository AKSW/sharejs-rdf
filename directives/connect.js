angular.module('rdfshare')
  .directive('rdfshareConnect', ['AlertService', 'RdfShareService', function(AlertService, RdfShareService) {
    'use strict';


    var connectTo = function(url, callback) {
      var options = {
        // authentication: '1234567'
      };

      RdfShareService.getDocument(url, options, callback);
    };


    var link = function(scope, element, attrs) {
      var url = attrs.rdfshareConnect;

      scope.$emit('rdfshare:connect-url', url);

      connectTo(url, function(error, doc) {
        if (error) {
          return AlertService.danger(error);
        }

        RdfShareService.setUpDocumentListeners(doc);
      });
    };


    return {
      link: link
    };

  }]
);
