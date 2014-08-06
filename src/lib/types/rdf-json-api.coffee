# RDF/JSON document API

rdfJson = require './rdf-json' if typeof WEB is 'undefined'

rdfJson.api =
  provides: { rdfJson: true }

  getData: -> rdfJson.exportTriples(@snapshot.triples)

  insert: (triples, callback) ->
    op = rdfJson.Operation.insert triples

    @submitOp op, callback
    op

  delete: (triples, callback) ->
    op = rdfJson.Operation.delete triples

    @submitOp op, callback
    op

  update: (triplesToIns, triplesToDel, callback) ->
    op = new rdfJson.Operation(triplesToIns, triplesToDel)

    @submitOp op, callback
    op

  _register: ->
    @on 'remoteop', (op) ->
      @emit 'update', op.triplesAdd, op.triplesDel
