(function() {
  var RdfJsonDoc, RdfJsonOperation, jsonld, rdfJson;

  require('jasmine-expect');

  jsonld = require('jsonld');

  rdfJson = require('../lib/types/sharejs-rdf-json');

  RdfJsonDoc = rdfJson.Doc;

  RdfJsonOperation = rdfJson.Operation;

  describe('sharejs-rdf-json', function() {
    describe('type object', function() {
      return it('is named rdf-json', function() {
        return expect(rdfJson.name).toEqual('rdf-json');
      });
    });
    describe('create method', function() {
      var doc;
      doc = rdfJson.create();
      it('returns RdfJsonDoc instance', function() {
        expect(doc).toBeObject();
        return expect(doc instanceof RdfJsonDoc).toBeTruthy();
      });
      return it('returns empty, but parsable set of triples', function() {
        var done, triples;
        done = false;
        triples = doc.triples();
        runs(function() {
          return jsonld.flatten(triples, function(err, flattened) {
            expect(flattened).toEqual({});
            return done = true;
          });
        });
        return waitsFor(function() {
          return done;
        });
      });
    });
    return describe('apply method', function() {
      var afterDeletionShouldBe, afterInsertionShouldBe, testDeletionTriples, testInsertionTriples, testTriples;
      testTriples = {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }
          ]
        },
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      };
      testInsertionTriples = {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        }
      };
      testDeletionTriples = {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }
          ]
        }
      };
      afterInsertionShouldBe = {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }, {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        },
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      };
      afterDeletionShouldBe = {
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      };
      it('does insertion', function() {
        var newSnapshot, op, snapshot;
        snapshot = new RdfJsonDoc(testTriples);
        op = RdfJsonOperation.insert(testInsertionTriples);
        newSnapshot = rdfJson.apply(snapshot, op);
        return expect(newSnapshot.triples()).toEqual(afterInsertionShouldBe);
      });
      return it('does deletion', function() {
        var newSnapshot, op, snapshot;
        snapshot = new RdfJsonDoc(testTriples);
        op = RdfJsonOperation.remove(testDeletionTriples);
        newSnapshot = rdfJson.apply(snapshot, op);
        return expect(newSnapshot.triples()).toEqual(afterDeletionShouldBe);
      });
    });
  });

}).call(this);
