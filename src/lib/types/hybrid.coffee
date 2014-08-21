
rdf = null
util = null

rdfJsonOT = null
textOT = null


class HybridDoc
  @fromData: (data) -> new HybridDoc data.turtleContent, rdfJsonOT.Doc.fromData(data.rdfJsonDoc)

  constructor: (turtleContent, rdfJsonContent) ->
    @setTurtleContent turtleContent
    if rdfJsonContent instanceof rdfJsonOT.Doc
      @rdfJsonDoc = rdfJsonContent
    else
      @setRdfJsonContent rdfJsonContent

  clone: -> new HybridDoc @getTurtleContent(), @getRdfJsonContent()

  getTurtleContent: -> @turtleContent
  setTurtleContent: (turtleContent) -> @turtleContent = turtleContent

  getRdfJsonDoc: -> @rdfJsonDoc
  getRdfJsonContent: -> @rdfJsonDoc.exportTriples()
  setRdfJsonContent: (rdfJsonContent) ->
    @rdfJsonDoc = new rdfJsonOT.Doc
    @rdfJsonDoc.insert rdfJsonContent
    @rdfJsonDoc


# Operation that may contain both text and structured data operations
class HybridOp
  @fromData: (data) -> new HybridOp data.textOps, data.rdfInsertions, data.rdfDeletions

  constructor: (textOps, rdfInsertions, rdfDeletions) ->
    @textOps = textOps
    @rdfInsertions = rdfInsertions
    @rdfDeletions = rdfDeletions

  clone: ->
    new HybridOp @textOps.slice(), @rdfInsertions.slice(), @rdfDeletions.slice()

  getTextOps: -> @textOps
  setTextOps: (textOps) -> @textOps = textOps

  getRdfInsertions: -> @rdfInsertions
  setRdfInsertions: (rdfInsertions) -> @rdfInsertions = rdfInsertions

  getRdfDeletions: -> @rdfDeletions
  setRdfDeletions: (rdfDeletions) -> @rdfDeletions = rdfDeletions


hybridOT =
  name: 'turtle-rdf-json'
  doc: HybridDoc
  op: HybridOp

  create: () -> new HybridDoc('', {})

  apply: (snapshot, op) ->
    [textDoc, rdfDoc] = @syncDocuments snapshot, op

    return new HybridDoc textDoc, rdfDoc

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  transform: (op1, op2, side) -> # TODO

  # combine op1 and op2 to a single operation
  compose: (op1, op2) -> # TODO

  # applies turtle and rdf/json changes to the snapshot and
  # translates turtle <-> rdf/json operations, so that the
  # documents stay synchronized
  syncDocuments: (snapshot, op) ->
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op

    textDocBefore = snapshot.getTurtleContent()
    rdfDocBefore = snapshot.getRdfJsonDoc()

    textDocAfter = textOT.apply snapshot.getTurtleContent(), op.getTextOps()
    rdfOp = new rdfJsonOT.Operation op.getRdfInsertions(), op.getRdfDeletions()
    rdfDocAfter = rdfJsonOT.apply snapshot.getRdfJsonDoc(), rdfOp

    # TODO

    [textDocAfter, rdfDocAfter]

  _ensureDoc: (doc) ->
    return doc if doc instanceof HybridDoc
    return HybridDoc.fromData doc if typeof doc == 'object' && doc.turtleContent && doc.rdfContent

    throw new Error("Snapshot must be a turtle + rdf-json hybrid document. Given: #{doc}")

  _ensureOp: (op) ->
    return op if op instanceof HybridOp
    return HybridOp.fromData op if typeof op == 'object' && op.textOps && op.rdfInsertions && op.rdfDeletions

    throw new Error("Operation must be a turtle + rdf-json hybrid operation. Given: #{op}")


if WEB?
  sharejs = window.sharejs
  rdfJsonOT = sharejs.types['rdf-json']
  textOT = sharejs.types['text']

  rdf = window.rdf
  util = sharejs.rdfUtil

  sharejs.types ||= {}
  sharejs.types['turtle-rdf-json'] = hybridOT
else
  textOT = require '../../node_modules/share/lib/types/text'
  rdfJsonOT = require './rdf-json'

  rdf = require 'node-rdf'
  util = require '../util'

  module.exports = hybridOT
