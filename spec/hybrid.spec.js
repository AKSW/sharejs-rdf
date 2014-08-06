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
        expect(newSnapshot.getTurtleContent()).toEqual('');
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
      return it('works with text + rdf/json operations', function() {
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
        expect(newSnapshot.getTurtleContent()).toEqual('Hello Test!');
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
    });
  });

}).call(this);
