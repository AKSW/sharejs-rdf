angular.module('rdfshare')
  .factory('Namespaces', [function() {
    'use strict';

    var namespaces = {
      dc:   'http://purl.org/dc/elements/1.1/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      geo:  'http://www.w3.org/2003/01/geo/wgs84_pos#',
      owl:  'http://www.w3.org/2002/07/owl#',
      rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd:  'http://www.w3.org/2001/XMLSchema#'
    };


    var getNamespaceUri = function(prefix) {
      return namespaces[prefix];
    };


    var setNamespace = function(prefix, uri) {
      namespaces[prefix] = uri;
    };


    return {
      getNamespaceUri: getNamespaceUri,
      setNamespace: setNamespace
    };

  }]
);
