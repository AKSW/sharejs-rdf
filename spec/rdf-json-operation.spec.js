(function() {
  var RdfJsonOperation, rdfJson;

  require('jasmine-expect');

  require('./matchers/triples');

  rdfJson = require('../lib/types/rdf-json');

  RdfJsonOperation = rdfJson.Operation;

  describe('RdfJsonOperation', function() {
    var testTriples;
    testTriples = {
      'http://example.com/persons/john': {
        'http://example.com/ontology#name': [
          {
            type: 'literal',
            value: 'John Smith'
          }
        ]
      }
    };
    it('possesses operation type constants', function() {
      expect(RdfJsonOperation.prototype.OP_INSERT).toEqual('insert');
      return expect(RdfJsonOperation.prototype.OP_DELETE).toEqual('delete');
    });
    it('has working constructor & getters', function() {
      var op;
      op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, testTriples);
      expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_INSERT);
      return expect(op.getTriples()).triplesToEqual(testTriples);
    });
    it('can set triples', function() {
      var op;
      op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, {});
      op.setTriples(testTriples);
      return expect(op.getTriples()).triplesToEqual(testTriples);
    });
    it('can clone', function() {
      var clone, op;
      op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, testTriples);
      clone = op.clone();
      expect(clone.operation()).toEqual(op.operation());
      return expect(clone.getTriples()).triplesToEqual(op.getTriples());
    });
    return describe('has working factory methods:', function() {
      it('insert', function() {
        var op;
        op = RdfJsonOperation.insert(testTriples);
        expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_INSERT);
        return expect(op.getTriples()).triplesToEqual(testTriples);
      });
      return it('delete', function() {
        var op;
        op = RdfJsonOperation["delete"](testTriples);
        expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_DELETE);
        return expect(op.getTriples()).triplesToEqual(testTriples);
      });
    });
  });

}).call(this);
