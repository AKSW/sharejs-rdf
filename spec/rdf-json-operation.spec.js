(function() {
  var RdfJsonOperation, rdfJson;

  require('jasmine-expect');

  require('./matchers/triples');

  rdfJson = require('../lib/types/sharejs-rdf-json');

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
      return expect(RdfJsonOperation.prototype.OP_REMOVE).toEqual('remove');
    });
    it('has working constructor', function() {
      var op;
      op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, testTriples);
      expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_INSERT);
      return expect(op.triples()).triplesToEqual(testTriples);
    });
    it('can clone', function() {
      var clone, op;
      op = new RdfJsonOperation(RdfJsonOperation.prototype.OP_INSERT, testTriples);
      clone = op.clone();
      expect(clone.operation()).toEqual(op.operation());
      return expect(clone.triples()).triplesToEqual(op.triples());
    });
    return describe('has working factory methods:', function() {
      it('insert', function() {
        var op;
        op = RdfJsonOperation.insert(testTriples);
        expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_INSERT);
        return expect(op.triples()).triplesToEqual(testTriples);
      });
      return it('remove', function() {
        var op;
        op = RdfJsonOperation.remove(testTriples);
        expect(op.operation()).toEqual(RdfJsonOperation.prototype.OP_REMOVE);
        return expect(op.triples()).triplesToEqual(testTriples);
      });
    });
  });

}).call(this);
