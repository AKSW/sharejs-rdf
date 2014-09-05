(function() {
  var hybridOT, types;

  require('jasmine-expect');

  require('./matchers/triples');

  types = require('../lib/types');

  hybridOT = types['turtle-rdf-json'];

  describe('hybrid-api', function() {
    return it('has been attached', function() {
      expect(hybridOT.api).toBeObject();
      return expect(hybridOT.api.provides).toEqual({
        text: true,
        rdfJson: true
      });
    });
  });

}).call(this);
