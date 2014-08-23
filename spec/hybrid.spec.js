(function() {
  var HybridDoc, HybridOp, hybridOT;

  require('jasmine-expect');

  require('./matchers/triples');

  hybridOT = require('../lib/types/hybrid');

  HybridDoc = hybridOT.doc;

  HybridOp = hybridOT.op;

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
    return describe('apply method', function() {
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
      return it('works with invalid turtle, rdf/json changes then valid turtle', function() {
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
    });
  });

}).call(this);
