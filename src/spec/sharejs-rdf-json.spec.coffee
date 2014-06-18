require('jasmine-expect')

jsonld = require('jsonld')
rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonDoc = rdfJson.Doc
RdfJsonOperation = rdfJson.Operation

describe 'sharejs-rdf-json', () ->

  it 'is named rdf-json', () ->
    expect(rdfJson.name).toEqual('rdf-json')


  describe 'create method', () ->
    doc = rdfJson.create()

    it 'returns RdfJsonDoc instance', () ->
      expect(doc).toBeObject()
      expect(doc instanceof RdfJsonDoc).toBeTruthy();

    it 'returns empty, but parsable set of triples', () ->
      done = false
      triples = doc.triples()

      runs () ->
        jsonld.flatten triples, (err, flattened) ->
          expect(flattened).toEqual({})
          done = true

      waitsFor () ->
        done


  describe 'apply method', () ->
    testTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John Smith' } ]
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]

    testInsertionTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John R. Smith' }, { type: 'literal', value: 'John Richard Smith' } ]

    testDeletionTriples =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'John Smith' } ]

    afterInsertionShouldBe =
      'http://example.com/persons/john':
        'http://example.com/ontology#name':
          [
            { type: 'literal', value: 'John Smith' }
            { type: 'literal', value: 'John R. Smith' }
            { type: 'literal', value: 'John Richard Smith' }
          ]
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]

    afterDeletionShouldBe =
      'http://example.com/persons/andy':
        'http://example.com/ontology#name':
          [ { type: 'literal', value: 'Andy Smith' } ]


    it 'does insertion', () ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.insert testInsertionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.triples()).toEqual afterInsertionShouldBe

    it 'does deletion', () ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.remove testDeletionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.triples()).toEqual afterDeletionShouldBe


    # check if snapshot(apply(op1); apply(transform(op2, op1, 'right')))
    #          ==
    #          snapshot(apply(op2); apply(transform(op1, op2, 'left')))
    describe 'transform method', () ->

      insertion1 =
        'http://example.com/persons/john':
          'http://example.com/ontology#name': [
            { type: 'literal', value: 'John R. Smith' },
            { type: 'literal', value: 'John Richard Smith' }
          ]

      removal1 =
        'http://example.com/persons/john':
          'http://example.com/ontology#name': [
            { type: 'literal', value: 'John Richard Smith' }
          ]

      testCases = [
        {
          label: 'transforms op1:insert, op2:remove'
          op1: RdfJsonOperation.insert insertion1
          op2: RdfJsonOperation.remove removal1
          doc:
            'http://example.com/persons/john':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'John Smith' } ]
            'http://example.com/persons/andy':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'Andy Smith' } ]

          should_be:
            'http://example.com/persons/john':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' } ]
            'http://example.com/persons/andy':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'Andy Smith' } ]

        }
      ]

      for testCase in testCases
        it testCase.label, () ->
          op1 = testCase.op1
          op2 = testCase.op2
          op1_transformed = rdfJson.transform(op1, op2, 'left')
          op2_transformed = rdfJson.transform(op2, op1, 'right')

          snapshot = new RdfJsonDoc(testCase.doc)

          snapshot_1 = rdfJson.apply(snapshot, op1)
          snapshot_1 = rdfJson.apply(snapshot_1, op2_transformed)

          snapshot_2 = rdfJson.apply(snapshot, op2)
          snapshot_2 = rdfJson.apply(snapshot_2, op1_transformed)

          expect(snapshot_1.triples()).toEqual testCase.should_be
          expect(snapshot_2.triples()).toEqual testCase.should_be
