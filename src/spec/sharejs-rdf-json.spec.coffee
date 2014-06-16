require('jasmine-expect')

jsonld = require('jsonld')
rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonDoc = rdfJson.Doc
RdfJsonOperation = rdfJson.Operation

describe 'sharejs-rdf-json', () ->

  describe 'type object', () ->
    it 'is named rdf-json', () ->
      expect(rdfJson.name).toEqual('rdf-json')


  describe 'create method', () ->
    doc = rdfJson.create()

    it 'returns RdfJsonDoc instance', () ->
      expect(doc).toBeObject()
      expect(doc instanceof RdfJsonDoc).toBeTruthy();

    it 'returns empty, but parsable set of triples', () ->
      done = false
      triples = doc.triples()

      runs () ->
        jsonld.flatten triples, (err, flattened) ->
          expect(flattened).toEqual({})
          done = true

      waitsFor () ->
        done


  describe 'apply method', () ->
    testTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John Smith' } ]
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]

    testInsertionTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John R. Smith' }, { type: 'literal', value: 'John Richard Smith' } ]

    testDeletionTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John Smith' } ]

    afterInsertionShouldBe =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [
            { type: 'literal', value: 'John Smith' }
            { type: 'literal', value: 'John R. Smith' }
            { type: 'literal', value: 'John Richard Smith' }
          ]
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]

    afterDeletionShouldBe =
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]


    it 'does insertion', () ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.insert testInsertionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.triples()).toEqual afterInsertionShouldBe

    it 'does deletion', () ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.remove testDeletionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.triples()).toEqual afterDeletionShouldBe
    
