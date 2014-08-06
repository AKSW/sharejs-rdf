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
    return it('has working create method', function() {
      var doc;
      doc = hybridOT.create();
      expect(doc instanceof HybridDoc).toBeTruthy();
      expect(doc.getTurtleContent()).toEqual('');
      return expect(doc.getRdfJsonContent()).toEqual({});
    });
  });

}).call(this);
