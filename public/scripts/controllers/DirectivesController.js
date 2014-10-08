angular.module('app').controller('DirectivesController',
                                ['$scope', function ($scope) {
  'use strict';

  // Properties:

  $scope.serverUrl = 'http://' + document.location.hostname + ':4000/channel#test';

}]);
