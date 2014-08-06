
WEB = true if typeof window == 'object' && window.document


md5 = (str) ->
  return SparkMD5.hash str

hashTripleObject = (obj) ->
  hashObject = (obj, properties) ->
    str = ""
    for prop in properties
      str += "#{prop}:'#{obj[prop]}';" if typeof obj[prop] != "undefined"
    md5 str

  hashObject obj, ['type', 'value', 'lang', 'datatype']


isTriplesEmpty = (triples) ->
  return false for k, v of triples
  return true


cloneTriples = (triples) ->
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


cloneExportTriples = (triples) ->
  triplesClone = {}

  for subjUri, predicates of triples
    triplesClone[subjUri] = {}
    for predUri, objects of predicates
      triplesClone[subjUri][predUri] = []
      for object in objects
        objectClone = {}
        for objKey, objValue of object
          objectClone[objKey] = objValue
        triplesClone[subjUri][predUri].push objectClone

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

exportTriplesIntersect = (triples1, triples2) ->
  intersect = {}

  for subjUri1, predicates1 of triples1
    continue if !triples2[subjUri1]

    for predUri1, objects1 of predicates1
      continue if !triples2[subjUri1][predUri1]
      objects2 = triples2[subjUri1][predUri1]
      objects_intersect = []

      for object1 in objects1
        for object2 in objects2
          if (object1.type  == object2.type &&
              object1.value == object2.value &&
              object1.lang  == object2.lang &&
              object1.datatype == object2.datatype)
            objects_intersect.push object1

      if objects_intersect.length > 0
        intersect[subjUri1] = {} if !intersect[subjUri1]
        intersect[subjUri1][predUri1] = objects_intersect

  return intersect


exportTriplesUnion = (triples1, triples2) ->
  union = {}

  objectsArrayContains = (objects, newObject) ->
    properties = ['type', 'value', 'lang', 'datatype']
    for objects in objects
      objectsMatch = true
      for property in properties
        if object[property] != newObject[property]
          objectsMatch = false
          break

      return true if objectsMatch
    return false

  addToUnion = (s, p, o) ->
    union[s] = {} if !union[s]
    union[s][p] = [] if !union[s][p]
    union[s][p].push o if !objectsArrayContains(union[s][p], o)

  walkTriples = (triples, cb) ->
    for subjUri, predicates of triples
      for predUri, objects of predicates
        for object in objects
          cb(subjUri, predUri, object)

  walkTriples triples1, addToUnion
  walkTriples triples2, addToUnion

  return union


exportTriplesDifference = (triplesMinuend, triplesSubtrahend) ->
  triplesDiff = {}

  for subjUri, predicates of triplesMinuend
    for predUri, objects of predicates
      objectsDiff = []

      if triplesSubtrahend[subjUri] && triplesSubtrahend[subjUri][predUri]
        objects2 = triplesSubtrahend[subjUri][predUri]
        for object1 in objects
          for object2 in objects2
            if (object1.type  != object2.type ||
                object1.value != object2.value ||
                object1.lang  != object2.lang ||
                object1.datatype != object2.datatype)
              objectsDiff.push object1
      else
        objectsDiff = objects

      if objectsDiff.length > 0
        triplesDiff[subjUri] = {} if !triplesDiff[subjUri]
        triplesDiff[subjUri][predUri] = objectsDiff

  return triplesDiff


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
    doc.triples = cloneTriples(@triples)
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
    new RdfJsonOperation(cloneExportTriples(@getTriplesToAdd()), cloneExportTriples(@getTriplesToDel()))

  getTriplesToAdd: -> @triplesAdd
  setTriplesToAdd: (triples) -> @triplesAdd = triples
  hasTriplesToAdd: -> !@_triplesEmpty(@triplesAdd)

  getTriplesToDel: -> @triplesDel
  setTriplesToDel: (triples) -> @triplesDel = triples
  hasTriplesToDel: -> !@_triplesEmpty(@triplesDel)

  _triplesEmpty: (triples) ->
    return false for k, v of triples
    return true



rdfJson =
  Doc: RdfJsonDoc
  Operation: RdfJsonOperation
  exportTriples: exportTriples
  name: 'rdf-json'

  create: -> new RdfJsonDoc

  apply: (snapshot, op) ->
    snapshot = @_ensureDoc snapshot
    op = @_ensureOp op
    newSnapshot = snapshot.clone()

    newSnapshot.insert op.getTriplesToAdd() if op.hasTriplesToAdd()
    newSnapshot.delete op.getTriplesToDel() if op.hasTriplesToDel()

    return newSnapshot

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  transform: (op1, op2, side) ->

    transformTriples = (op1Triples, op2Triples) ->
      intersect = exportTriplesIntersect op1Triples, op2Triples
      exportTriplesDifference op1Triples, intersect

    op1t = op1.clone()
    op1First = side == 'right'

    if side != 'left' && side != 'right'
      throw new Error "Bad parameter 'side' given: #{side}"

    return op1t if op1First    # we are only modifying op1 if op2 is applied first

    # insertion + insertion or deletion + deletion is uncritical
    return op1t if isTriplesEmpty(op1.getTriplesToAdd()) && isTriplesEmpty(op2.getTriplesToAdd())
    return op1t if isTriplesEmpty(op1.getTriplesToDel()) && isTriplesEmpty(op2.getTriplesToDel())

    op1t.setTriplesToAdd exportTriplesDifference( op1.getTriplesToAdd(), op2.getTriplesToDel() )
    op1t.setTriplesToDel exportTriplesDifference( op1.getTriplesToDel(), op2.getTriplesToAdd() )

    return op1t

  # combine op1 and op2 to a single operation
  compose: (op1, op2) ->
    triplesToAddUnion = exportTriplesUnion op1.getTriplesToAdd(), op2.getTriplesToAdd()
    triplesToDelUnion = exportTriplesUnion op1.getTriplesToDel(), op2.getTriplesToDel()

    triplesToAdd = exportTriplesDifference triplesToAddUnion, triplesToDelUnion
    triplesToDel = exportTriplesDifference triplesToDelUnion, triplesToAddUnion

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
  sharejs.types ||= {}
  sharejs.types['rdf-json'] = rdfJson
else
  SparkMD5 = require 'spark-md5'
  module.exports = rdfJson
