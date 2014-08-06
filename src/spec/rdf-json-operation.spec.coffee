require 'jasmine-expect'
require './matchers/triples'

rdfJson = require '../lib/types/rdf-json'

RdfJsonOperation = rdfJson.Operation


describe 'RdfJsonOperation', ->

  testTriples =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John Smith' } ]

  testTriples2 =
    'http://example.com/persons/andy':
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '25' } ]


  it 'has working constructor & getters', ->
    op = new RdfJsonOperation(testTriples, testTriples2)

    expect(op.getTriplesToAdd()).triplesToEqual testTriples
    expect(op.getTriplesToDel()).triplesToEqual testTriples2

  it 'can set triples', ->
    op = new RdfJsonOperation({}, {})

    op.setTriplesToAdd testTriples
    op.setTriplesToDel testTriples2
    expect(op.getTriplesToAdd()).triplesToEqual testTriples
    expect(op.getTriplesToDel()).triplesToEqual testTriples2

  it 'can clone', ->
    op = new RdfJsonOperation(testTriples, testTriples2)
    clone = op.clone()

    expect(clone.getTriplesToAdd()).triplesToEqual testTriples
    expect(clone.getTriplesToDel()).triplesToEqual testTriples2

  it 'can create from serialised data', ->
    op = new RdfJsonOperation(testTriples, testTriples2)
    serialised = JSON.parse JSON.stringify(op)

    op2 = RdfJsonOperation.fromData serialised
    expect(op2.getTriplesToAdd()).triplesToEqual testTriples
    expect(op2.getTriplesToDel()).triplesToEqual testTriples2


  describe 'has working factory methods:', ->

    it 'insert', ->
      op = RdfJsonOperation.insert(testTriples)

      expect(op.getTriplesToAdd()).triplesToEqual testTriples
      expect(op.getTriplesToDel()).triplesToEqual {}

    it 'delete', ->
      op = RdfJsonOperation.delete(testTriples)

      expect(op.getTriplesToAdd()).triplesToEqual {}
      expect(op.getTriplesToDel()).triplesToEqual testTriples
