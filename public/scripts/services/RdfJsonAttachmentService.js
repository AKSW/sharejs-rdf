angular.module('app').factory('RdfJsonAttachmentService', ['TripleSet', function (TripleSet) {
  'use strict';

  var failedInsertion = null;

  var AttachmentService = {
    attachDocToEditor: function (shareDoc, scope) {

      var _insert = function (triple) {
        shareDoc.insertRdfJson( tripleObjectToRdfJson(triple) );
      };

      var _delete = function (triple) {
        shareDoc.deleteRdfJson( tripleObjectToRdfJson(triple) );
      };

      var _update = function (triple, previous) {
        shareDoc.updateRdfJson( tripleObjectToRdfJson(triple), tripleObjectToRdfJson(previous) );
      };


      scope.$broadcast('insertTriples', rdfJsonToTriples(shareDoc.getData()));

      shareDoc.on('update', function (triplesToIns, triplesToDel) {
        console.log('rdf/json remote update: insertion: ', triplesToIns, ' | deletion: ', triplesToDel);

        scope.$broadcast('insertTriples', rdfJsonToTriples(triplesToIns));
        scope.$broadcast('deleteTriples', rdfJsonToTriples(triplesToDel));
      });

      scope.$on('rdf-json-operation', function (event, operation) {
        switch(operation.op) {
          case '+':
            try {
              _insert(operation.triple);
              failedInsertion = null;
            } catch (error) {
              failedInsertion = operation.triple;
            }
            break;
          case '-':
            _delete(operation.triple);
            break;
          case 'e':
            if (failedInsertion && TripleSet.triplesEqual(operation.triple, failedInsertion)) {
              _insert(operation.triple);
              failedInsertion = null;
            } else {
              _update(operation.triple, operation.previous);
            }
            break;
        }
      });
    }
  };


  //////////////////
  // Tool functions

  var tripleObjectToRdfJson = function (triple) {
    var tripleSet = new TripleSet();
    tripleSet.addTriple(triple.s, triple.p, triple.o);

    return tripleSet.toRdfJson();
  };

  var rdfJsonToTriples = function (rdfJson) {
    var tripleSet = TripleSet.createByRdfJson(rdfJson);

    return tripleSet.getTriples();
  };


  return AttachmentService;

}]);
