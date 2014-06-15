
WEB = typeof window == 'object' && window.document


cloneTriples = (triples) ->
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


# triples object format: RDF/JSON - https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html
class RdfJsonDoc
  constructor: (triples={}) ->
    @_uriRegex = /^\w+:\/\/\w+(\.\w+)+\//
    @_triples = triples

  triples: () -> @_triples

  clone: () ->
    return new RdfJsonDoc( cloneTriples(@triples()) )

  insert: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      @_triples[subjectUri] = {} if !@_triples[subjectUri]
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        @_triples[subjectUri][predicateUri] = [] if !@_triples[subjectUri][predicateUri]
        @_triples[subjectUri][predicateUri] = @_triples[subjectUri][predicateUri].concat(objects)

  remove: (triples) ->
    for subjectUri, predicates of triples
      @assertSubjectIsUri(subjectUri)
      continue if !@_triples[subjectUri]

      predicateCount = 0
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
        continue if !@_triples[subjectUri][predicateUri]

        predicateCount++
        for objectToRemove in objects
          presentObjects = @_triples[subjectUri][predicateUri]
          for presentObject, presentObjectIndex in presentObjects
            if presentObject.type == objectToRemove.type && presentObject.value == objectToRemove.value
              @_triples[subjectUri][predicateUri] = presentObjects.slice(0, presentObjectIndex).concat( presentObjects.slice(presentObjectIndex+1) )

        if @_triples[subjectUri][predicateUri].length == 0
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
    new RdfJsonOperation(@operation(), cloneTriples(@triples()))


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
  transform: (op1, op2, side) -> op1.clone()    # TODO


if(WEB)
  jsonld = window.jsonld
  sharejs = window.sharejs
  sharejs.types ||= {}
  # sharejs._bt(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
  sharejs.types.rdfJson = rdfJson
else
  jsonld = require 'jsonld'
  module.exports = rdfJson
  # require('./helpers').bootstrapTransform(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
