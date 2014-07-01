'use strict';

angular.module('app').controller('AppController', ['$scope', function($scope) {

  $scope.alerts = [];

  /**
   *  @param {string} message - The message to display.
   *  @param {string} type - Type of the message: 'info', 'success', 'warning', 'danger'
   */
  $scope.$on('alert', function(event, message, type) {
    $scope.alerts.push({
      message: message,
      type: type
    });

    $scope.$apply();
  });

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

}]);
