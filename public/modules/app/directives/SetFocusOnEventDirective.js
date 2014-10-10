angular.module('app').directive('setFocusOnEvent', function () {
  'use strict';

  return {
    restrict: 'A',
    link: function (scope, element, attributes) {
      var focusEventParam = attributes.setFocusOnEvent;

      scope.$on('setFocus', function (event, param) {
        if (param === focusEventParam) {
          setTimeout(function() {
            element[0].focus();
            element[0].select();
          }, 50);
        }
      });
    }
  };
});
