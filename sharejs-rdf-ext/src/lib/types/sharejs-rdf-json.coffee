
WEB = typeof window == 'object' && window.document

rdfJson =
  name: 'rdf-json'

  create: () -> {}


if(WEB)
  sharejs = window.sharejs
  sharejs.types ||= {}
  # sharejs._bt(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
  sharejs.types.rdfJson = rdfJson
else
  module.exports = rdfJson
  # require('./helpers').bootstrapTransform(rdfJson, rdfJson.transformComponent, rdfJson.checkValidOp, rdfJson.append)
