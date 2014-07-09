(function() {
  var rdfJson, types;

  require('jasmine-expect');

  require('./matchers/triples');

  types = require('../lib/types');

  rdfJson = types['rdf-json'];

  describe('rdf-json-api', function() {
    return it('has been attached', function() {
      expect(rdfJson.api).toBeObject();
      return expect(rdfJson.api.provides).toEqual({
        rdfJson: true
      });
    });
  });

}).call(this);
