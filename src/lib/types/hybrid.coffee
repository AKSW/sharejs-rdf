
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


mapTurtleToBlocks = (turtleContent) ->
  blocks = []

  parser = new rdf.TurtleParser
  try
    blocks = parser.blocks if parser.parse turtleContent

  blocks


arrayFilter = (array, callback) ->
  resultArray = []
  for item in array
    resultArray.push item if callback(item)
  resultArray


removeTripleFromTurtleBlock = (turtleContent, block, blockContentParsed, s, p, o) ->
  tripleRdfJson = {}
  tripleRdfJson[s] = {}
  tripleRdfJson[s][p] = [o]
  blockContentParsed = util.triplesDifference blockContentParsed, tripleRdfJson
  blockStringified = util.rdfJsonToTurtle blockContentParsed

  start = block.start
  end = block.start + block.length - 1
  if turtleContent.substr(end + 1, 2) == "\r\n"
    end += 2
  else
    end++ if turtleContent.charAt(end + 1) == "\n"

  turtleContent = turtleContent.substr(0, start) + blockStringified + turtleContent.substr(end + 1)


removeTripleFromTurtle = (turtleContent, s, p, o) ->
  if s.substr(0, 2) != "_:"
    _s = "<" + s + ">"
  else
    _s = s
  blocks = mapTurtleToBlocks turtleContent
  potentialBlocks = arrayFilter blocks, (block) -> block.subject == _s

  successfulDeletion = false
  for block in potentialBlocks
    blockContent = turtleContent.substr(block.start, block.length)
    blockParsed = hybridOT._parseTurtle blockContent

    if util.triplesContain blockParsed, s, p, o
      turtleContent = removeTripleFromTurtleBlock turtleContent, block, blockParsed, s, p, o
      successfulDeletion = true
      break

  if !successfulDeletion
    console.warn 'Unable to find the triple (s: <' + s + '>, p: <' + p + '>, o: ' + JSON.stringify(o) + ') for deletion in: ' + turtleContent

  return turtleContent


