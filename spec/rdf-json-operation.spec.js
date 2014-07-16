(function() {
  var RdfJsonOperation, rdfJson;

  require('jasmine-expect');

  require('./matchers/triples');

  rdfJson = require('../lib/types/rdf-json');

  RdfJsonOperation = rdfJson.Operation;

  describe('RdfJsonOperation', function() {
    var testTriples, testTriples2;
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
    testTriples2 = {
      'http://example.com/persons/andy': {
        'http://example.com/ontology#age': [
          {
            type: 'literal',
            value: '25'
          }
        ]
      }
    };
    it('has working constructor & getters', function() {
      var op;
      op = new RdfJsonOperation(testTriples, testTriples2);
      expect(op.getTriplesToAdd()).triplesToEqual(testTriples);
      return expect(op.getTriplesToDel()).triplesToEqual(testTriples2);
    });
    it('can set triples', function() {
      var op;
      op = new RdfJsonOperation({}, {});
      op.setTriplesToAdd(testTriples);
      op.setTriplesToDel(testTriples2);
      expect(op.getTriplesToAdd()).triplesToEqual(testTriples);
      return expect(op.getTriplesToDel()).triplesToEqual(testTriples2);
    });
    it('can clone', function() {
      var clone, op;
      op = new RdfJsonOperation(testTriples, testTriples2);
      clone = op.clone();
      expect(clone.getTriplesToAdd()).triplesToEqual(testTriples);
      return expect(clone.getTriplesToDel()).triplesToEqual(testTriples2);
    });
    return describe('has working factory methods:', function() {
      it('insert', function() {
        var op;
        op = RdfJsonOperation.insert(testTriples);
        expect(op.getTriplesToAdd()).triplesToEqual(testTriples);
        return expect(op.getTriplesToDel()).triplesToEqual({});
      });
      return it('delete', function() {
        var op;
        op = RdfJsonOperation["delete"](testTriples);
        expect(op.getTriplesToAdd()).triplesToEqual({});
        return expect(op.getTriplesToDel()).triplesToEqual(testTriples);
      });
    });
  });

}).call(this);
