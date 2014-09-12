var hybridOT;

if (typeof WEB === 'undefined') {
  hybridOT = require('./hybrid');
}

hybridOT.api = {
  provides: {
    text: true,
    rdfJson: true
  },
  getText: function() {
    return this.getTurtleData();
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
        d: this.snapshot.turtleContent.slice(pos, pos + length)
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
    hybridOT.registerDoc(this);
    this.on('remoteop', function(op) {
      var component, _i, _len, _ref, _results;
      this.emit('rdf-update', op.rdfInsertions, op.rdfDeletions);
      this.emit('hybrid-update', op.textOps, op.rdfInsertions, op.rdfDeletions);
      if (op.textOps) {
        _ref = op.textOps;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          component = _ref[_i];
          if (component.i !== void 0) {
            _results.push(this.emit('insert', component.p, component.i));
          } else {
            _results.push(this.emit('delete', component.p, component.d));
          }
        }
        return _results;
      }
    });
    this.on('sync-text-insert', function(op) {
      return this.emit('insert', op.p, op.i);
    });
    this.on('sync-text-replace', function(op) {
      this.emit('insert', op.p, op.i);
      return this.emit('delete', op.p + op.i.length, op.d);
    });
    return this.on('sync-rdf', function(op) {
      return this.emit('rdf-update', op.i, op.d);
    });
  }
};
