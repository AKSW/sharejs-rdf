angular.module('app').controller('HybridEditorController',
                                ['$scope', '$element', 'AlertService', function ($scope, $element, AlertService) {
  'use strict';

  // Properties:

  $scope.serverUrl = 'http://' + document.location.hostname + ':4000/channel#test';
  $scope.jsonRdfContents = {};


  var shareDoc;

  $scope.connect = function () {
    // TODO
  };

}]);
