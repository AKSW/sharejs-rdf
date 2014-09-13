
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


# @returns [pos, oldText, newText]
removeTripleFromTurtleBlock = (turtleContent, block, blockContentParsed, s, p, o) ->
  tripleRdfJson = {}
  tripleRdfJson[s] = {}
  tripleRdfJson[s][p] = [o]
  blockContentParsed = util.triplesDifference blockContentParsed, tripleRdfJson
  blockStringified = util.rdfJsonToTurtle blockContentParsed

  start = block.start
  length = block.length
  if turtleContent.substr(start + length, 2) == "\r\n"
    length += 2
  else
    length++ if turtleContent.charAt(start + length) == "\n"

  [start, turtleContent.substr(start, length), blockStringified]


# @returns [pos, oldText, newText]
removeTripleFromTurtle = (turtleContent, s, p, o) ->
  if s.substr(0, 2) != "_:"
    _s = "<" + s + ">"
  else
    _s = s
  blocks = mapTurtleToBlocks turtleContent
  potentialBlocks = arrayFilter blocks, (block) -> block.subject == _s

  successfulDeletion = false
  deletion = [0, '', '']
  for block in potentialBlocks
    blockContent = turtleContent.substr(block.start, block.length)
    blockParsed = hybridOT._parseTurtle blockContent

    if util.triplesContain blockParsed, s, p, o
      deletion = removeTripleFromTurtleBlock turtleContent, block, blockParsed, s, p, o
      successfulDeletion = true
      break

  if !successfulDeletion
    console.warn 'Unable to find the triple (s: <' + s + '>, p: <' + p + '>, o: ' + JSON.stringify(o) + ') for deletion in: ' + turtleContent

  return deletion


hybridOpToRdfJsonOp = (op) ->
  new rdfJsonOT.op op.getRdfInsertions(), op.getRdfDeletions()

# === End of utility functions ===


class HybridDoc
  @fromData: (data) -> new HybridDoc data.turtleContent, rdfJsonOT.doc.fromData(data.rdfJsonDoc)

  constructor: (turtleContent, rdfJsonContent) ->
    @setTurtleContent turtleContent
    if rdfJsonContent instanceof rdfJsonOT.doc
      @rdfJsonDoc = rdfJsonContent
    else
      @setRdfJsonContent rdfJsonContent

  clone: -> new HybridDoc @getTurtleContent(), @getRdfJsonContent()

  getTurtleContent: -> @turtleContent
  setTurtleContent: (turtleContent) -> @turtleContent = turtleContent

  getRdfJsonDoc: -> @rdfJsonDoc
  getRdfJsonContent: -> @rdfJsonDoc.exportTriples()
  setRdfJsonContent: (rdfJsonContent) ->
    @rdfJsonDoc = new rdfJsonOT.doc
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


