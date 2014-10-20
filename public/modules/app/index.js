angular.module('app', ['ui.bootstrap', 'ui.codemirror', 'rdfshare'])
  .run(['Namespaces', function(Namespaces) {
    'use strict';

    Namespaces.register({
      'ex': 'http://example.com/ontology/'
    });
  }]
);
