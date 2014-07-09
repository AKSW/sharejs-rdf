# RDF/JSON document API

rdfJson = require './rdf-json' if typeof WEB is 'undefined'

rdfJson.api =
  provides: { rdfJson: true }

  _register: ->
    @on 'remoteop', (op) ->
      switch op._operation
        when 'insert' then @emit 'insert', op._triples
        when 'delete' then @emit 'delete', op._triples
