angular.module('app').directive('hybridEditor', function () {
  'use strict';

  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/hybrid-editor.html',

    controller: ['$scope', 'AlertService', 'RdfJsonAttachmentService',
                function ($scope, AlertService, RdfJsonAttachmentService) {

      var turtleEditor;

      $scope.codemirrorLoaded = function (editor) {
        turtleEditor = editor;
      };

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

        sharejs.open(docName, 'turtle-rdf-json', options, function (error, doc) {
          if (error) {
            return AlertService.danger(error);
          }

          doc.attach_cm(turtleEditor);
          RdfJsonAttachmentService.attachDocToEditor(doc, $scope);

          AlertService.success('Connected to ' + serverUrl + '#' + docName);
        });
      };

    }]
  };
});
