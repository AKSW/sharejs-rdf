describe 'sharejs-rdf-json', () ->
  rdfJson = null

  beforeEach () ->
    rdfJson = require '../lib/types/sharejs-rdf-json'

  describe '"rdf-json" type object', () ->
    it 'is named rdf-json', () ->
      expect(rdfJson.name).toEqual('rdf-json')
