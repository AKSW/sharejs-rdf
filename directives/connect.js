angular.module('rdfshare')
  .directive('rdfshareConnect', ['AlertService', 'RdfShareService', 'TripleSet', function(AlertService, RdfShareService, TripleSet) {
    'use strict';

    var shareDoc;

    var tripleSet = new TripleSet();


    var connectTo = function(url, callback) {
      var serverUrl = url.split('#')[0];
      var docName = url.split('#')[1];

      if (!docName) {
        return AlertService.danger('No document name given. Append to server URL as "#<doc name>".');
      }

      var options = {
        // authentication: '1234567'
      };

      RdfShareService.getDocument(serverUrl, docName, options, callback);
    };


    var initialDataUpdate = function(scope, rdfJson) {
      RdfShareService.broadcastDataUpdate(scope, rdfJson, {});
    };


    var link = function(scope, element, attrs) {
      var url = attrs.rdfshareConnect;

      connectTo(url, function(error, doc) {
        if (error) {
          return AlertService.danger(error);
        }

        var rdfJson = doc.getRdfJsonData();

        shareDoc = doc;
        tripleSet = TripleSet.createByRdfJson(rdfJson);

        initialDataUpdate(scope, rdfJson);
      });
    };

    return {
      link: link
    };

  }]
);
