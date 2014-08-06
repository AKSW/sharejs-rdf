require 'jasmine-expect'
require './matchers/triples'

rdfJson = require '../lib/types/rdf-json'

RdfJsonDoc = rdfJson.Doc
RdfJsonOperation = rdfJson.Operation


describe 'sharejs-rdf-json', ->

  it 'is named "rdf-json"', ->
    expect(rdfJson.name).toEqual('rdf-json')

  it 'can be attached to sharejs', ->
    sharejs = require 'share'
    rdfJsonIndex = require '..'

    rdfJsonIndex sharejs

    expect(sharejs.types['rdf-json']).toBeDefined();
    expect(sharejs.types['rdf-json']).toEqual(rdfJson);


  describe 'create method', ->
    doc = rdfJson.create()

    it 'returns RdfJsonDoc instance', ->
      expect(doc).toBeObject()
      expect(doc instanceof RdfJsonDoc).toBeTruthy();

    it 'returns empty, but parsable set of triples', ->
      triples = doc.exportTriples()
      expect(triples).toEqual {}


  describe 'apply method', ->
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


    it 'does insertion', ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.insert testInsertionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.exportTriples()).triplesToEqual afterInsertionShouldBe

    it 'does deletion', ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.delete testDeletionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.exportTriples()).triplesToEqual afterDeletionShouldBe

    it 'works with serialised snapshot', ->
      snapshot = new RdfJsonDoc(testTriples)
      snapshot = JSON.parse JSON.stringify snapshot
      op = RdfJsonOperation.insert testInsertionTriples

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.exportTriples()).triplesToEqual afterInsertionShouldBe

    it 'works with serialised operation', ->
      snapshot = new RdfJsonDoc(testTriples)
      op = RdfJsonOperation.insert testInsertionTriples
      op = JSON.parse JSON.stringify op

      newSnapshot = rdfJson.apply(snapshot, op)
      expect(newSnapshot.exportTriples()).triplesToEqual afterInsertionShouldBe


  describe 'compose method', ->

    it 'works', ->

      op1 = new RdfJsonOperation({
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Richard Smith' } ]
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '36' } ]
      },{
        'http://example.com/persons/andy':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'Andy Smith' } ]
      })

      op2 = new RdfJsonOperation({
        'http://example.com/persons/andy':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'Andy Smith' } ]
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '25' } ]
      },{
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Richard Smith' } ]
          'http://example.com/ontology#noChildren':
            [ { type: 'literal', value: '2' } ]
      })

      opc = rdfJson.compose op1, op2

      expect( opc.getTriplesToAdd() ).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '36' } ]
        'http://example.com/persons/andy':
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '25' } ]
      }

      expect( opc.getTriplesToDel() ).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#noChildren':
            [ { type: 'literal', value: '2' } ]
      }


  describe 'transform method', ->

    describe 'basic testing:', ->

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

      spyOn(op1, 'clone').andCallThrough()
      spyOn(op2, 'clone').andCallThrough()

      op1_transformed = rdfJson.transform(op1, op2, 'left')
      it 'clones op1', ->
        expect(op1.clone).toHaveBeenCalled

      op2_transformed = rdfJson.transform(op2, op1, 'right')
      it 'clones op2', ->
        expect(op2.clone).toHaveBeenCalled

      it 'does not modify the input operations', ->
        expect(op1.getTriplesToAdd()).triplesToEqual op1Clone.getTriplesToAdd()
        expect(op1.getTriplesToDel()).triplesToEqual op1Clone.getTriplesToDel()
        expect(op2.getTriplesToAdd()).triplesToEqual op2Clone.getTriplesToAdd()
        expect(op2.getTriplesToDel()).triplesToEqual op2Clone.getTriplesToDel()

      it 'throws error on bad side parameter', ->
        side = 'foobar'

        expect( () ->
          rdfJson.transform(op1, op2, side)
        ).toThrow new Error "Bad parameter 'side' given: #{side}"


    # check if snapshot(apply(op1); apply(transform(op2, op1, 'right')))
    #          ==
    #          snapshot(apply(op2); apply(transform(op1, op2, 'left')))
    describe 'functional testing:', ->

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
          label: 'transforms op1:<insert new>, op2:<delete one of new ones>'
          op1: RdfJsonOperation.insert insertion1
          op2: RdfJsonOperation.delete removal1
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
          label: 'transforms op1:<insert already existing>, op2:<delete this triples>'
          op1: RdfJsonOperation.insert insertionRemoval2
          op2: RdfJsonOperation.delete insertionRemoval2
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
          label: 'transforms op1:<delete triple>, op2:<insert this triple again>'
          op1: RdfJsonOperation.delete insertionRemoval2
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
          label: 'transforms op1:<delete not-yet-existing>, op2:<insert this triple>'
          op1: RdfJsonOperation.delete insertionRemoval3
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
        it testCase.label, ->
          runTest testCase.op1, testCase.op2, testCase.doc, testCase.should_be