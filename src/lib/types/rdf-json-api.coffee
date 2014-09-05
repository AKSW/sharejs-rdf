# RDF/JSON document API

rdfJson = require './rdf-json' if typeof WEB is 'undefined'

rdfJson.api =
  provides: { rdfJson: true }

  getData: -> rdfJson.exportTriples @snapshot.triples

  insertRdfJson: (triples, callback) ->
    op = rdfJson.op.insert triples

    @submitOp op, callback
    op

  deleteRdfJson: (triples, callback) ->
    op = rdfJson.op.delete triples

    @submitOp op, callback
    op

  updateRdfJson: (triplesToIns, triplesToDel, callback) ->
    op = new rdfJson.op(triplesToIns, triplesToDel)

    @submitOp op, callback
    op

  _register: ->
    @on 'remoteop', (op) ->
      @emit 'update', op.triplesAdd, op.triplesDel
