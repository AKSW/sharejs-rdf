var HybridDoc, HybridOp, WEB, hybridOT, rdfJsonOT, sharejs, textOT;

if (typeof window === 'object' && window.document) {
  WEB = true;
}

rdfJsonOT = null;

textOT = null;

HybridDoc = (function() {
  function HybridDoc(turtleContent, rdfJsonContent) {
    this.turtleContent = turtleContent;
    this.rdfJsonContent = rdfJsonContent;
  }

  HybridDoc.prototype.clone = function() {
    return new HybridDoc(this.turtleContent, this.rdfJsonContent);
  };

  HybridDoc.prototype.getTurtleContent = function() {
    return this.turtleContent;
  };

  HybridDoc.prototype.setTurtleContent = function(turtleContent) {
    return this.turtleContent = turtleContent;
  };

  HybridDoc.prototype.getRdfJsonContent = function() {
    return this.rdfJsonContent;
  };

  HybridDoc.prototype.setRdfJsonContent = function(rdfJsonContent) {
    return this.rdfJsonContent = rdfJsonContent;
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
  apply: function(snapshot, op) {},
  transform: function(op1, op2, side) {},
  compose: function(op1, op2) {}
};

if (WEB != null) {
  sharejs = window.sharejs;
  rdfJsonOT = sharejs.types['rdf-json'];
  textOT = sharejs.types['text'];
  sharejs.types || (sharejs.types = {});
  sharejs.types['turtle-rdf-json'] = hybridOT;
} else {
  textOT = require('../../node_modules/share/lib/types/text');
  rdfJsonOT = require('./rdf-json');
  module.exports = hybridOT;
}
