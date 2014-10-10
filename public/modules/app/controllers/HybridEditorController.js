angular.module('app').controller('HybridEditorController',
                                ['$scope', function ($scope) {
  'use strict';

  // Properties:

  $scope.serverUrl = 'http://' + document.location.hostname + ':4000/channel#test';

  // The logic is placed in the HybridEditorDirective

}]);
