var rdfJson;

if (typeof WEB === 'undefined') {
  rdfJson = require('./rdf-json');
}

rdfJson.api = {
  provides: {
    rdfJson: true
  },
  getData: function() {
    return rdfJson.exportTriples(this.snapshot.triples);
  },
  insertRdfJson: function(triples, callback) {
    var op;
    op = rdfJson.op.insert(triples);
    this.submitOp(op, callback);
    return op;
  },
  deleteRdfJson: function(triples, callback) {
    var op;
    op = rdfJson.op["delete"](triples);
    this.submitOp(op, callback);
    return op;
  },
  updateRdfJson: function(triplesToIns, triplesToDel, callback) {
    var op;
    op = new rdfJson.op(triplesToIns, triplesToDel);
    this.submitOp(op, callback);
    return op;
  },
  _register: function() {
    return this.on('remoteop', function(op) {
      return this.emit('update', op.triplesAdd, op.triplesDel);
    });
  }
};