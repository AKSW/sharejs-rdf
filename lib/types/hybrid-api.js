var hybridOT;

if (typeof WEB === 'undefined') {
  hybridOT = require('./hybrid');
}

hybridOT.api = {
  provides: {
    text: true,
    rdfJson: true
  },
  getTurtleData: function() {
    return this.snapshot.turtleContent;
  },
  getRdfJsonData: function() {
    return hybridOT.exportTriples(this.snapshot.rdfJsonDoc.triples);
  },
  insert: function(pos, text, callback) {
    var op;
    op = new hybridOT.op([
      {
        p: pos,
        i: text
      }
    ], {}, {});
    this.submitOp(op, callback);
    return op;
  },
  del: function(pos, length, callback) {
    var op;
    op = new hybridOT.op([
      {
        p: pos,
        d: this.snapshot.slice(pos, pos + length)
      }
    ], {}, {});
    this.submitOp(op, callback);
    return op;
  },
  insertRdfJson: function(rdfJson, callback) {
    var op;
    op = new hybridOT.op([], rdfJson, {});
    this.submitOp(op, callback);
    return op;
  },
  deleteRdfJson: function(rdfJson, callback) {
    var op;
    op = new hybridOT.op([], {}, rdfJson);
    this.submitOp(op, callback);
    return op;
  },
  updateRdfJson: function(rdfJsonInsertions, rdfJsonDeletions, callback) {
    var op;
    op = new hybridOT.op([], rdfJsonInsertions, rdfJsonDeletions);
    this.submitOp(op, callback);
    return op;
  },
  _register: function() {
    return null;
  }
};
