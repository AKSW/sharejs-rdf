var HybridDoc, HybridOp, RdfJsonTurtleSync, arrayFilter, hybridOT, hybridOpToRdfJsonOp, mapTurtleToBlocks, parserTriplesArrayToRdfJson, rdf, rdfJsonOT, removeTripleFromTurtle, removeTripleFromTurtleBlock, sharejs, textOT, util,
  __slice = [].slice;

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

mapTurtleToBlocks = function(turtleContent) {
  var blocks, parser;
  blocks = [];
  parser = new rdf.TurtleParser;
  try {
    if (parser.parse(turtleContent)) {
      blocks = parser.blocks;
    }
  } catch (_error) {}
  return blocks;
};

arrayFilter = function(array, callback) {
  var item, resultArray, _i, _len;
  resultArray = [];
  for (_i = 0, _len = array.length; _i < _len; _i++) {
    item = array[_i];
    if (callback(item)) {
      resultArray.push(item);
    }
  }
  return resultArray;
};

removeTripleFromTurtleBlock = function(turtleContent, block, blockContentParsed, s, p, o) {
  var blockStringified, length, start, tripleRdfJson;
  tripleRdfJson = {};
  tripleRdfJson[s] = {};
  tripleRdfJson[s][p] = [o];
  blockContentParsed = util.triplesDifference(blockContentParsed, tripleRdfJson);
  blockStringified = util.rdfJsonToTurtle(blockContentParsed);
  start = block.start;
  length = block.length;
  if (turtleContent.substr(start + length, 2) === "\r\n") {
    length += 2;
  } else {
    if (turtleContent.charAt(start + length) === "\n") {
      length++;
    }
  }
  return [start, turtleContent.substr(start, length), blockStringified];
};

removeTripleFromTurtle = function(turtleContent, s, p, o) {
  var block, blockContent, blockParsed, blocks, deletion, potentialBlocks, successfulDeletion, _i, _len, _s;
  if (s.substr(0, 2) !== "_:") {
    _s = "<" + s + ">";
  } else {
    _s = s;
  }
  blocks = mapTurtleToBlocks(turtleContent);
  potentialBlocks = arrayFilter(blocks, function(block) {
    return block.subject === _s;
  });
  successfulDeletion = false;
  deletion = [0, '', ''];
  for (_i = 0, _len = potentialBlocks.length; _i < _len; _i++) {
    block = potentialBlocks[_i];
    blockContent = turtleContent.substr(block.start, block.length);
    blockParsed = hybridOT._parseTurtle(blockContent);
    if (util.triplesContain(blockParsed, s, p, o)) {
      deletion = removeTripleFromTurtleBlock(turtleContent, block, blockParsed, s, p, o);
      successfulDeletion = true;
      break;
    }
  }
  if (!successfulDeletion) {
    console.warn('Unable to find the triple (s: <' + s + '>, p: <' + p + '>, o: ' + JSON.stringify(o) + ') for deletion in: ' + turtleContent);
  }
  return deletion;
};

hybridOpToRdfJsonOp = function(op) {
  return new rdfJsonOT.op(op.getRdfInsertions(), op.getRdfDeletions());
};

