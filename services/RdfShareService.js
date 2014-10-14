/**
 * Service that manages opening share.js documents, so no document is opened,
 * but the existing instance is shared instead.
 */
angular.module('rdfshare').factory('RdfShareService', ['$rootScope', 'Namespaces', function($rootScope, Namespaces) {
  'use strict';

  /** {<document key>: <document>, ...} */
  var openDocuments = {};

  /** {<document key>: <array of callbacks>, ...} */
  var documentsBeingOpened = {};


  var broadcastDataUpdate = function(rdfJsonInserted, rdfJsonDeleted) {
    $rootScope.$broadcast('rdfshare:update', {
      inserted: rdfJsonInserted,
      deleted:  rdfJsonDeleted
    });
  };


  var onDataUpdate = function(scope, handler) {
    scope.$on('rdfshare:update', function(event, data) {
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
    var resourceUri = getParentElementAttrValue(element, 'rdfshare-resource');

    if (!resourceUri) {
      console.error('Unable to get rdfshare-resource for ', element);
      throw new Error('Unable to get rdfshare-resource for ' + element);
    }

    return resolveNamespacePrefix(resourceUri);
  };


  var getParentElementAttrValue = function(element, attributeName) {
    element = angular.element(element);

    var data = element.attr('data-' + attributeName) || element.attr(attributeName);

    if (data) {
      return data;
    }

    var parent = element.parent();

    if (parent.length == 0 || parent[0] == document.body) {
      return null;
    }

    return getParentElementAttrValue(parent, attributeName);
  };


  /**
   * @method RdfShareService.getDocument
   * @param {string} connectUrl   Url to the share server instance: http://host:port/path#documentName
   * @param {object} shareOptions Additional options passed to sharejs.open(), authentication data for instance
   * @param {function} callback   callback(error, document)
   */
  var getDocument = function(connectUrl, shareOptions, callback) {
    var parsed = parseServerUrl(connectUrl);

    var serverUrl = parsed[0];
    var documentName = parsed[1];

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


  var parseServerUrl = function(url) {
    var serverUrl = url.split('#')[0];
    var docName = url.split('#')[1];

    if (!docName) {
      throw new Error('No document name given. Append to server URL as "#<doc name>".');
    }

    return [serverUrl, docName];
  };


  var resolveNamespacePrefix = function(uri) {
    var match = uri.match(/^(\w+):(?!\/\/)/);

    if (!match) {
      return uri;
    }

    var nsPrefix = match[1].toLowerCase();
    var nsUri = Namespaces.getNamespaceUri(nsPrefix);

    if (!nsUri) {
      throw new Error('Unknown namespace prefix: ' + nsPrefix);
    }

    return uri.replace(match[0], nsUri);
  };


  var updateRdf = function(rdfshareDoc, rdfJsonInsertion, rdfJsonDeletion) {
    rdfshareDoc.updateRdfJson(rdfJsonInsertion, rdfJsonDeletion);

    broadcastDataUpdate(rdfJsonInsertion, rdfJsonDeletion);
  };


  // Exports:

  return {
    broadcastDataUpdate : broadcastDataUpdate,
    getDocument: getDocument,
    getRdfShareResource: getRdfShareResource,
    onDataUpdate: onDataUpdate,
    resolveNamespacePrefix: resolveNamespacePrefix,
    updateRdf: updateRdf
  };

}]);
