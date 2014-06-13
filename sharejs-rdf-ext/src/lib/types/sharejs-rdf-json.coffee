
WEB = typeof window == 'object' && window.document


# triples object format: RDF/JSON - https://dvcs.w3.org/hg/rdf/raw-file/default/rdf-json/index.html
class RdfJsonDoc
  constructor: (triples={}) ->
    @_uriRegex = /^\w+:\/\/\w+(\.\w+)+\//
    @_triples = triples

  triples: () -> @_triples

  clone: () ->
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
      predicateCount = 0
      for predicateUri, objects of predicates
        @assertPredicateIsUri(predicateUri, subjectUri)
        @assertObjectsArray(objects, subjectUri, predicateUri)
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
    op = new RdfJsonOperation(RdfJsonOperation::OP_INSERT, triplesToAdd)

  @remove: (triplesToRemove) ->
    op = new RdfJsonOperation(RdfJsonOperation::OP_REMOVE, triplesToRemove)

  constructor: (operation, triples) ->
    @operation = () -> operation
    @triples = () -> triples


rdfJson =
  Doc: RdfJsonDoc
  Operation: RdfJsonOperation
  name: 'rdf-json'

  create: () -> new RdfJsonDoc

  apply: (snapshot, op) -> null          # TODO
  ###
    switch op.operation()
      when RdfJsonOperation::OP_INSERT
        newSnapshot = null  # TODO
      when RdfJsonOperation::OP_REMOVE
        newSnapshot = null  # TODO

    newSnapshot
  ###

  transform: (op1, op2, side) -> null    # TODO


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