HybridDoc = (function() {
  HybridDoc.fromData = function(data) {
    return new HybridDoc(data.turtleContent, rdfJsonOT.doc.fromData(data.rdfJsonDoc));
  };

  function HybridDoc(turtleContent, rdfJsonContent) {
    this.setTurtleContent(turtleContent);
    if (rdfJsonContent instanceof rdfJsonOT.doc) {
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
    this.rdfJsonDoc = new rdfJsonOT.doc;
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

RdfJsonTurtleSync = (function() {
  function RdfJsonTurtleSync(snapshot, op) {
    this.snapshot = snapshot;
    this.op = op;
    this.textDoc = snapshot.getTurtleContent();
    this.textDocParsed = null;
    this.rdfDoc = snapshot.getRdfJsonDoc();
    this.originalRdfDoc = this.rdfDoc;
  }

  RdfJsonTurtleSync.prototype.apply = function() {
    var rdfOp;
    this.textDoc = textOT.apply(this.textDoc, this.op.getTextOps());
    rdfOp = new rdfJsonOT.op(this.op.getRdfInsertions(), this.op.getRdfDeletions());
    this.rdfDoc = rdfJsonOT.apply(this.rdfDoc, rdfOp);
    this.textDocParsed = this._parseTurtleAndCommentedTripleOps();
    if (this.textDocParsed) {
      this._applyTurtleChanges();
    } else {
      this._applyChangesToTurtle(this.op.getRdfInsertions(), this.op.getRdfDeletions());
    }
    return this.getSyncedDocs();
  };

  RdfJsonTurtleSync.prototype.getSyncedDocs = function() {
    return [this.textDoc, this.rdfDoc];
  };

  RdfJsonTurtleSync.prototype._emit = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return hybridOT.registeredDocsEmit.apply(hybridOT, args);
  };

  RdfJsonTurtleSync.prototype._appendToTextDoc = function(text) {
    if (!text) {
      return this.textDoc;
    }
    this._emit('sync-text-insert', {
      p: this.textDoc.length,
      i: text
    });
    return this.textDoc += text;
  };

  RdfJsonTurtleSync.prototype._replaceInTextDoc = function(pos, oldContent, newContent) {
    var textAtPos;
    if (newContent === oldContent) {
      return this.textDoc;
    }
    textAtPos = this.textDoc.substr(pos, oldContent.length);
    if (textAtPos !== oldContent) {
      throw new Error("Turtle deletion: Text has changed @" + pos + ".\nExpected: " + oldContent + "\nGot: " + textAtPos);
    }
    this._emit('sync-text-replace', {
      p: pos,
      d: oldContent,
      i: newContent
    });
    return this.textDoc = this.textDoc.substr(0, pos) + newContent + this.textDoc.substr(pos + oldContent.length);
  };

  RdfJsonTurtleSync.prototype._changeRdfDoc = function(triplesToInsert, triplesToDelete) {
    var rdfOp;
    if (util.isTriplesEmpty(triplesToInsert) && util.isTriplesEmpty(triplesToDelete)) {
      return this.rdfDoc;
    }
    this._emit('sync-rdf', {
      i: triplesToInsert,
      d: triplesToDelete
    });
    rdfOp = new rdfJsonOT.op(triplesToInsert, triplesToDelete);
    return this.rdfDoc = rdfJsonOT.apply(this.rdfDoc, rdfOp);
  };

  RdfJsonTurtleSync.prototype._applyTurtleChanges = function() {
    var deleted1, deleted2, inserted1, inserted2, op, revertTurtleDeletions, revertTurtleInsertions, triplesDeletedInTurtle, triplesInsertedInTurtle, triplesToDeleteInTurtle, triplesToInsertInTurtle, _ref;
    op = this.op;
    inserted1 = util.triplesDifference(this.textDocParsed, this.originalRdfDoc.exportTriples());
    inserted2 = util.triplesDifference(this.textDocParsed, this.rdfDoc.exportTriples());
    triplesInsertedInTurtle = util.triplesIntersect(inserted1, inserted2);
    deleted1 = util.triplesDifference(this.originalRdfDoc.exportTriples(), this.textDocParsed);
    deleted2 = util.triplesDifference(this.rdfDoc.exportTriples(), this.textDocParsed);
    triplesDeletedInTurtle = util.triplesIntersect(deleted1, deleted2);
    _ref = this._eliminateOppositions(triplesInsertedInTurtle, triplesDeletedInTurtle), triplesInsertedInTurtle = _ref[0], triplesDeletedInTurtle = _ref[1], revertTurtleInsertions = _ref[2], revertTurtleDeletions = _ref[3];
    triplesToInsertInTurtle = util.triplesDifference(op.getRdfInsertions(), triplesInsertedInTurtle);
    triplesToInsertInTurtle = util.triplesUnion(triplesToInsertInTurtle, revertTurtleDeletions);
    triplesToDeleteInTurtle = util.triplesDifference(op.getRdfDeletions(), triplesDeletedInTurtle);
    triplesToDeleteInTurtle = util.triplesUnion(triplesToDeleteInTurtle, revertTurtleInsertions);
    this._applyChangesToTurtle(triplesToInsertInTurtle, triplesToDeleteInTurtle);
    return this._changeRdfDoc(triplesInsertedInTurtle, triplesDeletedInTurtle);
  };

  RdfJsonTurtleSync.prototype._applyChangesToRdf = function(rdfDoc, triplesToInsert, triplesToDelete) {
    var rdfOp;
    rdfOp = new rdfJsonOT.op(triplesToInsert, triplesToDelete);
    rdfDoc = rdfJsonOT.apply(rdfDoc, rdfOp);
    return rdfDoc;
  };

  RdfJsonTurtleSync.prototype._applyChangesToTurtle = function(triplesToInsert, triplesToDelete) {
    var newContent, oldContent, pos, textToAppend, triple, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _results;
    if (this.textDocParsed) {
      textToAppend = "";
      _ref = util.rdfJsonToArray(triplesToInsert);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        triple = _ref[_i];
        textToAppend += "\n" + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
      this._appendToTextDoc(textToAppend);
      _ref1 = util.rdfJsonToArray(triplesToDelete);
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        triple = _ref1[_j];
        _ref2 = removeTripleFromTurtle(this.textDoc, triple.s, triple.p, triple.o), pos = _ref2[0], oldContent = _ref2[1], newContent = _ref2[2];
        _results.push(this._replaceInTextDoc(pos, oldContent, newContent));
      }
      return _results;
    } else {
      textToAppend = "";
      _ref3 = util.rdfJsonToArray(triplesToInsert);
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        triple = _ref3[_k];
        textToAppend += "\n### insert triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
      _ref4 = util.rdfJsonToArray(triplesToDelete);
      for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
        triple = _ref4[_l];
        textToAppend += "\n### delete triple ### " + util.tripleToTurtle(triple.s, triple.p, triple.o);
      }
      return this._appendToTextDoc(textToAppend);
    }
  };

  RdfJsonTurtleSync.prototype._eliminateOppositions = function(turtleInsertions, turtleDeletions) {
    var intersection, revertTurtleDeletions, revertTurtleInsertions;
    revertTurtleInsertions = {};
    revertTurtleDeletions = {};
    intersection = util.triplesIntersect(this.op.getRdfInsertions(), turtleDeletions);
    if (!util.isTriplesEmpty(intersection)) {
      this.op.setRdfInsertions(util.triplesDifference(this.op.getRdfInsertions(), intersection));
      turtleDeletions = util.triplesDifference(turtleDeletions, intersection);
      revertTurtleDeletions = intersection;
    }
    intersection = util.triplesIntersect(this.op.getRdfDeletions(), turtleInsertions);
    if (!util.isTriplesEmpty(intersection)) {
      this.op.setRdfDeletions(util.triplesDifference(this.op.getRdfDeletions(), intersection));
      turtleInsertions = util.triplesDifference(turtleInsertions, intersection);
      revertTurtleInsertions = intersection;
    }
    return [turtleInsertions, turtleDeletions, revertTurtleInsertions, revertTurtleDeletions];
  };

  RdfJsonTurtleSync.prototype._processTurtleCommentedTripleOps = function(turtleDoc) {
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
  };

  RdfJsonTurtleSync.prototype._parseTurtleAndCommentedTripleOps = function() {
    var triplesToDelete, triplesToInsert, _ref;
    _ref = this._processTurtleCommentedTripleOps(this.textDoc), this.textDoc = _ref[0], triplesToInsert = _ref[1], triplesToDelete = _ref[2];
    if (!util.isTriplesEmpty(triplesToInsert) || !util.isTriplesEmpty(triplesToDelete)) {
      this.textDocParsed = this._parseTurtle(this.textDoc);
      if (this.textDocParsed) {
        this._applyChangesToTurtle(triplesToInsert, triplesToDelete);
      }
    }
    return this._parseTurtle(this.textDoc);
  };

  RdfJsonTurtleSync.prototype._parseTurtle = function(turtleContents) {
    return hybridOT._parseTurtle(turtleContents);
  };

  return RdfJsonTurtleSync;

})();

hybridOT = {
  name: 'turtle-rdf-json',
  doc: HybridDoc,
  op: HybridOp,
  registeredDocs: [],
  exportTriples: null,
  registerDoc: function(doc) {
    return this.registeredDocs.push(doc);
  },
  registeredDocsEmit: function() {
    var args, doc, _i, _len, _ref, _results;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _ref = this.registeredDocs;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      doc = _ref[_i];
      _results.push(doc.emit.apply(doc, args));
    }
    return _results;
  },
  create: function() {
    return new HybridDoc('', {});
  },
  apply: function(snapshot, op) {
    var rdfDoc, sync, textDoc, _ref;
    snapshot = this._ensureDoc(snapshot);
    op = this._ensureOp(op);
    sync = new RdfJsonTurtleSync(snapshot, op);
    _ref = sync.apply(), textDoc = _ref[0], rdfDoc = _ref[1];
    return new HybridDoc(textDoc, rdfDoc);
  },
  transform: function(op1, op2, side) {
    var op1First, op1tRdfOp, op1tTextOps;
    op1 = this._ensureOp(op1);
    op2 = this._ensureOp(op2);
    op1First = side === 'right';
    if (side !== 'left' && side !== 'right') {
      throw new Error("Bad parameter 'side' given: " + side);
    }
    op1tTextOps = textOT.transform(op1.getTextOps(), op2.getTextOps(), side);
    op1tRdfOp = rdfJsonOT.transform(hybridOpToRdfJsonOp(op1), hybridOpToRdfJsonOp(op2), side);
    return new HybridOp(op1tTextOps, op1tRdfOp.getInsertions(), op1tRdfOp.getDeletions());
  },
  compose: function(op1, op2) {
    var rdfOp, rdfOp1, rdfOp2, textOps;
    op1 = this._ensureOp(op1);
    op2 = this._ensureOp(op2);
    rdfOp1 = hybridOpToRdfJsonOp(op1);
    rdfOp2 = hybridOpToRdfJsonOp(op2);
    textOps = textOT.compose(op1.getTextOps(), op2.getTextOps());
    rdfOp = rdfJsonOT.compose(rdfOp1, rdfOp2);
    return new HybridOp(textOps, rdfOp.getInsertions(), rdfOp.getDeletions());
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
            return [null, parser];
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
    if (typeof doc === 'object' && doc.rdfJsonDoc) {
      return HybridDoc.fromData(doc);
    }
    throw new Error("Snapshot must be a turtle + rdf-json hybrid document. Given: " + (JSON.stringify(doc)));
  },
  _ensureOp: function(op) {
    if (op instanceof HybridOp) {
      return op;
    }
    if (typeof op === 'object' && op.textOps && op.rdfInsertions && op.rdfDeletions) {
      return HybridOp.fromData(op);
    }
    throw new Error("Operation must be a turtle + rdf-json hybrid operation. Given: " + (JSON.stringify(op)));
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

hybridOT.exportTriples = rdfJsonOT.exportTriples;
