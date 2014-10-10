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
    getDocument: getDocument
  };

}]);
