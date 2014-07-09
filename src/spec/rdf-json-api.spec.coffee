require 'jasmine-expect'
require './matchers/triples'

types = require '../lib/types'
rdfJson = types['rdf-json']

describe 'rdf-json-api', ->
  it 'has been attached', ->
    expect(rdfJson.api).toBeObject()
    expect(rdfJson.api.provides).toEqual {rdfJson: true}
  
