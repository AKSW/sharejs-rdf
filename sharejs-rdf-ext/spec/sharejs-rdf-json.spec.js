(function() {
  var jsonld;

  require('jasmine-expect');

  jsonld = require('jsonld');

  describe('sharejs-rdf-json', function() {
    var rdfJson;
    rdfJson = null;
    beforeEach(function() {
      return rdfJson = require('../lib/types/sharejs-rdf-json');
    });
    describe('type object', function() {
      return it('is named rdf-json', function() {
        return expect(rdfJson.name).toEqual('rdf-json');
      });
    });
    return describe('create method', function() {
      it('returns object', function() {
        var doc;
        doc = rdfJson.create();
        return expect(doc).toBeObject();
      });
      return it('returns empty set of tripels', function() {
        var doc, done;
        doc = rdfJson.create();
        done = false;
        runs(function() {
          return jsonld.flatten(doc, function(err, flattened) {
            expect(flattened).toBeObject();
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
