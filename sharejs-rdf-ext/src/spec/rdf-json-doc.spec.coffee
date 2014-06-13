require('jasmine-expect')

rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonDoc = rdfJson.Doc


describe 'RdfJsonDoc (empty)', () ->
  doc = new RdfJsonDoc()

  testTriples =
    'http://example.com/persons/john':
      'http://example.com/ontology#name':
        [ { type: 'literal', value: 'John Smith' } ]

  it 'has empty triples object', () ->
    expect(doc.triples()).toEqual({})

  it 'can insert', () ->
    doc.insert testTriples
    expect(doc.triples()).toEqual(testTriples)

  it 'removal of empty triple set causes no change', () ->
    doc.remove {}
    expect(doc.triples()).toEqual(testTriples)

  it 'can delete', () ->
    doc.remove testTriples
    expect(doc.triples()).toEqual({})

  it 'throws error on invalid subject', () ->
    expect(() ->
      doc.insert {12: { 'http://example.com/ontology#name': [ { type: 'literal', value: 'John Smith' } ] } }
    ).toThrow(new Error("Subject must be an URI: 12"))

  it 'throws error on invalid predicate', () ->
    expect(() ->
      doc.insert {'http://example.com/persons/john': { 'http:/x.y/#name': [ { type: 'literal', value: 'John Smith' } ] } }
    ).toThrow(new Error("Predicate must be an URI: http:/x.y/#name (of subject http://example.com/persons/john)"))

  it 'throws error on invalid objects', () ->
    expect(() ->
      doc.insert {'http://example.com/persons/john': { 'http://example.com/ontology#name': { type: 'literal', value: 'John Smith' } } }
    ).toThrow(new Error("Objects must be an array of objects: [object Object] (of subject http://example.com/persons/john, predicate http://example.com/ontology#name)"))


describe 'RDFJsonDoc (non-empty)', () ->
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
    expect(doc.triples()).toEqual(testTriples1)

  it 'can add triple to existing subject and predicate', () ->
    doc.insert testTriples2
    expect(doc.triples()).toEqual( afterTriples2ShouldBe )

  it 'can add triple to existing subject', () ->
    doc.insert testTriples3
    expect(doc.triples()).toEqual( afterTriples3ShouldBe )

  it 'can add triple (new subject)', () ->
    doc.insert testTriples4
    expect(doc.triples()).toEqual( afterTriples4ShouldBe )

  it 'can delete two of three triples of the same subject and predicate', () ->
    doc.remove deletion1
    expect(doc.triples()).toEqual( afterDeletion1ShouldBe )

  it 'can delete the only triple of this subject', () ->
    doc.remove deletion2
    expect(doc.triples()).toEqual( afterDeletion2ShouldBe )
