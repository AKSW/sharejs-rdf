(function() {
  var HybridDoc, HybridOp, hybridOT, rdfJsonOT, textOT;

  require('jasmine-expect');

  require('./matchers/triples');

  hybridOT = require('../lib/types/hybrid');

  rdfJsonOT = require('../lib/types/rdf-json');

  textOT = (require('../node_modules/share/')).types.text;

  HybridDoc = hybridOT.doc;

  HybridOp = hybridOT.op;

  describe('hybrid OT emits correct sync events', function() {
    var doc;
    doc = null;
    beforeEach(function() {
      doc = {
        emit: function() {
          return null;
        }
      };
      return spyOn(doc, 'emit');
    });
    it('(turtle insertion)', function() {
      var op, snapshot, turtle;
      turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" + "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n";
      snapshot = new HybridDoc(turtle, {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }, {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        }
      });
      op = new HybridOp([
        {
          p: 193,
          i: "<http://example.com/persons/andy> <http://example.com/ontology#name> \"Andy Smith\" ."
        }
      ], {}, {});
      hybridOT.registerDoc(doc);
      hybridOT.apply(snapshot, op);
      return expect(doc.emit).toHaveBeenCalledWith('sync-rdf', {
        d: {},
        i: {
          'http://example.com/persons/andy': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'Andy Smith'
              }
            ]
          }
        }
      });
    });
    it('(turtle deletion)', function() {
      var op, snapshot, turtle;
      turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" + "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n" + "<http://example.com/persons/andy> <http://example.com/ontology#name>   \"Andy Smith\" .";
      snapshot = new HybridDoc(turtle, {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }, {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        },
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      });
      op = new HybridOp([
        {
          p: 193,
          d: "<http://example.com/persons/andy> <http://example.com/ontology#name>   \"Andy Smith\" ."
        }
      ], {}, {});
      hybridOT.registerDoc(doc);
      hybridOT.apply(snapshot, op);
      return expect(doc.emit).toHaveBeenCalledWith('sync-rdf', {
        i: {},
        d: {
          'http://example.com/persons/andy': {
            'http://example.com/ontology#name': [
              {
                type: 'literal',
                value: 'Andy Smith'
              }
            ]
          }
        }
      });
    });
    it('(rdf/json insertion)', function() {
      var op, snapshot, turtle;
      turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" + "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n";
      snapshot = new HybridDoc(turtle, {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }, {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        }
      });
      op = new HybridOp([], {
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      }, {});
      hybridOT.registerDoc(doc);
      hybridOT.apply(snapshot, op);
      return expect(doc.emit).toHaveBeenCalledWith('sync-text-insert', {
        p: 193,
        i: "\n<http://example.com/persons/andy> <http://example.com/ontology#name> \"Andy Smith\" ."
      });
    });
    return it('(rdf/json deletion)', function() {
      var op, snapshot, turtle;
      turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" + "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n" + "<http://example.com/persons/andy> <http://example.com/ontology#name>   \"Andy Smith\" .";
      snapshot = new HybridDoc(turtle, {
        'http://example.com/persons/john': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'John Smith'
            }, {
              type: 'literal',
              value: 'John R. Smith'
            }, {
              type: 'literal',
              value: 'John Richard Smith'
            }
          ]
        },
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      });
      op = new HybridOp([], {}, {
        'http://example.com/persons/andy': {
          'http://example.com/ontology#name': [
            {
              type: 'literal',
              value: 'Andy Smith'
            }
          ]
        }
      });
      hybridOT.registerDoc(doc);
      hybridOT.apply(snapshot, op);
      return expect(doc.emit).toHaveBeenCalledWith('sync-text-replace', {
        p: 193,
        i: "",
        d: "<http://example.com/persons/andy> <http://example.com/ontology#name>   \"Andy Smith\" ."
      });
    });
  });

}).call(this);
