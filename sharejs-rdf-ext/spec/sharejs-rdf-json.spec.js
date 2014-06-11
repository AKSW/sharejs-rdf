(function() {
  var jsonld, rdfJson;

  require('jasmine-expect');

  jsonld = require('jsonld');

  rdfJson = require('../lib/types/sharejs-rdf-json');

  describe('sharejs-rdf-json', function() {
    describe('type object', function() {
      return it('is named rdf-json', function() {
        return expect(rdfJson.name).toEqual('rdf-json');
      });
    });
    return describe('create method', function() {
      var doc;
      doc = rdfJson.create();
      it('returns object', function() {
        return expect(doc).toBeObject();
      });
      return it('returns empty, but parsable set of tripels', function() {
        var done;
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