hybridOpToRdfJsonOp = (op) ->
  new rdfJsonOT.Operation op.getRdfInsertions(), op.getRdfDeletions()

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
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op

    [textDoc, rdfDoc] = @syncDocuments snapshot, op

    return new HybridDoc textDoc, rdfDoc

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  transform: (op1, op2, side) ->
    op1 = @_ensureOp op1
    op2 = @_ensureOp op2

    op1First = side == 'right'

    if side != 'left' && side != 'right'
      throw new Error "Bad parameter 'side' given: #{side}"

    op1tTextOps = textOT.transform op1.getTextOps(), op2.getTextOps(), side
    op1tRdfOp = rdfJsonOT.transform hybridOpToRdfJsonOp(op1), hybridOpToRdfJsonOp(op2), side

    new HybridOp op1tTextOps, op1tRdfOp.getTriplesToAdd(), op1tRdfOp.getTriplesToDel()

  # combine op1 and op2 to a single operation
  compose: (op1, op2) ->
    op1 = @_ensureOp op1
    op2 = @_ensureOp op2

    rdfOp1 = hybridOpToRdfJsonOp op1
    rdfOp2 = hybridOpToRdfJsonOp op2

    textOps = textOT.compose op1.getTextOps(), op2.getTextOps()
    rdfOp = rdfJsonOT.compose rdfOp1, rdfOp2

    new HybridOp textOps, rdfOp.getTriplesToAdd(), rdfOp.getTriplesToDel()

  # applies turtle and rdf/json changes to the snapshot and
  # translates turtle <-> rdf/json operations, so that the
  # documents stay synchronized
  syncDocuments: (snapshot, op) ->
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op

    rdfDocBefore = snapshot.getRdfJsonDoc()

    textDocAfter = textOT.apply snapshot.getTurtleContent(), op.getTextOps()
    rdfOp = new rdfJsonOT.Operation op.getRdfInsertions(), op.getRdfDeletions()
    rdfDocAfter = rdfJsonOT.apply snapshot.getRdfJsonDoc(), rdfOp

    [textDocAfter, textDocAfterParsed] = @_parseTurtleAndCommentedTripleOps textDocAfter

    if textDocAfterParsed
      [textDocAfter, rdfDocAfter] = @_applyTurtleChanges op, rdfDocBefore, rdfDocAfter, textDocAfter, textDocAfterParsed
    else
      textDocAfter = @_applyChangesToTurtle(textDocAfter, null, op.getRdfInsertions(), op.getRdfDeletions())

    [textDocAfter, rdfDocAfter]

  _applyTurtleChanges: (op, rdfDocBefore, rdfDocAfter, textDocAfter, textDocAfterParsed) ->
    inserted1 = util.triplesDifference textDocAfterParsed, rdfDocBefore.exportTriples()
    inserted2 = util.triplesDifference textDocAfterParsed, rdfDocAfter.exportTriples()
    triplesInsertedInTurtle = util.triplesIntersect inserted1, inserted2

    deleted1 = util.triplesDifference rdfDocBefore.exportTriples(), textDocAfterParsed
    deleted2 = util.triplesDifference rdfDocAfter.exportTriples(), textDocAfterParsed
    triplesDeletedInTurtle = util.triplesIntersect deleted1, deleted2

    [op, triplesInsertedInTurtle, triplesDeletedInTurtle, revertTurtleInsertions, revertTurtleDeletions] =
      @_eliminateOppositions op, triplesInsertedInTurtle, triplesDeletedInTurtle

    # Problem: No matter what we eliminate, the op's turtle changes have already been made
    # Solution: Let's undo these changes

    triplesToInsertInTurtle = util.triplesDifference op.getRdfInsertions(), triplesInsertedInTurtle
    triplesToInsertInTurtle = util.triplesUnion triplesToInsertInTurtle, revertTurtleDeletions
    triplesToDeleteInTurtle = util.triplesDifference op.getRdfDeletions(), triplesDeletedInTurtle
    triplesToDeleteInTurtle = util.triplesUnion triplesToDeleteInTurtle, revertTurtleInsertions

    textDocAfter = @_applyChangesToTurtle textDocAfter, textDocAfterParsed, triplesToInsertInTurtle, triplesToDeleteInTurtle
    rdfDocAfter = @_applyChangesToRdf rdfDocAfter, triplesInsertedInTurtle, triplesDeletedInTurtle

    [textDocAfter, rdfDocAfter]

  _applyChangesToRdf: (rdfDoc, triplesToInsert, triplesToDelete) ->
    rdfOp = new rdfJsonOT.Operation triplesToInsert, triplesToDelete
    rdfDoc = rdfJsonOT.apply rdfDoc, rdfOp
    rdfDoc

  _applyChangesToTurtle: (turtleDoc, turtleDocParsed, triplesToInsert, triplesToDelete) ->
    if turtleDocParsed
      for triple in util.rdfJsonToArray triplesToInsert
        turtleDoc += "\n" + util.tripleToTurtle(triple.s, triple.p, triple.o)

      for triple in util.rdfJsonToArray triplesToDelete
        turtleDoc = removeTripleFromTurtle turtleDoc, triple.s, triple.p, triple.o
    else
      for triple in util.rdfJsonToArray(triplesToInsert)
        turtleDoc += "\n### insert triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)

      for triple in util.rdfJsonToArray(triplesToDelete)
        turtleDoc += "\n### delete triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)

    turtleDoc

  _eliminateOppositions: (op, turtleInsertions, turtleDeletions) ->
    revertTurtleInsertions = {}
    revertTurtleDeletions = {}

    intersection = util.triplesIntersect op.getRdfInsertions(), turtleDeletions
    if !util.isTriplesEmpty(intersection)
      op.setRdfInsertions util.triplesDifference(op.getRdfInsertions(), intersection)
      turtleDeletions = util.triplesDifference turtleDeletions, intersection
      revertTurtleDeletions = intersection

    intersection = util.triplesIntersect op.getRdfDeletions(), turtleInsertions
    if !util.isTriplesEmpty(intersection)
      op.setRdfDeletions util.triplesDifference(op.getRdfDeletions(), intersection)
      turtleInsertions = util.triplesDifference turtleInsertions, intersection
      revertTurtleInsertions = intersection

    [op, turtleInsertions, turtleDeletions, revertTurtleInsertions, revertTurtleDeletions]

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

  _parseTurtleAndCommentedTripleOps: (turtleDoc) ->
    _turtleDoc = turtleDoc
    [turtleDoc, triplesToInsert, triplesToDelete] = @_processTurtleCommentedTripleOps turtleDoc

    if !util.isTriplesEmpty(triplesToInsert) || !util.isTriplesEmpty(triplesToDelete)
      turtleDocParsed = @_parseTurtle turtleDoc
      if turtleDocParsed
        turtleDoc = @_applyChangesToTurtle turtleDoc, turtleDocParsed, triplesToInsert, triplesToDelete

    return [turtleDoc, @_parseTurtle turtleDoc]

  _parseTurtle: (turtleContents) ->
    parser = new rdf.TurtleParser
    parsedDoc = null

    try
      if parser.parse turtleContents
        parsedDoc = parserTriplesArrayToRdfJson parser.graph.toArray()

        for triple in parser.graph.toArray()
          return [null, parser] if !triple.subject.nominalValue || !triple.predicate.nominalValue

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
