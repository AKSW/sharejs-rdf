angular.module('app', ['ui.bootstrap', 'ui.codemirror', 'rdfshare'])
  .run(['Namespaces', function(Namespaces) {
    'use strict';

    Namespaces.setNamespace('ex', 'http://example.com/ontology/');
  }]
);
