register = (file) ->
  type = require file
  exports[type.name] = type
  try require "#{file}-api"

register './sharejs-rdf-json.js'