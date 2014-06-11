require('jasmine-expect')

jsonld = require('jsonld')


describe 'sharejs-rdf-json', () ->
  rdfJson = null

  beforeEach () ->
    rdfJson = require '../lib/types/sharejs-rdf-json'


  describe 'type object', () ->
    it 'is named rdf-json', () ->
      expect(rdfJson.name).toEqual('rdf-json')


  describe 'create method', () ->
    it 'returns object', () ->
      doc = rdfJson.create()
      expect(doc).toBeObject()

    it 'returns empty, but parsable set of tripels', () ->
      doc = rdfJson.create()
      done = false

      runs () ->
        jsonld.flatten doc, (err, flattened) ->
          expect(flattened).toBeObject()
          expect(flattened).toEqual({})
          done = true

      waitsFor () ->
        done
