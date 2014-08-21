var HybridDoc, HybridOp, hybridOT, rdf, rdfJsonOT, sharejs, textOT, util;

rdf = null;

util = null;

rdfJsonOT = null;

textOT = null;

HybridDoc = (function() {
  HybridDoc.fromData = function(data) {
    return new HybridDoc(data.turtleContent, rdfJsonOT.Doc.fromData(data.rdfJsonDoc));
  };

  function HybridDoc(turtleContent, rdfJsonContent) {
    this.setTurtleContent(turtleContent);
    if (rdfJsonContent instanceof rdfJsonOT.Doc) {
      this.rdfJsonDoc = rdfJsonContent;
    } else {
      this.setRdfJsonContent(rdfJsonContent);
    }
  }

  HybridDoc.prototype.clone = function() {
    return new HybridDoc(this.getTurtleContent(), this.getRdfJsonContent());
  };

  HybridDoc.prototype.getTurtleContent = function() {
    return this.turtleContent;
  };

  HybridDoc.prototype.setTurtleContent = function(turtleContent) {
    return this.turtleContent = turtleContent;
  };

  HybridDoc.prototype.getRdfJsonDoc = function() {
    return this.rdfJsonDoc;
  };

  HybridDoc.prototype.getRdfJsonContent = function() {
    return this.rdfJsonDoc.exportTriples();
  };

  HybridDoc.prototype.setRdfJsonContent = function(rdfJsonContent) {
    this.rdfJsonDoc = new rdfJsonOT.Doc;
    this.rdfJsonDoc.insert(rdfJsonContent);
    return this.rdfJsonDoc;
  };

  return HybridDoc;

})();

HybridOp = (function() {
  HybridOp.fromData = function(data) {
    return new HybridOp(data.textOps, data.rdfInsertions, data.rdfDeletions);
  };

  function HybridOp(textOps, rdfInsertions, rdfDeletions) {
    this.textOps = textOps;
    this.rdfInsertions = rdfInsertions;
    this.rdfDeletions = rdfDeletions;
  }

  HybridOp.prototype.clone = function() {
    return new HybridOp(this.textOps.slice(), this.rdfInsertions.slice(), this.rdfDeletions.slice());
  };

  HybridOp.prototype.getTextOps = function() {
    return this.textOps;
  };

  HybridOp.prototype.setTextOps = function(textOps) {
    return this.textOps = textOps;
  };

  HybridOp.prototype.getRdfInsertions = function() {
    return this.rdfInsertions;
  };

  HybridOp.prototype.setRdfInsertions = function(rdfInsertions) {
    return this.rdfInsertions = rdfInsertions;
  };

  HybridOp.prototype.getRdfDeletions = function() {
    return this.rdfDeletions;
  };

  HybridOp.prototype.setRdfDeletions = function(rdfDeletions) {
    return this.rdfDeletions = rdfDeletions;
  };

  return HybridOp;

})();

hybridOT = {
  name: 'turtle-rdf-json',
  doc: HybridDoc,
  op: HybridOp,
  create: function() {
    return new HybridDoc('', {});
  },
  apply: function(snapshot, op) {
    var rdfDoc, textDoc, _ref;
    _ref = this.syncDocuments(snapshot, op), textDoc = _ref[0], rdfDoc = _ref[1];
    return new HybridDoc(textDoc, rdfDoc);
  },
  transform: function(op1, op2, side) {},
  compose: function(op1, op2) {},
  syncDocuments: function(snapshot, op) {
    var rdfDocAfter, rdfDocBefore, rdfOp, textDocAfter, textDocBefore;
    snapshot = this._ensureDoc(snapshot);
    op = this._ensureOp(op);
    textDocBefore = snapshot.getTurtleContent();
    rdfDocBefore = snapshot.getRdfJsonDoc();
    textDocAfter = textOT.apply(snapshot.getTurtleContent(), op.getTextOps());
    rdfOp = new rdfJsonOT.Operation(op.getRdfInsertions(), op.getRdfDeletions());
    rdfDocAfter = rdfJsonOT.apply(snapshot.getRdfJsonDoc(), rdfOp);
    return [textDocAfter, rdfDocAfter];
  },
  _ensureDoc: function(doc) {
    if (doc instanceof HybridDoc) {
      return doc;
    }
    if (typeof doc === 'object' && doc.turtleContent && doc.rdfContent) {
      return HybridDoc.fromData(doc);
    }
    throw new Error("Snapshot must be a turtle + rdf-json hybrid document. Given: " + doc);
  },
  _ensureOp: function(op) {
    if (op instanceof HybridOp) {
      return op;
    }
    if (typeof op === 'object' && op.textOps && op.rdfInsertions && op.rdfDeletions) {
      return HybridOp.fromData(op);
    }
    throw new Error("Operation must be a turtle + rdf-json hybrid operation. Given: " + op);
  }
};

if (typeof WEB !== "undefined" && WEB !== null) {
  sharejs = window.sharejs;
  rdfJsonOT = sharejs.types['rdf-json'];
  textOT = sharejs.types['text'];
  rdf = window.rdf;
  util = sharejs.rdfUtil;
  sharejs.types || (sharejs.types = {});
  sharejs.types['turtle-rdf-json'] = hybridOT;
} else {
  textOT = require('../../node_modules/share/lib/types/text');
  rdfJsonOT = require('./rdf-json');
  rdf = require('node-rdf');
  util = require('../util');
  module.exports = hybridOT;
}
