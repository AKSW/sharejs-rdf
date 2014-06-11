require('jasmine-expect')

jsonld = require('jsonld')
rdfJson = require '../lib/types/sharejs-rdf-json'


describe 'sharejs-rdf-json', () ->
  
  describe 'type object', () ->
    it 'is named rdf-json', () ->
      expect(rdfJson.name).toEqual('rdf-json')


  describe 'create method', () ->
    doc = rdfJson.create()

    it 'returns object', () ->
      expect(doc).toBeObject()

    it 'returns empty, but parsable set of tripels', () ->
      done = false

      runs () ->
        jsonld.flatten doc, (err, flattened) ->
          expect(flattened).toBeObject()
          expect(flattened).toEqual({})
          done = true

      waitsFor () ->
        done
