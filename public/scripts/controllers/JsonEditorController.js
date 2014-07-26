'use strict';

angular.module('app').controller('JsonEditorController',
                                ['$scope', '$element', 'AlertService', function ($scope, $element, AlertService) {

  // Properties:

  $scope.serverUrl = 'http://' + document.location.hostname + ':4000/channel#test';
  $scope.jsonRdfContents = {};


  var shareDoc;

  $scope.connect = function () {
    var serverUrl = $scope.serverUrl.split('#')[0];
    var docName = $scope.serverUrl.split('#')[1];

    if (!docName) {
      return AlertService.danger('No document name given. Append to server URL as "#<doc name>".');
    }

    var options = {
      // authentication: '1234567',
      origin: serverUrl
    };

    sharejs.open(docName, 'rdf-json', options, function (error, doc) {
      if (error) {
        return AlertService.danger(error);
      }

      AlertService.success('Connected to ' + serverUrl + '#' + docName);
      shareDoc = doc;

      $scope.$broadcast('insertTriples', rdfJsonToTriples(shareDoc.getData()));

      shareDoc.on('update', function (triplesToIns, triplesToDel) {
        console.log('rdf/json remote update: insertion: ', triplesToIns, ' | deletion: ', triplesToDel);

        $scope.$broadcast('insertTriples', rdfJsonToTriples(triplesToIns));
        $scope.$broadcast('deleteTriples', rdfJsonToTriples(triplesToDel));
      });
    });
  };

  $scope.$on('rdf-json-operation', function (event, operation) {
    if (!shareDoc) {
      return;
    }

    switch(operation.op) {
      case '+':
        shareDoc.insert(
          tripleObjectToRdfJson(operation.triple)
        );
        break;
      case '-':
        shareDoc.delete(
          tripleObjectToRdfJson(operation.triple)
        );
        break;
      case 'e':
        console.log('edit');
        shareDoc.update(
          tripleObjectToRdfJson(operation.triple),
          tripleObjectToRdfJson(operation.previous)
        );
        break;
    }
  });


  //////////////////
  // Tool functions

  var tripleObjectToRdfJson = function (triple) {
    var rdfJson = {};

    rdfJson[triple.s] = {};
    rdfJson[triple.s][triple.p] = [];
    rdfJson[triple.s][triple.p].push( triple.o );

    return rdfJson;
  };

  var rdfJsonToTriples = function (rdfJson) {
    var triples = [];

    for (var subjUri in rdfJson) {
      var predicates = rdfJson[subjUri];
      for (var predUri in predicates) {
        var objects = predicates[predUri];
        for (var i = 0; i < objects.length; i++) {
          var object = objects[i];
          triples.push({s: subjUri, p: predUri, o: object});
        }
      }
    }

    return triples;
  };

}]);
