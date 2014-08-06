(function() {
  describe('rdf/json web client script', function() {
    var hybridOT, rdfJson, sharejs;
    sharejs = window.sharejs;
    rdfJson = sharejs.types['rdf-json'];
    hybridOT = sharejs.types['turtle-rdf-json'];
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
    describe('rdf/json type', function() {
      it('is attached to share-js', function() {
        return expect(rdfJson).toBeObject();
      });
      return it('has the necessary properties', function() {
        expect(rdfJson.Doc).toBeFunction();
        expect(rdfJson.Operation).toBeFunction();
        expect(rdfJson.name).toEqual('rdf-json');
        expect(rdfJson.apply).toBeFunction();
        expect(rdfJson.compose).toBeFunction();
        expect(rdfJson.create).toBeFunction();
        return expect(rdfJson.transform).toBeFunction();
      });
    });
    return describe('hybrid type', function() {
      it('is attached to share-js', function() {
        return expect(hybridOT).toBeObject();
      });
      return it('has the necessary properties', function() {
        expect(hybridOT.doc).toBeFunction();
        expect(hybridOT.op).toBeFunction();
        expect(hybridOT.name).toEqual('turtle-rdf-json');
        expect(hybridOT.apply).toBeFunction();
        expect(hybridOT.compose).toBeFunction();
        expect(hybridOT.create).toBeFunction();
        return expect(hybridOT.transform).toBeFunction();
      });
    });
  });

}).call(this);
