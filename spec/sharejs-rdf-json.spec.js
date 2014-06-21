(function() {
  var RdfJsonDoc, RdfJsonOperation, jsonld, rdfJson;

  require('jasmine-expect');

  require('./matchers/triples');

  jsonld = require('jsonld');

  rdfJson = require('../lib/types/sharejs-rdf-json');

  RdfJsonDoc = rdfJson.Doc;

  RdfJsonOperation = rdfJson.Operation;

  describe('sharejs-rdf-json', function() {
    it('is named rdf-json', function() {
      return expect(rdfJson.name).toEqual('rdf-json');
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
        triples = doc.exportTriples();
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
    describe('apply method', function() {
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
        return expect(newSnapshot.exportTriples()).triplesToEqual(afterInsertionShouldBe);
      });
      return it('does deletion', function() {
        var newSnapshot, op, snapshot;
        snapshot = new RdfJsonDoc(testTriples);
        op = RdfJsonOperation.remove(testDeletionTriples);
        newSnapshot = rdfJson.apply(snapshot, op);
        return expect(newSnapshot.exportTriples()).triplesToEqual(afterDeletionShouldBe);
      });
    });
    return describe('transform method', function() {
      describe('basic testing:', function() {
        var op1, op1Clone, op1_transformed, op2, op2Clone, op2_transformed;
        op1 = RdfJsonOperation.insert({
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Richard Smith'
              }
            ]
          }
        });
        op2 = RdfJsonOperation.insert({
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        });
        op1Clone = op1.clone();
        op2Clone = op2.clone();
        spyOn(op1, 'clone');
        spyOn(op2, 'clone');
        op1_transformed = rdfJson.transform(op1, op2, 'left');
        it('clones op1', function() {
          return expect(op1.clone).toHaveBeenCalled;
        });
        op2_transformed = rdfJson.transform(op2, op1, 'right');
        it('clones op2', function() {
          return expect(op2.clone).toHaveBeenCalled;
        });
        return it('does not modify the input operations', function() {
          expect(op1.triples()).triplesToEqual(op1Clone.triples());
          return expect(op2.triples()).triplesToEqual(op2Clone.triples());
        });
      });
      return describe('functional testing:', function() {
        var insertion1, removal1, testCase, testCases, _i, _len, _results;
        insertion1 = {
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
        removal1 = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Richard Smith'
              }
            ]
          }
        };
        testCases = [
          {
            label: 'transforms op1:insert, op2:remove',
            op1: RdfJsonOperation.insert(insertion1),
            op2: RdfJsonOperation.remove(removal1),
            doc: {
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
            },
            should_be: {
              'http://example.com/persons/john': {
                'http://example.com/ontology#name': [
                  {
                    type: 'literal',
                    value: 'John Smith'
                  }, {
                    type: 'literal',
                    value: 'John R. Smith'
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
            }
          }
        ];
        _results = [];
        for (_i = 0, _len = testCases.length; _i < _len; _i++) {
          testCase = testCases[_i];
          _results.push(it(testCase.label, function() {
            var op1, op1_transformed, op2, op2_transformed, snapshot, snapshot_1, snapshot_2;
            op1 = testCase.op1;
            op2 = testCase.op2;
            op1_transformed = rdfJson.transform(op1, op2, 'left');
            op2_transformed = rdfJson.transform(op2, op1, 'right');
            snapshot = new RdfJsonDoc(testCase.doc);
            snapshot_1 = rdfJson.apply(snapshot, op1);
            snapshot_1 = rdfJson.apply(snapshot_1, op2_transformed);
            snapshot_2 = rdfJson.apply(snapshot, op2);
            snapshot_2 = rdfJson.apply(snapshot_2, op1_transformed);
            expect(snapshot_1.exportTriples()).triplesToEqual(testCase.should_be);
            return expect(snapshot_2.exportTriples()).triplesToEqual(testCase.should_be);
          }));
        }
        return _results;
      });
    });
  });

}).call(this);
