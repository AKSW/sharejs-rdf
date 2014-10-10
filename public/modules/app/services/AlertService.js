angular.module('app').factory('AlertService', [function() {
  'use strict';
  
  var service = {
    /**
     *  @param {string} message - The message to display.
     *  @param {string} [type] - Type of the message: 'info', 'success', 'warning', 'danger'
     */
    alert : function(message, type) {
      type = type || 'info';

      var alertsElement = angular.element( document.getElementById('alerts') );
      alertsElement.scope().$emit('alert', message, type);
    },

    info : function(message) {
      service.alert(message);
    },

    success : function(message) {
      service.alert(message, 'success');
    },

    warning : function(message) {
      service.alert(message, 'warning');
    },

    danger : function(message) {
      service.alert(message, 'danger');
    }
  };

  return service;
}]);
