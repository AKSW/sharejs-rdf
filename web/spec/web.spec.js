(function() {
  describe('rdf/json web client script', function() {
    var rdfJson, sharejs;
    sharejs = window.sharejs;
    rdfJson = sharejs.types['rdf-json'];
    beforeEach(function() {
      return jasmine.addMatchers({
        toBeObject: function() {
          return {
            compare: function(actual) {
              return {
                pass: typeof actual === 'object'
              };
            }
          };
        },
        toBeFunction: function() {
          return {
            compare: function(actual) {
              return {
                pass: typeof actual === 'function'
              };
            }
          };
        }
      });
    });
    it('is attached to share-js', function() {
      return expect(rdfJson).toBeObject();
    });
    return it('has the necessary properties', function() {
      expect(rdfJson.Doc).toBeFunction();
      expect(rdfJson.Operation).toBeFunction();
      expect(rdfJson.name).toEqual('rdf-json');
      expect(rdfJson.create).toBeFunction();
      expect(rdfJson.apply).toBeFunction();
      return expect(rdfJson.transform).toBeFunction();
    });
  });

}).call(this);
