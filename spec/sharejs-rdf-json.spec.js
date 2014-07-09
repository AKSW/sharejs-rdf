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
    it('can be attached to sharejs', function() {
      var rdfJsonIndex, sharejs;
      sharejs = require('share');
      rdfJsonIndex = require('..');
      rdfJsonIndex(sharejs);
      expect(sharejs.types['rdf-json']).toBeDefined();
      return expect(sharejs.types['rdf-json']).toEqual(rdfJson);
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
        it('does not modify the input operations', function() {
          expect(op1.getTriples()).triplesToEqual(op1Clone.getTriples());
          return expect(op2.getTriples()).triplesToEqual(op2Clone.getTriples());
        });
        return it('throws error on bad side parameter', function() {
          var side;
          side = 'foobar';
          return expect(function() {
            return rdfJson.transform(op1, op2, side);
          }).toThrow(new Error("Bad parameter 'side' given: " + side));
        });
      });
      return describe('functional testing:', function() {
        var insertion1, insertionRemoval2, insertionRemoval3, removal1, runTest, testCase, testCases, testTriples, _i, _len, _results;
        runTest = function(op1, op2, doc, should_be) {
          var op1_transformed, op2_transformed, snapshot, snapshot1, snapshot2;
          op1_transformed = rdfJson.transform(op1, op2, 'left');
          op2_transformed = rdfJson.transform(op2, op1, 'right');
          snapshot = new RdfJsonDoc(doc);
          snapshot1 = rdfJson.apply(snapshot, op1);
          snapshot1 = rdfJson.apply(snapshot1, op2_transformed);
          snapshot2 = rdfJson.apply(snapshot, op2);
          snapshot2 = rdfJson.apply(snapshot2, op1_transformed);
          expect(snapshot1.exportTriples()).triplesToEqual(should_be);
          return expect(snapshot2.exportTriples()).triplesToEqual(should_be);
        };
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
        insertionRemoval2 = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        };
        insertionRemoval3 = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        };
        testCases = [
          {
            label: 'transforms op1:<insert new>, op2:<remove one of new ones>',
            op1: RdfJsonOperation.insert(insertion1),
            op2: RdfJsonOperation.remove(removal1),
            doc: testTriples,
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
          }, {
            label: 'transforms op1:<insert already existing>, op2:<remove this triples>',
            op1: RdfJsonOperation.insert(insertionRemoval2),
            op2: RdfJsonOperation.remove(insertionRemoval2),
            doc: testTriples,
            should_be: {
              'http://example.com/persons/john': {
                'http://example.com/ontology#name': []
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
          }, {
            label: 'transforms op1:<remove triple>, op2:<insert this triple again>',
            op1: RdfJsonOperation.remove(insertionRemoval2),
            op2: RdfJsonOperation.insert(insertionRemoval2),
            doc: testTriples,
            should_be: {
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
            }
          }, {
            label: 'transforms op1:<remove not-yet-existing>, op2:<insert this triple>',
            op1: RdfJsonOperation.remove(insertionRemoval3),
            op2: RdfJsonOperation.insert(insertionRemoval3),
            doc: testTriples,
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
            return runTest(testCase.op1, testCase.op2, testCase.doc, testCase.should_be);
          }));
        }
        return _results;
      });
    });
  });

}).call(this);
