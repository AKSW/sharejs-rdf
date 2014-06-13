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
    return describe('create method', function() {
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
  });

}).call(this);
