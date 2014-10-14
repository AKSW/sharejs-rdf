angular.module('rdfshare')
  .directive('rdfshareConnect', ['AlertService', 'RdfShareService', function(AlertService, RdfShareService) {
    'use strict';


    var connectTo = function(url, callback) {
      var options = {
        // authentication: '1234567'
      };

      RdfShareService.getDocument(url, options, callback);
    };


    var initialDataUpdate = function(rdfJson) {
      RdfShareService.broadcastDataUpdate(rdfJson, {});
    };


    var link = function(scope, element, attrs) {
      var url = attrs.rdfshareConnect;

      scope.$emit('rdfshare:connect-url', url);

      connectTo(url, function(error, doc) {
        if (error) {
          return AlertService.danger(error);
        }

        var rdfJson = doc.getRdfJsonData();

        initialDataUpdate(rdfJson);
      });
    };


    return {
      link: link
    };

  }]
);
