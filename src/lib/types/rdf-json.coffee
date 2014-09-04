
SparkMD5 = null
util = null


# === Utility functions: ===

md5 = (str) ->
  return SparkMD5.hash str

hashTripleObject = (obj) ->
  hashObject = (obj, properties) ->
    str = ""
    for prop in properties
      str += "#{prop}:'#{obj[prop]}';" if typeof obj[prop] != "undefined"
    md5 str

  hashObject obj, ['type', 'value', 'lang', 'datatype']


cloneInternalTriples = (triples) ->
  triplesClone = {}

  for subjUri, predicates of triples
    triplesClone[subjUri] = {}
    for predUri, objects of predicates
      triplesClone[subjUri][predUri] = {}
      for objectHash, object of objects
        objectClone = {}
        for objKey, objValue of object
          objectClone[objKey] = objValue
        triplesClone[subjUri][predUri][objectHash] = objectClone

  return triplesClone


exportTriples = (triples) ->
  _export = {}

  for subjectUri, predicates of triples
    _export[subjectUri] = {}
    for predicateUri, objects of predicates
      _export[subjectUri][predicateUri] = []
      objectHashes = []
      for objectHash, object of objects
        objectHashes.push objectHash

      objectHashes.sort()
      for objectHash in objectHashes
        object = objects[objectHash]
        _export[subjectUri][predicateUri].push object

  return _export

# === End of utility functions: ===



# triples export format: RDF/JSON - https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html
#
# internal format: (= but slightly changed export format)
# "<subject uri>":
#   "<predicate uri>":
#     "<hash>": { type: "<object type>", value: "<object value", ... }
#     ...
#   ...
# ...
class RdfJsonDoc
  constructor: (triples={}) ->
    @triples = {}
    @insert triples

  @fromData: (data) -> RdfJsonDoc.byInternalTripleSet(data.triples)

  @byInternalTripleSet: (triples) ->
    doc = new RdfJsonDoc
    doc.triples = triples
    return doc

  exportTriples: -> exportTriples(@triples)

  clone: ->
    doc = new RdfJsonDoc
    doc.triples = cloneInternalTriples(@triples)
    return doc

  insert: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      @triples[subjectUri] = {} if !@triples[subjectUri]
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        @triples[subjectUri][predicateUri] = {} if !@triples[subjectUri][predicateUri]
        for object in objects
          objectHash = hashTripleObject object
          @triples[subjectUri][predicateUri][objectHash] = object

  delete: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      continue if !@triples[subjectUri]

      predicateCount = 0
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        predicateCount++

        continue if !@triples[subjectUri][predicateUri]
        presentObjects = @triples[subjectUri][predicateUri]

        for objectToRemove in objects
          objectToRemoveHash = hashTripleObject objectToRemove
          if presentObjects[objectToRemoveHash]
            delete @triples[subjectUri][predicateUri][objectToRemoveHash]

        objectCount = 0
        objectCount++ for presentObjectHash, presentObject of presentObjects

        if objectCount == 0
          predicateCount--
          delete @triples[subjectUri][predicateUri]

      delete @triples[subjectUri] if predicateCount == 0

  assertSubjectIsUri: (subject) ->
    throw new Error("Subject must be an URI: #{subject}") if typeof subject != 'string' || !@isUri(subject)

  assertPredicateIsUri: (predicate, subject) ->
    throw new Error("Predicate must be an URI: #{predicate} (of subject #{subject})") if typeof predicate != 'string' || !@isUri(predicate)

  assertObjectsArray: (objects, subject, predicate) ->
    if typeof objects != 'object' || !(objects instanceof Array)
      throw new Error("Objects must be an array of objects: #{objects} (of subject #{subject}, predicate #{predicate})")

  isUri: (str) ->
    str.match(/^\w+:\/\/\w+(\.\w+)+\//)


class RdfJsonOperation
  @insert: (triplesToAdd) ->
    new RdfJsonOperation(triplesToAdd, {})

  @delete: (triplesToDelete) ->
    new RdfJsonOperation({}, triplesToDelete)

  @fromData: (data) -> new RdfJsonOperation(data.triplesAdd, data.triplesDel)

  # triples in export format
  constructor: (triplesToAdd, triplesToDelete) ->
    @triplesAdd = triplesToAdd
    @triplesDel = triplesToDelete

  clone: ->
    new RdfJsonOperation(util.cloneTriples(@getInsertions()), util.cloneTriples(@getDeletions()))

  getInsertions: -> @triplesAdd
  setInsertions: (triples) -> @triplesAdd = triples
  hasInsertions: -> !@_triplesEmpty(@triplesAdd)

  getDeletions: -> @triplesDel
  setDeletions: (triples) -> @triplesDel = triples
  hasDeletions: -> !@_triplesEmpty(@triplesDel)

  _triplesEmpty: (triples) ->
    return false for k, v of triples
    return true



rdfJson =
  name: 'rdf-json'
  doc: RdfJsonDoc
  op: RdfJsonOperation

  exportTriples: exportTriples

  create: -> new RdfJsonDoc

  apply: (snapshot, op) ->
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op
    newSnapshot = snapshot.clone()

    newSnapshot.insert op.getInsertions() if op.hasInsertions()
    newSnapshot.delete op.getDeletions() if op.hasDeletions()

    return newSnapshot

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  transform: (op1, op2, side) ->

    transformTriples = (op1Triples, op2Triples) ->
      intersect = util.triplesIntersect op1Triples, op2Triples
      util.triplesDifference op1Triples, intersect

    op1t = op1.clone()
    op1First = side == 'right'

    if side != 'left' && side != 'right'
      throw new Error "Bad parameter 'side' given: #{side}"

    return op1t if op1First    # we are only modifying op1 if op2 is applied first

    # insertion + insertion or deletion + deletion is uncritical
    return op1t if util.isTriplesEmpty(op1.getInsertions()) && util.isTriplesEmpty(op2.getInsertions())
    return op1t if util.isTriplesEmpty(op1.getDeletions()) && util.isTriplesEmpty(op2.getDeletions())

    op1t.setInsertions util.triplesDifference( op1.getInsertions(), op2.getDeletions() )
    op1t.setDeletions util.triplesDifference( op1.getDeletions(), op2.getInsertions() )

    return op1t

  # combine op1 and op2 to a single operation
  compose: (op1, op2) ->
    triplesToAddUnion = util.triplesUnion op1.getInsertions(), op2.getInsertions()
    triplesToDelUnion = util.triplesUnion op1.getDeletions(), op2.getDeletions()

    triplesToAdd = util.triplesDifference triplesToAddUnion, triplesToDelUnion
    triplesToDel = util.triplesDifference triplesToDelUnion, triplesToAddUnion

    new RdfJsonOperation(triplesToAdd, triplesToDel)

  _ensureDoc: (doc) ->
    return doc if doc instanceof RdfJsonDoc
    return RdfJsonDoc.fromData(doc) if typeof doc == 'object' && doc.triples

    throw new Error("Snapshot must be a rdf-json document. Given: #{doc}")

  _ensureOp: (op) ->
    return op if op instanceof RdfJsonOperation
    return RdfJsonOperation.fromData(op) if typeof op == 'object' && op.triplesAdd && op.triplesDel

    throw new Error("Operation must be a rdf-json operation. Given: #{op}")



if WEB?
  sharejs = window.sharejs
  util = sharejs.rdfUtil
  SparkMD5 = window.SparkMD5

  sharejs.types ||= {}
  sharejs.types['rdf-json'] = rdfJson
else
  SparkMD5 = require 'spark-md5'
  util = require '../util'
  module.exports = rdfJson
