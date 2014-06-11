(function() {
  describe('sharejs-rdf-json', function() {
    var rdfJson;
    rdfJson = null;
    beforeEach(function() {
      return rdfJson = require('../lib/types/sharejs-rdf-json');
    });
    return describe('"rdf-json" type', function() {
      return it('is named rdf-json', function() {
        return expect(rdfJson.name).toEqual('rdf-json');
      });
    });
  });

}).call(this);
