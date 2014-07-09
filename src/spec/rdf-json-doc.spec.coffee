require 'jasmine-expect'
require './matchers/triples'

rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonDoc = rdfJson.Doc


describe 'RdfJsonDoc', () ->
  testTriples =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John Smith' } ]
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]


  it 'has empty triples object', () ->
    doc = new RdfJsonDoc()
    expect(doc.exportTriples()).triplesToEqual {}

  it 'can insert', () ->
    doc = new RdfJsonDoc()
    doc.insert testTriples
    expect(doc.exportTriples()).triplesToEqual testTriples

  it 'can clone', () ->
    doc = new RdfJsonDoc(testTriples)
    clone = doc.clone()
    expect(clone.exportTriples()).triplesToEqual testTriples

  it 'clone is independent of original document', () ->
    doc = new RdfJsonDoc(testTriples)
    clone = doc.clone()

    clone.insert(
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John R. Smith' } ]
    )
    expect(doc.exportTriples()).triplesToEqual testTriples

  it 'can delete', () ->
    doc = new RdfJsonDoc(testTriples)
    doc.delete testTriples
    expect(doc.exportTriples()).triplesToEqual {}

  it 'insertion of duplicates causes no change', () ->
    doc = new RdfJsonDoc(testTriples)
    doc.insert(
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]
    )
    expect(doc.exportTriples()).triplesToEqual testTriples

  it 'removal of empty triple set causes no change', () ->
    doc = new RdfJsonDoc(testTriples)
    doc.delete {}
    expect(doc.exportTriples()).triplesToEqual testTriples

  it 'removal of non-existing triple set causes no change', () ->
    doc = new RdfJsonDoc(testTriples)
    doc.delete(
      'http://example.com/persons/andy':
        'http://example.com/ontology#age':
          [ { type: 'literal', value: '20', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    )
    expect(doc.exportTriples()).triplesToEqual testTriples

  it 'throws error on invalid subject', () ->
    doc = new RdfJsonDoc()
    expect(() ->
      doc.insert {12: { 'http://example.com/ontology#name': [ { type: 'literal', value: 'John Smith' } ] } }
    ).toThrow(new Error("Subject must be an URI: 12"))

  it 'throws error on invalid predicate', () ->
    doc = new RdfJsonDoc()
    expect(() ->
      doc.insert {'http://example.com/persons/john': { 'http:/x.y/#name': [ { type: 'literal', value: 'John Smith' } ] } }
    ).toThrow(new Error("Predicate must be an URI: http:/x.y/#name (of subject http://example.com/persons/john)"))

  it 'throws error on invalid objects', () ->
    doc = new RdfJsonDoc()
    expect(() ->
      doc.insert {'http://example.com/persons/john': { 'http://example.com/ontology#name': { type: 'literal', value: 'John Smith' } } }
    ).toThrow(new Error("Objects must be an array of objects: [object Object] (of subject http://example.com/persons/john, predicate http://example.com/ontology#name)"))


describe 'RDFJsonDoc (more complex insertion/deletion)', () ->
  testTriples1 =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John Smith' } ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]

  testTriples2 =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John R. Smith' }, { type: 'literal', value: 'John Richard Smith' } ]

  testTriples3 =
    'http://example.com/persons/john':
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]

  testTriples4 =
    'http://example.com/persons/henry':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Henry Smith' } ]

  afterTriples2ShouldBe =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Smith' },
          { type: 'literal', value: 'John R. Smith' },
          { type: 'literal', value: 'John Richard Smith' }
        ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]

  afterTriples3ShouldBe =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Smith' },
          { type: 'literal', value: 'John R. Smith' },
          { type: 'literal', value: 'John Richard Smith' }
        ]
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]

  afterTriples4ShouldBe =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Smith' },
          { type: 'literal', value: 'John R. Smith' },
          { type: 'literal', value: 'John Richard Smith' }
        ]
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]
    'http://example.com/persons/henry':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Henry Smith' } ]

  deletion1 =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Richard Smith' },
          { type: 'literal', value: 'John R. Smith' }
        ]

  deletion2 =
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]


  afterDeletion1ShouldBe =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Smith' }
        ]
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    'http://example.com/persons/andy':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Andy Smith' } ]
    'http://example.com/persons/henry':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Henry Smith' } ]

  afterDeletion2ShouldBe =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [
          { type: 'literal', value: 'John Smith' }
        ]
      'http://example.com/ontology#age':
        [ { type: 'literal', value: '30', datatype: 'http://www.w3.org/2001/XMLSchema#integer' } ]
    'http://example.com/persons/henry':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'Henry Smith' } ]


  doc = new RdfJsonDoc(testTriples1)

  it 'is initialized properly', () ->
    expect(doc.exportTriples()).triplesToEqual testTriples1

  it 'can add triple to existing subject and predicate', () ->
    doc.insert testTriples2
    expect(doc.exportTriples()).triplesToEqual afterTriples2ShouldBe

  it 'can add triple to existing subject', () ->
    doc.insert testTriples3
    expect(doc.exportTriples()).triplesToEqual afterTriples3ShouldBe

  it 'can add triple (new subject)', () ->
    doc.insert testTriples4
    expect(doc.exportTriples()).triplesToEqual afterTriples4ShouldBe

  it 'can delete two of three triples of the same subject and predicate', () ->
    doc.delete deletion1
    expect(doc.exportTriples()).triplesToEqual afterDeletion1ShouldBe

  it 'can delete the only triple of this subject', () ->
    doc.delete deletion2
    expect(doc.exportTriples()).triplesToEqual afterDeletion2ShouldBe
