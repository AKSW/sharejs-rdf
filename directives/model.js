angular.module('rdfshare')
  .directive('rdfshareModel', ['RdfShareService', 'RdfJsonUtil', function(RdfShareService, RdfJsonUtil) {
    'use strict';

    var createValueObject = function(element, value) {
      var type = element.rdfshareType || 'literal';

      var valueObject = {
        type: type,
        value: value
      };

      var lang = getElementTripleProperty(element, 'lang');
      if (lang) {
        valueObject[lang] = lang;
      }

      var dataType = getElementTripleProperty(element, 'dataType');
      if (dataType) {
        valueObject[dataType] = dataType;
      }

      return valueObject;
    };


    var getElementTripleProperty = function(element, propertyName) {
      var $element = angular.element(element);

      propertyName = 'rdfshare-' + propertyName;

      return $element.data(propertyName) || $element.attr(propertyName);
    };

    var setElementTripleProperty = function(element, propertyName, propertyValue) {
      var $element = angular.element(element);

      propertyName = 'rdfshare-' + propertyName;

      $element.data(propertyName, propertyValue);
    };


    var link = function(scope, element, attrs) {
      var resourceUri = RdfShareService.getRdfShareResource(element);
      var predicateUri = attrs.rdfshareModel;

      predicateUri = RdfShareService.resolveNamespacePrefix(predicateUri);

      setListeners(scope, element, resourceUri, predicateUri);
    };


    var onInsertion = function(scope, resourceUri, predicateUri, callback) {
      RdfShareService.onDataUpdate(scope, function(rdfJsonInserted, rdfJsonDeleted) {
        var objects = RdfJsonUtil.objectsForSP(rdfJsonInserted, resourceUri, predicateUri);

        if (objects.length > 0) {
          callback(objects);
        }
      });
    };


    var setListeners = function(scope, element, resourceUri, predicateUri) {
      onInsertion(scope, resourceUri, predicateUri, function(objects) {
        var object = objects[0];

        updateInputElementByTriple(element, resourceUri, predicateUri, object);
      });

      scope.$on('rdfshare:connect-url', function(event, connectUrl) {
        element.on('input', function() {
          RdfShareService.getDocument(connectUrl, {}, function(error, doc) {
            if (error) {
              throw error;
            }

            updateRdfByInputElement(doc, element, resourceUri, predicateUri);
          });
        });
      });
    };


    var updateInputElementByTriple = function(element, resourceUri, predicateUri, object) {
      element.val(object.value);
      setElementTripleProperty(element, 'prevValue', object.value);
      setElementTripleProperty(element, 'type', object.type);

      if (object.lang) {
        setElementTripleProperty(element, 'lang', object.lang);
      }

      if (object.dataType) {
        setElementTripleProperty(element, 'dataType', object.dataType);
      }
    };


    var updateRdfByInputElement = function(doc, element, resourceUri, predicateUri) {
      var value = element.val();
      var prevValue = getElementTripleProperty(element, 'prevValue');

      var valueObject = createValueObject(element, value);
      var prevValueObject = createValueObject(element, prevValue);

      var rdfJsonInsertion = RdfJsonUtil.tripleToRdfJson(resourceUri, predicateUri, valueObject);
      var rdfJsonDeletion = RdfJsonUtil.tripleToRdfJson(resourceUri, predicateUri, prevValueObject);

      RdfShareService.updateRdf(doc, rdfJsonInsertion, rdfJsonDeletion);
      setElementTripleProperty(element, 'prevValue', value);
    };


    return {
      link: link
    };

  }]
);
