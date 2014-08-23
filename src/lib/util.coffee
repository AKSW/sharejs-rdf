
rdf = null

util =
  isTriplesEmpty: (triples) ->
    return false for k, v of triples
    return true

  cloneTriples: (triples) ->
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
    triplesClone

  triplesIntersect: (triples1, triples2) ->
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

    intersect

  triplesUnion: (triples1, triples2) ->
    union = {}

    objectsArrayContains = (objects, newObject) ->
      properties = ['type', 'value', 'lang', 'datatype']
      for object in objects
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
    union

  triplesDifference: (triplesMinuend, triplesSubtrahend) ->
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

    triplesDiff

  # returns array of { s: <subjectUri>, p: <predicate Uri>, o: <object as in rdf-json> }
  rdfJsonToArray: (rdfJson) ->
    array = []

    for subjUri, predicates of rdfJson
      for predUri, objects of predicates
        for object in objects
          array.push { s: subjUri, p: predUri, o: object }

    array

  tripleToTurtle: (subjectUri, predicateUri, object) ->
    switch object.type
      when 'uri' then objectStr = '<' + encodeURI(object.value) + '>'
      when 'bnode' then objectStr = '_:' + object.value
      else
        objectStr = '"' + escapeLiteralValue(object.value) + '"'
        objectStr += '^^' + object.datatype if object.datatype
        objectStr += '@' + object.lang if object.lang

    '<' + encodeURI(subjectUri) + '> <' + encodeURI(predicateUri) + '> ' + objectStr + ' .'


# === Utility stuff ===

# Source: https://github.com/RubenVerborgh/N3.js/blob/master/lib/N3Writer.js
# Characters in literals that require escaping
literalEscape    = /["\\\t\n\r\b\f]/
literalEscapeAll = /["\\\t\n\r\b\f]/g
literalReplacements = { '\\': '\\\\', '"': '\\"', '\t': '\\t', '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f' }

escapeLiteralValue = (value) ->
  if literalEscape.test(value)
    value = value.replace(literalEscapeAll, (match) -> literalReplacements[match])
  value

# === End of utility stuff ===


if WEB?
  rdf = window.rdf
  SparkMD5 = window.SparkMD5

  sharejs = window.sharejs
  sharejs.rdfUtil = util

else
  rdf = require 'node-rdf'
  SparkMD5 = require 'spark-md5'

  module.exports = util
