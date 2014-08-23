require 'jasmine-expect'
require './matchers/triples'

hybridOT = require '../lib/types/hybrid'

HybridDoc = hybridOT.doc
HybridOp  = hybridOT.op


describe 'hybrid OT', ->

  it 'is named "turtle-rdf-json"', ->
    expect(hybridOT.name).toEqual('turtle-rdf-json')

  it 'can be attached to sharejs', ->
    sharejs = require 'share'
    rdfJsonIndex = require '..'

    rdfJsonIndex sharejs

    expect(sharejs.types['turtle-rdf-json']).toBeDefined()
    expect(sharejs.types['turtle-rdf-json']).toEqual hybridOT

  it 'exports document & operation prototype', ->
    expect(hybridOT.doc).toBeFunction();
    expect(hybridOT.op).toBeFunction();

  it 'has working create method', ->
    doc = hybridOT.create()

    expect(doc instanceof HybridDoc).toBeTruthy()
    expect(doc.getTurtleContent()).toEqual ''
    expect(doc.getRdfJsonContent()).toEqual {}

  describe 'apply method', ->

    it 'works with empty operation', ->
      snapshot = hybridOT.create()
      op = new HybridOp [], {}, {}

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual ''
      expect(newSnapshot.getRdfJsonContent()).toEqual {}

    it 'works with text operations', ->
      snapshot = new HybridDoc 'Hello World!', {}
      op = new HybridOp [ {p:6, d:'World'}, {p:6, i:'Test'} ], {}, {}

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual 'Hello Test!'
      expect(newSnapshot.getRdfJsonContent()).toEqual {}

    it 'works with rdf/json operations', ->
      snapshot = new HybridDoc '', {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getRdfJsonContent()).toEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
      }

    it 'works with text + rdf/json operations', ->
      snapshot = new HybridDoc 'Hello World!', {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [ {p:6, d:'World'}, {p:6, i:'Test'} ],
        {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual(
        "Hello Test!\n"+
        "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n"+
        "### delete triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
      )
      expect(newSnapshot.getRdfJsonContent()).toEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
      }


    it 'works with invalid turtle, rdf/json changes then valid turtle', ->
      snapshot = new HybridDoc "http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n"+
                               "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .", {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {}
      op2 = new HybridOp [{p: 0, i: '<'}], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Richard Smith' } ]
        }, {}

      snapshot = hybridOT.apply snapshot, op

      expect(snapshot.getTurtleContent()).toEqual(
        "http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
        "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' } ]
      }

      snapshot = hybridOT.apply snapshot, op2

      expect(snapshot.getTurtleContent()).toEqual(
        "<http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Richard Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' }, { type: 'literal', value: 'John Richard Smith' } ]
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '36' } ]
      }


    # TODO: Test edge-case: turtle triple insertion + rdf/json deletion of the same triple and vice versa
