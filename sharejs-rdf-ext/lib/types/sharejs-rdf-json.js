(function() {
  var WEB, rdfJson, sharejs;

  WEB = typeof window === 'object' && window.document;

  rdfJson = {
    name: 'rdf-json',
    create: function() {
      return {};
    }
  };

  if (WEB) {
    sharejs = window.sharejs;
    sharejs.types || (sharejs.types = {});
    sharejs.types.rdfJson = rdfJson;
  } else {
    module.exports = rdfJson;
  }

}).call(this);
