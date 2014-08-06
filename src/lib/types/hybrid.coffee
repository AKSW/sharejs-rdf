
WEB = true if typeof window == 'object' && window.document

rdfJsonOT = null
textOT = null


class HybridDoc
  constructor: (turtleContent, rdfJsonContent) ->
    @turtleContent = turtleContent
    @rdfJsonContent = rdfJsonContent

  clone: -> new HybridDoc(@turtleContent, @rdfJsonContent)

  getTurtleContent: -> @turtleContent
  setTurtleContent: (turtleContent) -> @turtleContent = turtleContent

  getRdfJsonContent: -> @rdfJsonContent
  setRdfJsonContent: (rdfJsonContent) -> @rdfJsonContent = rdfJsonContent


# Operation that may contain both text and structured data operations
class HybridOp
  @fromData: (data) -> new HybridOp(data.textOps, data.rdfInsertions, data.rdfDeletions)

  constructor: (textOps, rdfInsertions, rdfDeletions) ->
    @textOps = textOps
    @rdfInsertions = rdfInsertions
    @rdfDeletions = rdfDeletions

  clone: ->
    new HybridOp(@textOps.slice(), @rdfInsertions.slice(), @rdfDeletions.slice())

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

  apply: (snapshot, op) -> # TODO

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  transform: (op1, op2, side) -> # TODO

  # combine op1 and op2 to a single operation
  compose: (op1, op2) -> # TODO


if WEB?
  sharejs = window.sharejs
  rdfJsonOT = sharejs.types['rdf-json']
  textOT = sharejs.types['text']

  sharejs.types ||= {}
  sharejs.types['turtle-rdf-json'] = hybridOT
else
  textOT = require '../../node_modules/share/lib/types/text'
  rdfJsonOT = require './rdf-json'

  module.exports = hybridOT
