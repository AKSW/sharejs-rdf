
matchers = require 'jasmine-expect'

beforeEach () ->

  flattenTriples = (triples) ->
    serialized = []

    for subjUri, predicates of triples
      for predUri, objects of predicates
        for object in objects
          objStr = "#{object.type}:#{object.value}"
          objStr += "//#{object.lang}" if object.lang
          objStr += "^^#{object.datatype}" if object.datatype
          tripleStr = "<#{subjUri}> <#{predUri}> /#{objStr}/"
          serialized.push tripleStr

    return serialized


  _matchers =
    # works like toEqual(), but assumes a valid rdf/json object and
    # is aware that the order of the triples does not matter
    triplesToEqual: (other) ->
      actual_flat = flattenTriples this.actual
      other_flat  = flattenTriples other

      actual_flat.sort()
      other_flat.sort()

      return false if actual_flat.length != other_flat.length

      for actual_triple, i in actual_flat
        other_triple = other_flat[i]
        return false if actual_triple != other_triple

      return true

  @addMatchers _matchers
