require 'jasmine-expect'
require './matchers/triples'

types = require '../lib/types'
hybridOT = types['turtle-rdf-json']

describe 'hybrid-api', ->
  it 'has been attached', ->
    expect(hybridOT.api).toBeObject()
    expect(hybridOT.api.provides).toEqual { text: true, rdfJson: true }
