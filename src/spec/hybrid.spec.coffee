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

    expect(sharejs.types['turtle-rdf-json']).toBeDefined();
    expect(sharejs.types['turtle-rdf-json']).toEqual(hybridOT);
