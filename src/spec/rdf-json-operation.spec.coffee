require 'jasmine-expect'
require './matchers/triples'

rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonOperation = rdfJson.Operation


describe 'RdfJsonOperation', () ->

  testTriples =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John Smith' } ]


  it 'possesses operation type constants', () ->
    expect(RdfJsonOperation::OP_INSERT).toEqual 'insert'
    expect(RdfJsonOperation::OP_REMOVE).toEqual 'remove'

  it 'has working constructor & getters', () ->
    op = new RdfJsonOperation(RdfJsonOperation::OP_INSERT, testTriples)

    expect(op.operation()).toEqual RdfJsonOperation::OP_INSERT
    expect(op.getTriples()).triplesToEqual testTriples

  it 'can set triples', () ->
    op = new RdfJsonOperation(RdfJsonOperation::OP_INSERT, {})

    op.setTriples testTriples
    expect(op.getTriples()).triplesToEqual testTriples

  it 'can clone', () ->
    op = new RdfJsonOperation(RdfJsonOperation::OP_INSERT, testTriples)
    clone = op.clone()

    expect(clone.operation()).toEqual op.operation()
    expect(clone.getTriples()).triplesToEqual op.getTriples()


  describe 'has working factory methods:', () ->

    it 'insert', () ->
      op = RdfJsonOperation.insert(testTriples)

      expect(op.operation()).toEqual RdfJsonOperation::OP_INSERT
      expect(op.getTriples()).triplesToEqual testTriples

    it 'remove', () ->
      op = RdfJsonOperation.remove(testTriples)

      expect(op.operation()).toEqual RdfJsonOperation::OP_REMOVE
      expect(op.getTriples()).triplesToEqual testTriples
