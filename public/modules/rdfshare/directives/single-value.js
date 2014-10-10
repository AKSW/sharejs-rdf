angular.module('rdfshare')
  .directive('rdfshareSingleValue', ['RdfShareService', 'RdfJsonUtil', function(RdfShareService, RdfJsonUtil) {
    'use strict';

    var link = function(scope, element, attrs) {
      var resourceUri = RdfShareService.getRdfShareResource(element);
      var predicateUri = attrs.rdfshareSingleValue;

      predicateUri = RdfShareService.resolveNamespacePrefix(predicateUri);

      RdfShareService.onDataUpdate(scope, function(rdfJsonInserted, rdfJsonDeleted) {
        var objects = RdfJsonUtil.objectsForSP(rdfJsonInserted, resourceUri, predicateUri);

        if (objects.length > 0) {
          var object = objects[0];
          angular.element(element).text(object.value);
        }
      });
    };

    return {
      link: link
    };

  }]
);
