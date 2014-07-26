var rdfJson;

if (typeof WEB === 'undefined') {
  rdfJson = require('./rdf-json');
}

rdfJson.api = {
  provides: {
    rdfJson: true
  },
  getData: function() {
    return rdfJson.exportTriples(this.snapshot._triples);
  },
  insert: function(triples, callback) {
    var op;
    op = rdfJson.Operation.insert(triples);
    this.submitOp(op, callback);
    return op;
  },
  "delete": function(triples, callback) {
    var op;
    op = rdfJson.Operation["delete"](triples);
    this.submitOp(op, callback);
    return op;
  },
  update: function(triplesToIns, triplesToDel, callback) {
    var op;
    op = new rdfJson.Operation(triplesToIns, triplesToDel);
    this.submitOp(op, callback);
    return op;
  },
  _register: function() {
    return this.on('remoteop', function(op) {
      return this.emit('update', op._triplesAdd, op._triplesDel);
    });
  }
};
