require 'jasmine-expect'
require './matchers/triples'

hybridOT = require '../lib/types/hybrid'
rdfJsonOT = require '../lib/types/rdf-json'
textOT = (require '../node_modules/share/').types.text

HybridDoc = hybridOT.doc
HybridOp  = hybridOT.op

RdfJsonOp = rdfJsonOT.op


rdf = require 'node-rdf'

# === Utility functions: ===

parserTriplesArrayToRdfJson = (triples) ->
  createRdfJsonObject = (object) ->
    objectType = 'literal'
    objectType = 'uri' if object instanceof rdf.NamedNode
    objectType = 'bnode' if object instanceof rdf.BlankNode

    rdfJsonObject = { type: objectType, value: object.nominalValue }
    rdfJsonObject.lang = object.language if object.language
    rdfJsonObject.datatype = object.datatype if object.datatype
    rdfJsonObject

  rdfJson = {}
  for triple in triples
    rdfJson[triple.subject] = {} unless rdfJson[triple.subject]
    rdfJson[triple.subject][triple.predicate] = [] unless rdfJson[triple.subject][triple.predicate]
    rdfJson[triple.subject][triple.predicate].push createRdfJsonObject(triple.object)

  return rdfJson


parseTurtle = (turtle) ->
  parser = new rdf.TurtleParser
  parsedDoc = null

  try
    parsedDoc = parserTriplesArrayToRdfJson parser.graph.toArray()

    for triple in parser.graph.toArray()
      return [null, parser] if !triple.subject.nominalValue || !triple.predicate.nominalValue

  parsedDoc

# === End of utility functions ===


