require 'jasmine-expect'
require './matchers/triples'

jsonld = require 'jsonld'
rdfJson = require '../lib/types/sharejs-rdf-json'

RdfJsonDoc = rdfJson.Doc
RdfJsonOperation = rdfJson.Operation


describe 'sharejs-rdf-json', () ->

  it 'is named rdf-json', () ->
    expect(rdfJson.name).toEqual('rdf-json')

  it 'can be attached to sharejs', () ->
    sharejs = require 'share'
    rdfJsonIndex = require '..'

    rdfJsonIndex sharejs

    expect(sharejs.types['rdf-json']).toBeDefined();
    expect(sharejs.types['rdf-json']).toEqual(rdfJson);


  describe 'create method', () ->
    doc = rdfJson.create()

    it 'returns RdfJsonDoc instance', () ->
      expect(doc).toBeObject()
      expect(doc instanceof RdfJsonDoc).toBeTruthy();

    it 'returns empty, but parsable set of triples', () ->
      done = false
      triples = doc.exportTriples()

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
      expect(newSnapshot.exportTriples()).triplesToEqual afterInsertionShouldBe

    it 'does deletion', () ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.remove testDeletionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.exportTriples()).triplesToEqual afterDeletionShouldBe


  describe 'transform method', () ->

    describe 'basic testing:', () ->

      op1 = RdfJsonOperation.insert(
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Richard Smith' } ]
      )

      op2 = RdfJsonOperation.insert(
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
      )

      op1Clone = op1.clone()
      op2Clone = op2.clone()

      spyOn(op1, 'clone');
      spyOn(op2, 'clone');

      op1_transformed = rdfJson.transform(op1, op2, 'left')
      it 'clones op1', () ->
        expect(op1.clone).toHaveBeenCalled

      op2_transformed = rdfJson.transform(op2, op1, 'right')
      it 'clones op2', () ->
        expect(op2.clone).toHaveBeenCalled

      it 'does not modify the input operations', () ->
        expect(op1.getTriples()).triplesToEqual op1Clone.getTriples()
        expect(op2.getTriples()).triplesToEqual op2Clone.getTriples()

      it 'throws error on bad side parameter', () ->
        side = 'foobar'

        expect( () ->
          rdfJson.transform(op1, op2, side)
        ).toThrow new Error "Bad parameter 'side' given: #{side}"


    # check if snapshot(apply(op1); apply(transform(op2, op1, 'right')))
    #          ==
    #          snapshot(apply(op2); apply(transform(op1, op2, 'left')))
    describe 'functional testing:', () ->

      runTest = (op1, op2, doc, should_be) ->
        op1_transformed = rdfJson.transform(op1, op2, 'left')
        op2_transformed = rdfJson.transform(op2, op1, 'right')

        snapshot = new RdfJsonDoc doc

        snapshot1 = rdfJson.apply snapshot, op1
        snapshot1 = rdfJson.apply snapshot1, op2_transformed

        snapshot2 = rdfJson.apply snapshot, op2
        snapshot2 = rdfJson.apply snapshot2, op1_transformed

        expect(snapshot1.exportTriples()).triplesToEqual should_be
        expect(snapshot2.exportTriples()).triplesToEqual should_be


      testTriples =
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' } ]
        'http://example.com/persons/andy':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'Andy Smith' } ]


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


      insertionRemoval2 =
        'http://example.com/persons/john':
          'http://example.com/ontology#name': [
            { type: 'literal', value: 'John Smith' }
          ]


      insertionRemoval3 =
        'http://example.com/persons/john':
          'http://example.com/ontology#name': [
            { type: 'literal', value: 'John R. Smith' }
          ]


      testCases = [
        {
          label: 'transforms op1:<insert new>, op2:<remove one of new ones>'
          op1: RdfJsonOperation.insert insertion1
          op2: RdfJsonOperation.remove removal1
          doc: testTriples

          should_be:
            'http://example.com/persons/john':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' } ]
            'http://example.com/persons/andy':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'Andy Smith' } ]

        },
        {
          label: 'transforms op1:<insert already existing>, op2:<remove this triples>'
          op1: RdfJsonOperation.insert insertionRemoval2
          op2: RdfJsonOperation.remove insertionRemoval2
          doc: testTriples

          should_be:
            'http://example.com/persons/john':
              'http://example.com/ontology#name':
                []
            'http://example.com/persons/andy':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'Andy Smith' } ]

        },
        {
          label: 'transforms op1:<remove triple>, op2:<insert this triple again>'
          op1: RdfJsonOperation.remove insertionRemoval2
          op2: RdfJsonOperation.insert insertionRemoval2
          doc: testTriples

          should_be:
            'http://example.com/persons/john':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'John Smith' } ]
            'http://example.com/persons/andy':
              'http://example.com/ontology#name':
                [ { type: 'literal', value: 'Andy Smith' } ]

        },
        {
          label: 'transforms op1:<remove not-yet-existing>, op2:<insert this triple>'
          op1: RdfJsonOperation.remove insertionRemoval3
          op2: RdfJsonOperation.insert insertionRemoval3
          doc: testTriples

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
          runTest testCase.op1, testCase.op2, testCase.doc, testCase.should_be
