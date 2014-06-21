
WEB = typeof window == 'object' && window.document


md5 = (str) ->
  return SparkMD5.hash str

hashTripleObject = (obj) ->
  hashObject = (obj, properties) ->
    str = ""
    for prop in properties
      str += "#{prop}:'#{obj[prop]}';" if typeof obj[prop] != "undefined"
    md5 str

  hashObject obj, ['type', 'value', 'lang', 'datatype']


objectPropertiesToArray = (object) ->
  array = []
  array.push value for key, value of object

  return array.sort (a, b) ->
    if typeof a.value == "string" || typeof b.value == "string"    # should always be the case
      aValue.localeCompare b.value
    else
      0


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
    @_uriRegex = /^\w+:\/\/\w+(\.\w+)+\//
    @_triples = {}
    @insert triples

  exportTriples: () ->
    _export = {}

    for subjectUri, predicates of @_triples
      _export[subjectUri] = {}
      for predicateUri, objects of predicates
        _export[subjectUri][predicateUri] = []
        for objectHash, object of objects
          _export[subjectUri][predicateUri].push object

    return _export

  clone: () ->
    doc = new RdfJsonDoc
    doc._triples = cloneTriples(@_triples)
    return doc

  insert: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      @_triples[subjectUri] = {} if !@_triples[subjectUri]
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        @_triples[subjectUri][predicateUri] = {} if !@_triples[subjectUri][predicateUri]
        for object in objects
          objectHash = hashTripleObject object
          @_triples[subjectUri][predicateUri][objectHash] = object

  remove: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      continue if !@_triples[subjectUri]

      predicateCount = 0
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        predicateCount++

        continue if !@_triples[subjectUri][predicateUri]
        presentObjects = @_triples[subjectUri][predicateUri]

        for objectToRemove in objects
          objectToRemoveHash = hashTripleObject objectToRemove
          if presentObjects[objectToRemoveHash]
            delete @_triples[subjectUri][predicateUri][objectToRemoveHash]

        objectCount = 0
        objectCount++ for presentObjectHash, presentObject of presentObjects

        if objectCount == 0
          predicateCount--
          delete @_triples[subjectUri][predicateUri]

      delete @_triples[subjectUri] if predicateCount == 0

  assertSubjectIsUri: (subject) ->
    throw new Error("Subject must be an URI: #{subject}") if typeof subject != 'string' || !@isUri(subject)

  assertPredicateIsUri: (predicate, subject) ->
    throw new Error("Predicate must be an URI: #{predicate} (of subject #{subject})") if typeof predicate != 'string' || !@isUri(predicate)

  assertObjectsArray: (objects, subject, predicate) ->
    if typeof objects != 'object' || !(objects instanceof Array)
      throw new Error("Objects must be an array of objects: #{objects} (of subject #{subject}, predicate #{predicate})")

  isUri: (str) ->
    str.match(@_uriRegex)


class RdfJsonOperation
  OP_INSERT: 'insert'
  OP_REMOVE: 'remove'

  @insert: (triplesToAdd) ->
    new RdfJsonOperation(RdfJsonOperation::OP_INSERT, triplesToAdd)

  @remove: (triplesToRemove) ->
    new RdfJsonOperation(RdfJsonOperation::OP_REMOVE, triplesToRemove)

  constructor: (operation, triples) ->
    @operation = () -> operation
    @triples = () -> triples

  clone: () ->
    new RdfJsonOperation(@operation(), cloneExportTriples(@triples()))


rdfJson =
  Doc: RdfJsonDoc
  Operation: RdfJsonOperation
  name: 'rdf-json'

  create: () -> new RdfJsonDoc

  apply: (snapshot, op) ->
    throw new Error("Snapshot must be a RdfJsonDoc instance. Given: #{snapshot}") unless snapshot instanceof RdfJsonDoc
    throw new Error("Operation must be a RdfJsonOperation instance. Given: #{op}") unless op instanceof RdfJsonOperation
    newSnapshot = snapshot.clone()

    switch op.operation()
      when RdfJsonOperation::OP_INSERT
        newSnapshot.insert op.triples()
      when RdfJsonOperation::OP_REMOVE
        newSnapshot.remove op.triples()

    return newSnapshot

  # return clone of op1, transformed by op2
  # side is "left" or "right"
  # "left": op2 to be applied first, "right": op1 first
  # implementation: deletion has precendence (good idea?)
  transform: (op1, op2, side) ->
    op1t = op1.clone()
    if side != 'left' && side != 'right'
      throw new Error "Bad parameter 'side' given: #{side}"

    return op1t


if(WEB)
  jsonld = window.jsonld
  sharejs = window.sharejs
  sharejs.types ||= {}
  # sharejs._bt(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
  sharejs.types.rdfJson = rdfJson
else
  jsonld = require 'jsonld'
  SparkMD5 = require 'spark-md5'
  module.exports = rdfJson
  # require('./helpers').bootstrapTransform(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
