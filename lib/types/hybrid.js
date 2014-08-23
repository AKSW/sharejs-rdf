var HybridDoc, HybridOp, hybridOT, parserTriplesArrayToRdfJson, rdf, rdfJsonOT, sharejs, textOT, util;

rdf = null;

util = null;

rdfJsonOT = null;

textOT = null;

parserTriplesArrayToRdfJson = function(triples) {
  var createRdfJsonObject, rdfJson, triple, _i, _len;
  createRdfJsonObject = function(object) {
    var objectType, rdfJsonObject;
    objectType = 'literal';
    if (object instanceof rdf.NamedNode) {
      objectType = 'uri';
    }
    if (object instanceof rdf.BlankNode) {
      objectType = 'bnode';
    }
    rdfJsonObject = {
      type: objectType,
      value: object.nominalValue
    };
    if (object.language) {
      rdfJsonObject.lang = object.language;
    }
    if (object.datatype) {
      rdfJsonObject.datatype = object.datatype;
    }
    return rdfJsonObject;
  };
  rdfJson = {};
  for (_i = 0, _len = triples.length; _i < _len; _i++) {
    triple = triples[_i];
    if (!rdfJson[triple.subject]) {
      rdfJson[triple.subject] = {};
    }
    if (!rdfJson[triple.subject][triple.predicate]) {
      rdfJson[triple.subject][triple.predicate] = [];
    }
    rdfJson[triple.subject][triple.predicate].push(createRdfJsonObject(triple.object));
  }
  return rdfJson;
};

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
    var deleted1, deleted2, inserted1, inserted2, rdfDocAfter, rdfDocBefore, rdfOp, textDocAfter, textDocAfterParsed, textDocBefore, tripleToDeletePrevCommented, tripleToInsertPrevCommented, triplesDeletedInTurtle, triplesInsertedInTurtle, triplesToDeleteInTurtle, triplesToInsertInTurtle, _ref;
    snapshot = this._ensureDoc(snapshot);
    op = this._ensureOp(op);
    textDocBefore = snapshot.getTurtleContent();
    rdfDocBefore = snapshot.getRdfJsonDoc();
    textDocAfter = textOT.apply(snapshot.getTurtleContent(), op.getTextOps());
    rdfOp = new rdfJsonOT.Operation(op.getRdfInsertions(), op.getRdfDeletions());
    rdfDocAfter = rdfJsonOT.apply(snapshot.getRdfJsonDoc(), rdfOp);
    textDocAfterParsed = this._parseTurtle(textDocAfter);
    if (textDocAfterParsed) {
      inserted1 = util.triplesDifference(textDocAfterParsed, rdfDocBefore.exportTriples());
      inserted2 = util.triplesDifference(textDocAfterParsed, rdfDocAfter.exportTriples());
      triplesInsertedInTurtle = util.triplesIntersect(inserted1, inserted2);
      deleted1 = util.triplesDifference(rdfDocBefore.exportTriples(), textDocAfterParsed);
      deleted2 = util.triplesDifference(rdfDocAfter.exportTriples(), textDocAfterParsed);
      triplesDeletedInTurtle = util.triplesIntersect(deleted1, deleted2);
      triplesToInsertInTurtle = util.triplesDifference(op.getRdfInsertions(), triplesInsertedInTurtle);
      triplesToDeleteInTurtle = util.triplesDifference(op.getRdfDeletions(), triplesDeletedInTurtle);
      _ref = this._processTurtleCommentedTripleOps(textDocAfter), textDocAfter = _ref[0], tripleToInsertPrevCommented = _ref[1], tripleToDeletePrevCommented = _ref[2];
      triplesInsertedInTurtle = util.triplesUnion(tripleToInsertPrevCommented, triplesInsertedInTurtle);
      triplesToInsertInTurtle = util.triplesUnion(tripleToInsertPrevCommented, triplesToInsertInTurtle);
      triplesDeletedInTurtle = util.triplesUnion(tripleToDeletePrevCommented, triplesDeletedInTurtle);
      triplesToDeleteInTurtle = util.triplesUnion(tripleToDeletePrevCommented, triplesToDeleteInTurtle);
      triplesDeletedInTurtle = util.triplesDifference(triplesDeletedInTurtle, tripleToInsertPrevCommented);
      triplesToDeleteInTurtle = util.triplesDifference(triplesToDeleteInTurtle, tripleToInsertPrevCommented);
      textDocAfter = this._applyChangesToTurtle(textDocAfter, textDocAfterParsed, triplesToInsertInTurtle, triplesToDeleteInTurtle);
      rdfDocAfter = this._applyChangesToRdf(rdfDocAfter, triplesInsertedInTurtle, triplesDeletedInTurtle);
    } else {
      textDocAfter = this._applyChangesToTurtle(textDocAfter, null, op.getRdfInsertions(), op.getRdfDeletions());
    }
    return [textDocAfter, rdfDocAfter];
  },
  _applyChangesToRdf: function(rdfDoc, triplesToInsert, triplesToDelete) {
    rdfDoc.insert(triplesToInsert);
    rdfDoc["delete"](triplesToDelete);
    return rdfDoc;
  },
  _applyChangesToTurtle: function(turtleDoc, turtleDocParsed, triplesToInsert, triplesToDelete) {
    var triple, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    if (turtleDocParsed) {
      _ref = util.rdfJsonToArray(triplesToInsert);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        triple = _ref[_i];
        turtleDoc += "\n" + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
    } else {
      _ref1 = util.rdfJsonToArray(triplesToInsert);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        triple = _ref1[_j];
        turtleDoc += "\n### insert triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
      _ref2 = util.rdfJsonToArray(triplesToDelete);
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        triple = _ref2[_k];
        turtleDoc += "\n### delete triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
    }
    return turtleDoc;
  },
  _processTurtleCommentedTripleOps: function(turtleDoc) {
    var matches, rdfJsonTriple, triplesToDelete, triplesToInsert;
    triplesToInsert = {};
    triplesToDelete = {};
    while (matches = turtleDoc.match(/\n### (insert|delete) triple ### ([^\n]+ \.)$/)) {
      rdfJsonTriple = this._parseTurtle(matches[2]);
      switch (matches[1]) {
        case 'insert':
          triplesToInsert = util.triplesUnion(triplesToInsert, rdfJsonTriple);
          break;
        case 'delete':
          triplesToDelete = util.triplesUnion(triplesToDelete, rdfJsonTriple);
      }
      turtleDoc = turtleDoc.replace(matches[0], '');
    }
    return [turtleDoc, triplesToInsert, triplesToDelete];
  },
  _parseTurtle: function(turtleContents) {
    var parsedDoc, parser, triple, _i, _len, _ref;
    parser = new rdf.TurtleParser;
    parsedDoc = null;
    try {
      if (parser.parse(turtleContents)) {
        parsedDoc = parserTriplesArrayToRdfJson(parser.graph.toArray());
        _ref = parser.graph.toArray();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          triple = _ref[_i];
          if (!triple.subject.nominalValue || !triple.predicate.nominalValue) {
            return null;
          }
        }
      }
    } catch (_error) {}
    return parsedDoc;
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
