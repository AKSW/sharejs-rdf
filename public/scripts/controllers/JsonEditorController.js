'use strict';

angular.module('app').controller('JsonEditorController',
                                ['$scope', 'AlertService', function ($scope, AlertService) {

  // Properties:

  $scope.serverUrl = 'http://localhost:4000/channel#test';
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

    sharejs.open(docName, 'rdf-json', options, function (error/*, doc*/) {
      if (error) {
        return AlertService.danger(error);
      }

      // TODO
    });
  };

  $scope.$on('rdf-json-operation', function (event, operation) {
    console.log('rdf/json operation: ', operation);
  });

}]);
