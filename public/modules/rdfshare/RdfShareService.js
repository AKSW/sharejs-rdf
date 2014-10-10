/**
 * Service that manages opening share.js documents, so no document is opened,
 * but the existing instance is shared instead.
 */
angular.module('rdfshare').factory('RdfShareService', [function() {
  'use strict';

  /** {<document key>: <document>, ...} */
  var openDocuments = {};

  /** {<document key>: <array of callbacks>, ...} */
  var documentsBeingOpened = {};


  var broadcastDataUpdate = function(scope, rdfJsonInserted, rdfJsonDeleted) {
    scope.$broadcast('rdfshare-update', {
      inserted: rdfJsonInserted,
      deleted:  rdfJsonDeleted
    });
  };


  var onDataUpdate = function(scope, handler) {
    scope.$on('rdfshare-update', function(event, data) {
      handler(data.inserted, data.deleted);
    });
  };


  var cloneObject = function(object) {
    var clone = {};

    for (var key in object) {
      clone[key] = object[key];
    }

    return clone;
  };


  var createDocumentKey = function(serverUrl, documentName) {
    return serverUrl + '#' + documentName;
  };


  var getRdfShareResource = function(element) {
    var resourceUri = getRdfShareResourceOrNull(element);

    if (!resourceUri) {
      console.error('Unable to get rdfshare-resource for ', element);
      throw new Error('Unable to get rdfshare-resource for ' + element);
    }

    return resourceUri;
  };


  var getRdfShareResourceOrNull = function(element) {
    element = angular.element(element);

    var data = element.attr('data-rdfshare-resource') || element.attr('rdfshare-resource');

    if (data) {
      return data;
    }

    var parent = element.parent();

    if (parent.length == 0 || parent[0] == document.body) {
      return null;
    }

    return getRdfShareResourceOrNull(parent);
  };


  /**
   * @method RdfShareService.getDocument
   * @param {string} serverUrl    Url to the share server instance.
   * @param {string} documentName
   * @param {object} shareOptions Additional options passed to sharejs.open(), authentication data for instance
   * @param {function} callback   callback(error, document)
   */
  var getDocument = function(serverUrl, documentName, shareOptions, callback) {
    var docKey = createDocumentKey(serverUrl, documentName);

    // has the document already been opened?
    if (openDocuments[docKey]) {
      callback(null, openDocuments[docKey]);
      return;
    }

    // is the document already being opened?
    if (documentsBeingOpened[docKey]) {
      documentsBeingOpened[docKey].push(callback);
      return;
    }

    // open the document
    documentsBeingOpened[docKey] = [callback];
    openDocument(serverUrl, documentName, shareOptions, docKey);
  };


  var openDocument = function(serverUrl, documentName, shareOptions, docKey) {
    var options = cloneObject(shareOptions);
    options.origin = serverUrl;

    sharejs.open(documentName, 'rdf-json', options, function(error, doc) {
      var callbacks = documentsBeingOpened[docKey];
      documentsBeingOpened[docKey] = null;

      if (!error) {
        openDocuments[docKey] = doc;
      }

      for (var i = 0; i < callbacks.length; i++) {
        var callback = callbacks[i];

        try {
          callback(error, doc);
        } catch (errorThrown) {
          console.error(errorThrown.stack);
        }
      }
    });
  };


  // Exports:

  return {
    broadcastDataUpdate : broadcastDataUpdate,
    getDocument: getDocument,
    getRdfShareResource: getRdfShareResource,
    onDataUpdate: onDataUpdate
  };

}]);
