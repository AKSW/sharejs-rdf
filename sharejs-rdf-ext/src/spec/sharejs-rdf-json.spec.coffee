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