# transforms turtle changes to rdf/json changes and vice versa
# applies these to the given snapshot
class RdfJsonTurtleSync
  constructor: (snapshot, op) ->
    @snapshot = snapshot
    @op = op
    @textDoc = snapshot.getTurtleContent()
    @textDocParsed = null
    @rdfDoc = snapshot.getRdfJsonDoc()
    @originalRdfDoc = @rdfDoc

  apply: ->
    @textDoc = textOT.apply @textDoc, @op.getTextOps()

    rdfOp = new rdfJsonOT.op @op.getRdfInsertions(), @op.getRdfDeletions()
    @rdfDoc = rdfJsonOT.apply @rdfDoc, rdfOp

    @textDocParsed = @_parseTurtleAndCommentedTripleOps()

    if @textDocParsed
      @_applyTurtleChanges()
    else
      @_applyChangesToTurtle @op.getRdfInsertions(), @op.getRdfDeletions()

    @getSyncedDocs()

  getSyncedDocs: -> [@textDoc, @rdfDoc]

  _emit: (args...) ->
    hybridOT.registeredDocsEmit.apply hybridOT, args

  _appendToTextDoc: (text) ->
    return @textDoc if !text

    @_emit 'sync-text-insert', { p: @textDoc.length, i:text }
    @textDoc += text

  _replaceInTextDoc: (pos, oldContent, newContent) ->
    return @textDoc if newContent == oldContent

    textAtPos = @textDoc.substr(pos, oldContent.length)
    if textAtPos != oldContent
      throw new Error("Turtle deletion: Text has changed @#{pos}.\nExpected: #{oldContent}\nGot: #{textAtPos}")

    @_emit 'sync-text-replace', { p: pos, d: oldContent, i:newContent }
    @textDoc = @textDoc.substr(0, pos) + newContent + @textDoc.substr(pos + oldContent.length)

  _changeRdfDoc: (triplesToInsert, triplesToDelete) ->
    return @rdfDoc if util.isTriplesEmpty(triplesToInsert) && util.isTriplesEmpty(triplesToDelete)

    @_emit 'sync-rdf', { i:triplesToInsert, d:triplesToDelete }
    rdfOp = new rdfJsonOT.op triplesToInsert, triplesToDelete
    @rdfDoc = rdfJsonOT.apply @rdfDoc, rdfOp

  _applyTurtleChanges: ->
    op = @op

    inserted1 = util.triplesDifference @textDocParsed, @originalRdfDoc.exportTriples()
    inserted2 = util.triplesDifference @textDocParsed, @rdfDoc.exportTriples()
    triplesInsertedInTurtle = util.triplesIntersect inserted1, inserted2

    deleted1 = util.triplesDifference @originalRdfDoc.exportTriples(), @textDocParsed
    deleted2 = util.triplesDifference @rdfDoc.exportTriples(), @textDocParsed
    triplesDeletedInTurtle = util.triplesIntersect deleted1, deleted2

    [triplesInsertedInTurtle, triplesDeletedInTurtle, revertTurtleInsertions, revertTurtleDeletions] =
      @_eliminateOppositions triplesInsertedInTurtle, triplesDeletedInTurtle

    # Problem: No matter what we eliminate, the op's turtle changes have already been made
    # Solution: Let's undo these changes

    triplesToInsertInTurtle = util.triplesDifference op.getRdfInsertions(), triplesInsertedInTurtle
    triplesToInsertInTurtle = util.triplesUnion triplesToInsertInTurtle, revertTurtleDeletions
    triplesToDeleteInTurtle = util.triplesDifference op.getRdfDeletions(), triplesDeletedInTurtle
    triplesToDeleteInTurtle = util.triplesUnion triplesToDeleteInTurtle, revertTurtleInsertions

    @_applyChangesToTurtle triplesToInsertInTurtle, triplesToDeleteInTurtle
    @_changeRdfDoc triplesInsertedInTurtle, triplesDeletedInTurtle

  _applyChangesToRdf: (rdfDoc, triplesToInsert, triplesToDelete) ->
    rdfOp = new rdfJsonOT.op triplesToInsert, triplesToDelete
    rdfDoc = rdfJsonOT.apply rdfDoc, rdfOp

    rdfDoc

  _applyChangesToTurtle: (triplesToInsert, triplesToDelete) ->
    if @textDocParsed
      textToAppend = ""
      for triple in util.rdfJsonToArray triplesToInsert
        textToAppend += "\n" + util.tripleToTurtle(triple.s, triple.p, triple.o)
      @_appendToTextDoc textToAppend

      for triple in util.rdfJsonToArray triplesToDelete
        [pos, oldContent, newContent] = removeTripleFromTurtle @textDoc, triple.s, triple.p, triple.o
        @_replaceInTextDoc pos, oldContent, newContent
    else
      textToAppend = ""
      for triple in util.rdfJsonToArray(triplesToInsert)
        textToAppend += "\n### insert triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)

      for triple in util.rdfJsonToArray(triplesToDelete)
        textToAppend += "\n### delete triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o)
      @_appendToTextDoc textToAppend

  _eliminateOppositions: (turtleInsertions, turtleDeletions) ->
    revertTurtleInsertions = {}
    revertTurtleDeletions = {}

    intersection = util.triplesIntersect @op.getRdfInsertions(), turtleDeletions
    if !util.isTriplesEmpty(intersection)
      @op.setRdfInsertions util.triplesDifference(@op.getRdfInsertions(), intersection)
      turtleDeletions = util.triplesDifference turtleDeletions, intersection
      revertTurtleDeletions = intersection

    intersection = util.triplesIntersect @op.getRdfDeletions(), turtleInsertions
    if !util.isTriplesEmpty(intersection)
      @op.setRdfDeletions util.triplesDifference(@op.getRdfDeletions(), intersection)
      turtleInsertions = util.triplesDifference turtleInsertions, intersection
      revertTurtleInsertions = intersection

    [turtleInsertions, turtleDeletions, revertTurtleInsertions, revertTurtleDeletions]

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

  _parseTurtleAndCommentedTripleOps: ->
    [@textDoc, triplesToInsert, triplesToDelete] = @_processTurtleCommentedTripleOps @textDoc

    if !util.isTriplesEmpty(triplesToInsert) || !util.isTriplesEmpty(triplesToDelete)
      @textDocParsed = @_parseTurtle @textDoc
      if @textDocParsed
        @_applyChangesToTurtle triplesToInsert, triplesToDelete

    return @_parseTurtle @textDoc

  _parseTurtle: (turtleContents) -> hybridOT._parseTurtle turtleContents


hybridOT =
  name: 'turtle-rdf-json'
  doc: HybridDoc
  op: HybridOp

  registeredDocs: []

  exportTriples: null # initialized at the end of this file

  # register a document to be notified about changes made by RdfJsonTurtleSync
  registerDoc: (doc) ->
    @registeredDocs.push doc

  registeredDocsEmit: (args...) ->
    doc.emit.apply doc, args for doc in @registeredDocs

  create: -> new HybridDoc('', {})

  apply: (snapshot, op) ->
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op

    sync = new RdfJsonTurtleSync snapshot, op
    [textDoc, rdfDoc] = sync.apply()

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

    # a more sophisticated transform method that considers interactions between
    # turtle and rdf/json operation is not possible since the effect of
    # text operations depends on the rest of the turtle document
    # (would need the current snapshot)

    new HybridOp op1tTextOps, op1tRdfOp.getInsertions(), op1tRdfOp.getDeletions()

  # combine op1 and op2 to a single operation
  compose: (op1, op2) ->
    op1 = @_ensureOp op1
    op2 = @_ensureOp op2

    rdfOp1 = hybridOpToRdfJsonOp op1
    rdfOp2 = hybridOpToRdfJsonOp op2

    textOps = textOT.compose op1.getTextOps(), op2.getTextOps()
    rdfOp = rdfJsonOT.compose rdfOp1, rdfOp2

    new HybridOp textOps, rdfOp.getInsertions(), rdfOp.getDeletions()


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
    return HybridDoc.fromData doc if typeof doc == 'object' && doc.rdfJsonDoc

    throw new Error("Snapshot must be a turtle + rdf-json hybrid document. Given: #{JSON.stringify(doc)}")

  _ensureOp: (op) ->
    return op if op instanceof HybridOp
    return HybridOp.fromData op if typeof op == 'object' && op.textOps && op.rdfInsertions && op.rdfDeletions

    throw new Error("Operation must be a turtle + rdf-json hybrid operation. Given: #{JSON.stringify(op)}")


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


hybridOT.exportTriples = rdfJsonOT.exportTriples
