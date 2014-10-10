angular.module('app').controller('JsonEditorController',
                                ['$scope', '$element', 'AlertService', 'RdfJsonAttachmentService',
                                function ($scope, $element, AlertService, RdfJsonAttachmentService) {
  'use strict';

  // Properties:

  $scope.serverUrl = 'http://' + document.location.hostname + ':4000/channel#test';
  $scope.jsonRdfContents = {};


  $scope.connect = function () {
    var serverUrl = $scope.serverUrl.split('#')[0];
    var docName = $scope.serverUrl.split('#')[1];

    if (!docName) {
      return AlertService.danger('No document name given. Append to server URL as "#<doc name>".');
    }

    var options = {
      // authentication: '1234567',
      origin: serverUrl
    };

    sharejs.open(docName, 'rdf-json', options, function (error, doc) {
      if (error) {
        return AlertService.danger(error);
      }

      AlertService.success('Connected to ' + serverUrl + '#' + docName);

      RdfJsonAttachmentService.attachDocToEditor(doc, $scope);
    });
  };

}]);
