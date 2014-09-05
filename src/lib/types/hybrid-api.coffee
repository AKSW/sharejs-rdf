# Turtle + RDF/JSON hybrid document API

hybridOT = require './hybrid' if typeof WEB is 'undefined'

hybridOT.api =
  provides: { text: true, rdfJson: true }

  getText: -> @getTurtleData()
  getTurtleData: -> @snapshot.turtleContent
  getRdfJsonData: -> hybridOT.exportTriples @snapshot.rdfJsonDoc.triples


  # Text operations: (similar to text-api)

  insert: (pos, text, callback) ->
    op = new hybridOT.op [{p:pos, i:text}], {}, {}

    @submitOp op, callback
    op

  del: (pos, length, callback) ->
    op = new hybridOT.op [{p:pos, d:@snapshot.turtleContent[pos...(pos + length)]}], {}, {}

    @submitOp op, callback
    op


  # rdf/json operations:

  insertRdfJson: (rdfJson, callback) ->
    op = new hybridOT.op [], rdfJson, {}

    @submitOp op, callback
    op

  deleteRdfJson: (rdfJson, callback) ->
    op = new hybridOT.op [], {}, rdfJson

    @submitOp op, callback
    op

  updateRdfJson: (rdfJsonInsertions, rdfJsonDeletions, callback) ->
    op = new hybridOT.op [], rdfJsonInsertions, rdfJsonDeletions

    @submitOp op, callback
    op


  _register: ->
    @on 'remoteop', (op) ->
      @emit 'rdf-update', op.rdfInsertions, op.rdfDeletions
      @emit 'hybrid-update', op.textOps, op.rdfInsertions, op.rdfDeletions

      # glue to stay compatible with text-api:
      if op.textOps
        for component in op.textOps
          if component.i != undefined
            @emit 'insert', component.p, component.i
          else
            @emit 'delete', component.p, component.d
