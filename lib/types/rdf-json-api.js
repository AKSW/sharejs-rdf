var rdfJson;

if (typeof WEB === 'undefined') {
  rdfJson = require('./rdf-json');
}

rdfJson.api = {
  provides: {
    rdfJson: true
  },
  _register: function() {
    return this.on('remoteop', function(op) {
      switch (op._operation) {
        case 'insert':
          return this.emit('insert', op._triples);
        case 'delete':
          return this.emit('delete', op._triples);
      }
    });
  }
};
