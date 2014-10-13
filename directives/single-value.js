angular.module('rdfshare')
  .directive('rdfshareSingleValue', ['RdfShareService', 'RdfJsonUtil', function(RdfShareService, RdfJsonUtil) {
    'use strict';

    var link = function(scope, element, attrs) {
      var resourceUri = RdfShareService.getRdfShareResource(element);
      var predicateUri = attrs.rdfshareSingleValue;

      predicateUri = RdfShareService.resolveNamespacePrefix(predicateUri);

      onInsertion(scope, resourceUri, predicateUri, function(objects) {
        var object = objects[0];
        angular.element(element).text(object.value);
      });
    };

    var onInsertion = function(scope, resourceUri, predicateUri, callback) {
      RdfShareService.onDataUpdate(scope, function(rdfJsonInserted, rdfJsonDeleted) {
        var objects = RdfJsonUtil.objectsForSP(rdfJsonInserted, resourceUri, predicateUri);

        if (objects.length > 0) {
          callback(objects);
        }
      });
    };

    return {
      link: link
    };

  }]
);
