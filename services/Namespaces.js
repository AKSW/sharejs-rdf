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


    var normalizeString = function(string) {
      string = string.trim();

      if (string.charAt(0) == '"' && string.charAt(string.length-1) == '"') {
        string = string.substr(1, string.length-2);
      }

      return string;
    };


    var register = function(namespaces) {
      for (var prefix in namespaces) {
        var uri = namespaces[prefix];

        setNamespace(prefix, uri);
      }
    };


    var registerByText = function(textContent) {
      var namespaces = {};
      var lines = textContent.split("\n");

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var separatorIndex = line.indexOf(':');

        if (separatorIndex > -1) {
          var prefix = normalizeString( line.substr(0, separatorIndex) );
          var uri = normalizeString( line.substr(separatorIndex+1) );

          namespaces[prefix] = uri;
        }
      }

      register(namespaces);

      return namespaces;
    };


    var setNamespace = function(prefix, uri) {
      namespaces[prefix] = uri;
    };


    return {
      getNamespaceUri: getNamespaceUri,
      register: register,
      registerByText: registerByText
    };

  }]
);