describe 'hybrid OT', ->

  it 'is named "turtle-rdf-json"', ->
    expect(hybridOT.name).toEqual('turtle-rdf-json')

  it 'can be attached to sharejs', ->
    sharejs = require 'share'
    rdfJsonIndex = require '..'

    rdfJsonIndex sharejs

    expect(sharejs.types['turtle-rdf-json']).toBeDefined()
    expect(sharejs.types['turtle-rdf-json']).toEqual hybridOT

  it 'exports document & operation prototype', ->
    expect(hybridOT.doc).toBeFunction();
    expect(hybridOT.op).toBeFunction();

  it 'has working create method', ->
    doc = hybridOT.create()

    expect(doc instanceof HybridDoc).toBeTruthy()
    expect(doc.getTurtleContent()).toEqual ''
    expect(doc.getRdfJsonContent()).toEqual {}

  describe 'apply method', ->

    it 'works with empty operation', ->
      snapshot = hybridOT.create()
      op = new HybridOp [], {}, {}

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual ''
      expect(newSnapshot.getRdfJsonContent()).toEqual {}

    it 'works with text operations', ->
      snapshot = new HybridDoc 'Hello World!', {}
      op = new HybridOp [ {p:6, d:'World'}, {p:6, i:'Test'} ], {}, {}

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual 'Hello Test!'
      expect(newSnapshot.getRdfJsonContent()).toEqual {}

    it 'works with rdf/json operations', ->
      snapshot = new HybridDoc '', {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getRdfJsonContent()).toEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
      }

    it 'works with text + rdf/json operations', ->
      snapshot = new HybridDoc 'Hello World!', {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [ {p:6, d:'World'}, {p:6, i:'Test'} ],
        {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }

      newSnapshot = hybridOT.apply snapshot, op

      expect(newSnapshot.getTurtleContent()).toEqual(
        "Hello Test!\n"+
        "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n"+
        "### delete triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
      )
      expect(newSnapshot.getRdfJsonContent()).toEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
      }


    it 'works with invalid turtle, rdf/json insertions then valid turtle', ->
      snapshot = new HybridDoc "http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n"+
                               "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .", {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      op = new HybridOp [], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {}
      op2 = new HybridOp [{p: 0, i: '<'}], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Richard Smith' } ]
        }, {}

      snapshot = hybridOT.apply snapshot, op

      expect(snapshot.getTurtleContent()).toEqual(
        "http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
        "### insert triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' } ]
      }

      snapshot = hybridOT.apply snapshot, op2

      expect(snapshot.getTurtleContent()).toEqual(
        "<http://example.com/persons/john> <http://example.com/ontology#age> \"36\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" .\n" +
        "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Richard Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' }, { type: 'literal', value: 'John Richard Smith' } ]
          'http://example.com/ontology#age':
            [ { type: 'literal', value: '36' } ]
      }


    it 'works with invalid turtle, rdf/json deletions then valid turtle', ->
      turtle = "\nhttp://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ;\n" +
               "                                  <http://example.com/ontology#name> \"John Richard Smith\" .\n" +
               "\n" +
               "<http://example.com/persons/andy>   <http://example.com/ontology#name>   \"Andy Smith\" ."

      snapshot = new HybridDoc turtle, {
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
        }
      op = new HybridOp [], {}, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }
      op2 = new HybridOp [{p: 1, i: '<'}], {}, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Richard Smith' } ]
        }

      snapshot = hybridOT.apply snapshot, op

      expect(snapshot.getTurtleContent()).toEqual(
        turtle + "\n" +
        "### delete triple ### <http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John Richard Smith' } ]
        'http://example.com/persons/andy':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'Andy Smith' } ]
      }

      snapshot = hybridOT.apply snapshot, op2

      expect(snapshot.getTurtleContent()).toEqual(
        "\n<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
        "\n" +
        "<http://example.com/persons/andy>   <http://example.com/ontology#name>   \"Andy Smith\" ."
      )
      expect(snapshot.getRdfJsonContent()).triplesToEqual {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' } ]
        'http://example.com/persons/andy':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'Andy Smith' } ]
      }

    describe 'handles concurring, conflicting turtle and rdf/json operations', () ->

      it '(turtle insertion & rdf/json deletion)', () ->

        turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
        rdfJson =
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        snapshot = new HybridDoc turtle, rdfJson

        op = new HybridOp [{p:0, i:"<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."}], {}, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }

        snapshot = hybridOT.apply snapshot, op

        expect(snapshot.getTurtleContent()).toEqual turtle
        expect(snapshot.getRdfJsonContent()).triplesToEqual rdfJson
        #turtleParsed = parseTurtle snapshot.getTurtleContent()
        #expect(turtleParsed).triplesToEqual snapshot.getRdfJsonContent()

      it '(turtle deletion & rdf/json insertion)', () ->

        turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\", \"John R. Smith\" ."
        rdfJson =
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' }, { type: 'literal', value: 'John R. Smith' } ]
        snapshot = new HybridDoc turtle, rdfJson

        op = new HybridOp [{p:81, d:", \"John R. Smith\""}], {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        }, {}

        snapshot = hybridOT.apply snapshot, op

        expect(snapshot.getTurtleContent()).toEqual(
          "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" .\n" +
          "<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."
        )
        expect(snapshot.getRdfJsonContent()).triplesToEqual rdfJson
        #turtleParsed = parseTurtle snapshot.getTurtleContent()
        #expect(turtleParsed).triplesToEqual snapshot.getRdfJsonContent()


  describe 'transform method', ->

    it 'transforms text operations correctly', ->

      textOps1 = [{ p:0, i:'John Smitch' }]
      op1 = new HybridOp textOps1, {}, {}

      textOps2 = [{ p:0, i:'John R. Smith' }, { p:45, d:'Some content' }]
      op2 = new HybridOp textOps2, {}, {}

      textOps1T = textOT.transform textOps1, textOps2, 'left'
      textOps2T = textOT.transform textOps2, textOps1, 'right'

      op1T = hybridOT.transform op1, op2, 'left'
      op2T = hybridOT.transform op2, op1, 'right'

      expect(op1T.getTextOps()).toEqual textOps1T
      expect(op2T.getTextOps()).toEqual textOps2T


    it 'transforms rdf/json operations correctly', ->

      rdfOp1 = new RdfJsonOp {
          'http://example.com/persons/john':
            'http://example.com/ontology#name': [
              { type: 'literal', value: 'John R. Smith' },
              { type: 'literal', value: 'John Richard Smith' }
            ]
        }, {}
      op1 = new HybridOp [], rdfOp1.getTriplesToAdd(), rdfOp1.getTriplesToDel()

      rdfOp2 = new RdfJsonOp {}, {
          'http://example.com/persons/john':
            'http://example.com/ontology#name': [
              { type: 'literal', value: 'John Richard Smith' }
            ]
        }
      op2 = new HybridOp [], rdfOp2.getTriplesToAdd(), rdfOp2.getTriplesToDel()

      rdfOp1T = rdfJsonOT.transform rdfOp1, rdfOp2, 'left'
      rdfOp2T = rdfJsonOT.transform rdfOp2, rdfOp1, 'right'

      op1T = hybridOT.transform op1, op2, 'left'
      op2T = hybridOT.transform op2, op1, 'right'

      expect(op1T.getRdfInsertions()).triplesToEqual rdfOp1T.getTriplesToAdd()
      expect(op1T.getRdfDeletions()).triplesToEqual rdfOp1T.getTriplesToDel()

      expect(op2T.getRdfInsertions()).triplesToEqual rdfOp2T.getTriplesToAdd()
      expect(op2T.getRdfDeletions()).triplesToEqual rdfOp2T.getTriplesToDel()


  describe 'compose method', ->

    it 'works for rdf & text insertions/deletions', ->

      turtle = "<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."
      rdfJson =
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' } ]
      snapshot = new HybridDoc turtle, rdfJson

      op1 = new HybridOp(
        [ {p:0, d:"<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."} ],
        { },
        {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John Smith' } ]
        }
      )
      op2 = new HybridOp(
        [ {p:0, i:"<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."} ],
        {
          'http://example.com/persons/john':
            'http://example.com/ontology#name':
              [ { type: 'literal', value: 'John R. Smith' } ]
        },
        { }
      )

      composedTextOpsShouldBe = [
          {p:0, d:"<http://example.com/persons/john> <http://example.com/ontology#name> \"John Smith\" ."},
          {p:0, i:"<http://example.com/persons/john> <http://example.com/ontology#name> \"John R. Smith\" ."}
        ]
      composedRdfInsShouldBe = {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John R. Smith' } ]
        }
      composedRdfDelShouldBe = {
        'http://example.com/persons/john':
          'http://example.com/ontology#name':
            [ { type: 'literal', value: 'John Smith' } ]
        }

      composedOp = hybridOT.compose op1, op2

      expect(composedOp.getTextOps()).toEqual composedTextOpsShouldBe
      expect(composedOp.getRdfInsertions()).triplesToEqual composedRdfInsShouldBe
      expect(composedOp.getRdfDeletions()).triplesToEqual composedRdfDelShouldBe


    # TODO: Test insertion/deletion of blank node triples (IS THIS POSSIBLE AT ALL??)
