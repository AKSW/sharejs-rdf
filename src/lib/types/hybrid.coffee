
rdf = null
util = null

rdfJsonOT = null
textOT = null


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

# === End of utility functions ===


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

    textDocAfterParsed = @_parseTurtle textDocAfter

    if textDocAfterParsed
      inserted1 = util.triplesDifference textDocAfterParsed, rdfDocBefore.exportTriples()
      inserted2 = util.triplesDifference textDocAfterParsed, rdfDocAfter.exportTriples()
      triplesInsertedInTurtle = util.triplesIntersect inserted1, inserted2

      deleted1 = util.triplesDifference rdfDocBefore.exportTriples(), textDocAfterParsed
      deleted2 = util.triplesDifference rdfDocAfter.exportTriples(), textDocAfterParsed
      triplesDeletedInTurtle = util.triplesIntersect deleted1, deleted2

      triplesToInsertInTurtle = util.triplesDifference op.getRdfInsertions(), triplesInsertedInTurtle
      triplesToDeleteInTurtle = util.triplesDifference op.getRdfDeletions(), triplesDeletedInTurtle

      [textDocAfter, tripleToInsertPrevCommented, tripleToDeletePrevCommented] = @_processTurtleCommentedTripleOps textDocAfter
      triplesInsertedInTurtle = util.triplesUnion tripleToInsertPrevCommented, triplesInsertedInTurtle
      triplesToInsertInTurtle = util.triplesUnion tripleToInsertPrevCommented, triplesToInsertInTurtle
      triplesDeletedInTurtle  = util.triplesUnion tripleToDeletePrevCommented, triplesDeletedInTurtle
      triplesToDeleteInTurtle = util.triplesUnion tripleToDeletePrevCommented, triplesToDeleteInTurtle

      triplesDeletedInTurtle = util.triplesDifference triplesDeletedInTurtle, tripleToInsertPrevCommented
      triplesToDeleteInTurtle = util.triplesDifference triplesToDeleteInTurtle, tripleToInsertPrevCommented

      textDocAfter = @_applyChangesToTurtle textDocAfter, textDocAfterParsed, triplesToInsertInTurtle, triplesToDeleteInTurtle
      rdfDocAfter = @_applyChangesToRdf rdfDocAfter, triplesInsertedInTurtle, triplesDeletedInTurtle
    else
      textDocAfter = @_applyChangesToTurtle(textDocAfter, null, op.getRdfInsertions(), op.getRdfDeletions())

    [textDocAfter, rdfDocAfter]

  _applyChangesToRdf: (rdfDoc, triplesToInsert, triplesToDelete) ->
    rdfDoc.insert triplesToInsert
    rdfDoc.delete triplesToDelete
    rdfDoc

  _applyChangesToTurtle: (turtleDoc, turtleDocParsed, triplesToInsert, triplesToDelete) ->
    if turtleDocParsed
      for triple in util.rdfJsonToArray triplesToInsert
        turtleDoc += "\n" + util.tripleToTurtle(triple.s, triple.p, triple.o)

      # TODO: Apply deletions
    else
      for triple in util.rdfJsonToArray(triplesToInsert)
        turtleDoc += "\n### insert triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)

      for triple in util.rdfJsonToArray(triplesToDelete)
        turtleDoc += "\n### delete triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)

    turtleDoc

  _processTurtleCommentedTripleOps: (turtleDoc) ->
    triplesToInsert = {}
    triplesToDelete = {}

    while matches = turtleDoc.match /\n### (insert|delete) triple ### ([^\n]+ \.)$/
      rdfJsonTriple = @_parseTurtle matches[2]
      switch matches[1]
        when 'insert' then triplesToInsert = util.triplesUnion triplesToInsert, rdfJsonTriple
        when 'delete' then triplesToDelete = util.triplesUnion triplesToDelete, rdfJsonTriple
      turtleDoc = turtleDoc.replace matches[0], ''

    [turtleDoc, triplesToInsert, triplesToDelete]

  _parseTurtle: (turtleContents) ->
    parser = new rdf.TurtleParser
    parsedDoc = null

    try
      if parser.parse turtleContents
        parsedDoc = parserTriplesArrayToRdfJson parser.graph.toArray()

        for triple in parser.graph.toArray()
          return null if !triple.subject.nominalValue || !triple.predicate.nominalValue

    parsedDoc

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
