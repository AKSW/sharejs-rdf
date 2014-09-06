angular.module('app').factory('RdfJsonAttachmentService', ['TripleSet', function (TripleSet) {
  'use strict';

  var failedInsertion = null;

  var AttachmentService = {
    /**
     * @param {object} shareDoc
     * @param {object} scope
     * @param {object} [cmEditor]
     */
    attachDocToEditor: function (shareDoc, scope, cmEditor) {

      var _insert = function (triple) {
        shareDoc.insertRdfJson( tripleObjectToRdfJson(triple) );
      };

      var _delete = function (triple) {
        shareDoc.deleteRdfJson( tripleObjectToRdfJson(triple) );
      };

      var _update = function (triple, previous) {
        shareDoc.updateRdfJson( tripleObjectToRdfJson(triple), tripleObjectToRdfJson(previous) );
      };

      var updateRdfJsonEditor = function () {
        scope.$broadcast('setTriples', rdfJsonToTriples(shareDoc.getRdfJsonData()));
      };

      var updateTextEditor = function () {
        if (cmEditor) {
          cmEditor.setValue(shareDoc.getTurtleData());
        }
      };


      updateRdfJsonEditor();

      shareDoc.on('rdf-update', function (triplesToIns, triplesToDel) {
        console.log('rdf/json remote update: insertion: ', triplesToIns, ' | deletion: ', triplesToDel);

        scope.$broadcast('insertTriples', rdfJsonToTriples(triplesToIns));
        scope.$broadcast('deleteTriples', rdfJsonToTriples(triplesToDel));
      });

      // triggered by shareDoc.submitOp()
      shareDoc.on('change', function(op) {
        // check if op is a hybrid op:
        if (!op.textOps) {
          return;
        }

        // turtle contents changed
        if (op.textOps && op.textOps.length > 0) {
          updateRdfJsonEditor();
        }

        // rdf contents changed
        if (op.rdfInsertions && op.rdfDeletions && (!rdfJsonEmpty(op.rdfInsertions) || !rdfJsonEmpty(op.rdfDeletions))) {
          updateTextEditor();
        }
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

  var rdfJsonEmpty = function (rdfJson) {
    var tripleCount = 0;

    for (var subjUri in rdfJson) {
      var predicates = rdfJson[subjUri];

      for (var predUri in predicates) {
        var objects = predicates[predUri];
        tripleCount += objects.length;
      }
    }

    return tripleCount === 0;
  };


  return AttachmentService;

}]);
