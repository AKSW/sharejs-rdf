(function() {
  var HybridDoc, HybridOp, hybridOT, parseTurtle, parserTriplesArrayToRdfJson, rdf;

  require('jasmine-expect');

  require('./matchers/triples');

  hybridOT = require('../lib/types/hybrid');

  HybridDoc = hybridOT.doc;

  HybridOp = hybridOT.op;

  rdf = require('node-rdf');

  parserTriplesArrayToRdfJson = function(triples) {
    var createRdfJsonObject, rdfJson, triple, _i, _len;
    createRdfJsonObject = function(object) {
      var objectType, rdfJsonObject;
      objectType = 'literal';
      if (object instanceof rdf.NamedNode) {
        objectType = 'uri';
      }
      if (object instanceof rdf.BlankNode) {
        objectType = 'bnode';
      }
      rdfJsonObject = {
        type: objectType,
        value: object.nominalValue
      };
      if (object.language) {
        rdfJsonObject.lang = object.language;
      }
      if (object.datatype) {
        rdfJsonObject.datatype = object.datatype;
      }
      return rdfJsonObject;
    };
    rdfJson = {};
    for (_i = 0, _len = triples.length; _i < _len; _i++) {
      triple = triples[_i];
      if (!rdfJson[triple.subject]) {
        rdfJson[triple.subject] = {};
      }
      if (!rdfJson[triple.subject][triple.predicate]) {
        rdfJson[triple.subject][triple.predicate] = [];
      }
      rdfJson[triple.subject][triple.predicate].push(createRdfJsonObject(triple.object));
    }
    return rdfJson;
  };

  parseTurtle = function(turtle) {
    var parsedDoc, parser, triple, _i, _len, _ref;
    parser = new rdf.TurtleParser;
    parsedDoc = null;
    try {
      parsedDoc = parserTriplesArrayToRdfJson(parser.graph.toArray());
      _ref = parser.graph.toArray();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        triple = _ref[_i];
        if (!triple.subject.nominalValue || !triple.predicate.nominalValue) {
          return [null, parser];
        }
      }
    } catch (_error) {}
    return parsedDoc;
  };

  describe('hybrid OT', function() {
    it('is named "turtle-rdf-json"', function() {
      return expect(hybridOT.name).toEqual('turtle-rdf-json');
    });
    it('can be attached to sharejs', function() {
      var rdfJsonIndex, sharejs;
      sharejs = require('share');
      rdfJsonIndex = require('..');
      rdfJsonIndex(sharejs);
      expect(sharejs.types['turtle-rdf-json']).toBeDefined();
      return expect(sharejs.types['turtle-rdf-json']).toEqual(hybridOT);
    });
    it('exports document & operation prototype', function() {
      expect(hybridOT.doc).toBeFunction();
      return expect(hybridOT.op).toBeFunction();
    });
    it('has working create method', function() {
      var doc;
      doc = hybridOT.create();
      expect(doc instanceof HybridDoc).toBeTruthy();
      expect(doc.getTurtleContent()).toEqual('');
      return expect(doc.getRdfJsonContent()).toEqual({});
    });
    describe('apply method', function() {
      it('works with empty operation', function() {
        var newSnapshot, op, snapshot;
        snapshot = hybridOT.create();
        op = new HybridOp([], {}, {});
        newSnapshot = hybridOT.apply(snapshot, op);
        expect(newSnapshot.getTurtleContent()).toEqual('');
        return expect(newSnapshot.getRdfJsonContent()).toEqual({});
      });
      it('works with text operations', function() {
        var newSnapshot, op, snapshot;
        snapshot = new HybridDoc('Hello World!', {});
        op = new HybridOp([
          {
            p: 6,
            d: 'World'
          }, {
            p: 6,
            i: 'Test'
          }
        ], {}, {});
        newSnapshot = hybridOT.apply(snapshot, op);
        expect(newSnapshot.getTurtleContent()).toEqual('Hello Test!');
        return expect(newSnapshot.getRdfJsonContent()).toEqual({});
      });
      it('works with rdf/json operations', function() {
        var newSnapshot, op, snapshot;
        snapshot = new HybridDoc('', {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        op = new HybridOp([], {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        }, {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        newSnapshot = hybridOT.apply(snapshot, op);
        return expect(newSnapshot.getRdfJsonContent()).toEqual({
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        });
      });
      it('works with text + rdf/json operations', function() {
        var newSnapshot, op, snapshot;
        snapshot = new HybridDoc('Hello World!', {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        op = new HybridOp([
          {
            p: 6,
            d: 'World'
          }, {
            p: 6,
            i: 'Test'
          }
        ], {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        }, {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        newSnapshot = hybridOT.apply(snapshot, op);
        expect(newSnapshot.getTurtleContent()).toEqual("Hello Test!\n" + "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n" + "### delete triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .");
        return expect(newSnapshot.getRdfJsonContent()).toEqual({
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        });
      });
      it('works with invalid turtle, rdf/json insertions then valid turtle', function() {
        var op, op2, snapshot;
        snapshot = new HybridDoc("http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .", {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        op = new HybridOp([], {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        }, {});
        op2 = new HybridOp([
          {
            p: 0,
            i: '<'
          }
        ], {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Richard Smith'
              }
            ]
          }
        }, {});
        snapshot = hybridOT.apply(snapshot, op);
        expect(snapshot.getTurtleContent()).toEqual("http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" + "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .");
        expect(snapshot.getRdfJsonContent()).triplesToEqual({
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
          }
        });
        snapshot = hybridOT.apply(snapshot, op2);
        expect(snapshot.getTurtleContent()).toEqual("<http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Richard Smith\" .");
        return expect(snapshot.getRdfJsonContent()).triplesToEqual({
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
            ],
            'http://example.com/ontology#age': [
              {
                type: 'literal',
                value: '36'
              }
            ]
          }
        });
      });
      it('works with invalid turtle, rdf/json deletions then valid turtle', function() {
        var op, op2, snapshot, turtle;
        turtle = "\nhttp://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" + "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n" + "\n" + "<http://example.com/persons/andy>   <http://example.com/ontology#name>   \"Andy Smith\" .";
        snapshot = new HybridDoc(turtle, {
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
        });
        op = new HybridOp([], {}, {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        });
        op2 = new HybridOp([
          {
            p: 1,
            i: '<'
          }
        ], {}, {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Richard Smith'
              }
            ]
          }
        });
        snapshot = hybridOT.apply(snapshot, op);
        expect(snapshot.getTurtleContent()).toEqual(turtle + "\n" + "### delete triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .");
        expect(snapshot.getRdfJsonContent()).triplesToEqual({
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
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
        });
        snapshot = hybridOT.apply(snapshot, op2);
        expect(snapshot.getTurtleContent()).toEqual("\n<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" + "\n" + "<http://example.com/persons/andy>   <http://example.com/ontology#name>   \"Andy Smith\" .");
        return expect(snapshot.getRdfJsonContent()).triplesToEqual({
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
        });
      });
      return describe('handles concurring, conflicting turtle and rdf/json operations', function() {
        it('(turtle insertion & rdf/json deletion)', function() {
          var op, rdfJson, snapshot, turtle;
          turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .";
          rdfJson = {
            'http://example.com/persons/john': {
              'http://example.com/ontology#name': [
                {
                  type: 'literal',
                  value: 'John Smith'
                }
              ]
            }
          };
          snapshot = new HybridDoc(turtle, rdfJson);
          op = new HybridOp([
            {
              p: 0,
              i: "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
            }
          ], {}, {
            'http://example.com/persons/john': {
              'http://example.com/ontology#name': [
                {
                  type: 'literal',
                  value: 'John R. Smith'
                }
              ]
            }
          });
          snapshot = hybridOT.apply(snapshot, op);
          expect(snapshot.getTurtleContent()).toEqual(turtle);
          return expect(snapshot.getRdfJsonContent()).triplesToEqual(rdfJson);
        });
        return it('(turtle deletion & rdf/json insertion)', function() {
          var op, rdfJson, snapshot, turtle;
          turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" .";
          rdfJson = {
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
            }
          };
          snapshot = new HybridDoc(turtle, rdfJson);
          op = new HybridOp([
            {
              p: 81,
              d: ", \"John R. Smith\""
            }
          ], {
            'http://example.com/persons/john': {
              'http://example.com/ontology#name': [
                {
                  type: 'literal',
                  value: 'John R. Smith'
                }
              ]
            }
          }, {});
          snapshot = hybridOT.apply(snapshot, op);
          expect(snapshot.getTurtleContent()).toEqual("<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" + "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .");
          return expect(snapshot.getRdfJsonContent()).triplesToEqual(rdfJson);
        });
      });
    });
    return describe('compose method', function() {
      return it('works for rdf & text insertions/deletions', function() {
        var composedOp, composedRdfDelShouldBe, composedRdfInsShouldBe, composedTextOpsShouldBe, op1, op2, rdfJson, snapshot, turtle;
        turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .";
        rdfJson = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        };
        snapshot = new HybridDoc(turtle, rdfJson);
        op1 = new HybridOp([
          {
            p: 0,
            d: "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
          }
        ], {}, {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        });
        op2 = new HybridOp([
          {
            p: 0,
            i: "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
          }
        ], {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        }, {});
        composedTextOpsShouldBe = [
          {
            p: 0,
            d: "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
          }, {
            p: 0,
            i: "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
          }
        ];
        composedRdfInsShouldBe = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John R. Smith'
              }
            ]
          }
        };
        composedRdfDelShouldBe = {
          'http://example.com/persons/john': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'John Smith'
              }
            ]
          }
        };
        composedOp = hybridOT.compose(op1, op2);
        expect(composedOp.getTextOps()).toEqual(composedTextOpsShouldBe);
        expect(composedOp.getRdfInsertions()).triplesToEqual(composedRdfInsShouldBe);
        return expect(composedOp.getRdfDeletions()).triplesToEqual(composedRdfDelShouldBe);
      });
    });
  });

}).call(this);
