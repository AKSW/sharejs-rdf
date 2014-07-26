/**
  jshint unused: true
  @const
  @type {boolean}
*/
var WEB = true;

var RdfJsonDoc, RdfJsonOperation, SparkMD5, WEB, cloneExportTriples, cloneTriples, exportTriples, exportTriplesDifference, exportTriplesIntersect, exportTriplesUnion, hashTripleObject, isTriplesEmpty, md5, rdfJson, sharejs;

if (typeof window === 'object' && window.document) {
  WEB = true;
}

md5 = function(str) {
  return SparkMD5.hash(str);
};

hashTripleObject = function(obj) {
  var hashObject;
  hashObject = function(obj, properties) {
    var prop, str, _i, _len;
    str = "";
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      if (typeof obj[prop] !== "undefined") {
        str += "" + prop + ":'" + obj[prop] + "';";
      }
    }
    return md5(str);
  };
  return hashObject(obj, ['type', 'value', 'lang', 'datatype']);
};

isTriplesEmpty = function(triples) {
  var k, v;
  for (k in triples) {
    v = triples[k];
    return false;
  }
  return true;
};

cloneTriples = function(triples) {
  var objKey, objValue, object, objectClone, objectHash, objects, predUri, predicates, subjUri, triplesClone;
  triplesClone = {};
  for (subjUri in triples) {
    predicates = triples[subjUri];
    triplesClone[subjUri] = {};
    for (predUri in predicates) {
      objects = predicates[predUri];
      triplesClone[subjUri][predUri] = {};
      for (objectHash in objects) {
        object = objects[objectHash];
        objectClone = {};
        for (objKey in object) {
          objValue = object[objKey];
          objectClone[objKey] = objValue;
        }
        triplesClone[subjUri][predUri][objectHash] = objectClone;
      }
    }
  }
  return triplesClone;
};

cloneExportTriples = function(triples) {
  var objKey, objValue, object, objectClone, objects, predUri, predicates, subjUri, triplesClone, _i, _len;
  triplesClone = {};
  for (subjUri in triples) {
    predicates = triples[subjUri];
    triplesClone[subjUri] = {};
    for (predUri in predicates) {
      objects = predicates[predUri];
      triplesClone[subjUri][predUri] = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        objectClone = {};
        for (objKey in object) {
          objValue = object[objKey];
          objectClone[objKey] = objValue;
        }
        triplesClone[subjUri][predUri].push(objectClone);
      }
    }
  }
  return triplesClone;
};

exportTriples = function(triples) {
  var object, objectHash, objectHashes, objects, predicateUri, predicates, subjectUri, _export, _i, _len;
  _export = {};
  for (subjectUri in triples) {
    predicates = triples[subjectUri];
    _export[subjectUri] = {};
    for (predicateUri in predicates) {
      objects = predicates[predicateUri];
      _export[subjectUri][predicateUri] = [];
      objectHashes = [];
      for (objectHash in objects) {
        object = objects[objectHash];
        objectHashes.push(objectHash);
      }
      objectHashes.sort();
      for (_i = 0, _len = objectHashes.length; _i < _len; _i++) {
        objectHash = objectHashes[_i];
        object = objects[objectHash];
        _export[subjectUri][predicateUri].push(object);
      }
    }
  }
  return _export;
};

exportTriplesIntersect = function(triples1, triples2) {
  var intersect, object1, object2, objects1, objects2, objects_intersect, predUri1, predicates1, subjUri1, _i, _j, _len, _len1;
  intersect = {};
  for (subjUri1 in triples1) {
    predicates1 = triples1[subjUri1];
    if (!triples2[subjUri1]) {
      continue;
    }
    for (predUri1 in predicates1) {
      objects1 = predicates1[predUri1];
      if (!triples2[subjUri1][predUri1]) {
        continue;
      }
      objects2 = triples2[subjUri1][predUri1];
      objects_intersect = [];
      for (_i = 0, _len = objects1.length; _i < _len; _i++) {
        object1 = objects1[_i];
        for (_j = 0, _len1 = objects2.length; _j < _len1; _j++) {
          object2 = objects2[_j];
          if (object1.type === object2.type && object1.value === object2.value && object1.lang === object2.lang && object1.datatype === object2.datatype) {
            objects_intersect.push(object1);
          }
        }
      }
      if (objects_intersect.length > 0) {
        if (!intersect[subjUri1]) {
          intersect[subjUri1] = {};
        }
        intersect[subjUri1][predUri1] = objects_intersect;
      }
    }
  }
  return intersect;
};

exportTriplesUnion = function(triples1, triples2) {
  var addToUnion, objectsArrayContains, union, walkTriples;
  union = {};
  objectsArrayContains = function(objects, newObject) {
    var objectsMatch, properties, property, _i, _j, _len, _len1;
    properties = ['type', 'value', 'lang', 'datatype'];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      objects = objects[_i];
      objectsMatch = true;
      for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
        property = properties[_j];
        if (object[property] !== newObject[property]) {
          objectsMatch = false;
          break;
        }
      }
      if (objectsMatch) {
        return true;
      }
    }
    return false;
  };
  addToUnion = function(s, p, o) {
    if (!union[s]) {
      union[s] = {};
    }
    if (!union[s][p]) {
      union[s][p] = [];
    }
    if (!objectsArrayContains(union[s][p], o)) {
      return union[s][p].push(o);
    }
  };
  walkTriples = function(triples, cb) {
    var object, objects, predUri, predicates, subjUri, _results;
    _results = [];
    for (subjUri in triples) {
      predicates = triples[subjUri];
      _results.push((function() {
        var _results1;
        _results1 = [];
        for (predUri in predicates) {
          objects = predicates[predUri];
          _results1.push((function() {
            var _i, _len, _results2;
            _results2 = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              _results2.push(cb(subjUri, predUri, object));
            }
            return _results2;
          })());
        }
        return _results1;
      })());
    }
    return _results;
  };
  walkTriples(triples1, addToUnion);
  walkTriples(triples2, addToUnion);
  return union;
};

exportTriplesDifference = function(triplesMinuend, triplesSubtrahend) {
  var object1, object2, objects, objects2, objectsDiff, predUri, predicates, subjUri, triplesDiff, _i, _j, _len, _len1;
  triplesDiff = {};
  for (subjUri in triplesMinuend) {
    predicates = triplesMinuend[subjUri];
    for (predUri in predicates) {
      objects = predicates[predUri];
      objectsDiff = [];
      if (triplesSubtrahend[subjUri] && triplesSubtrahend[subjUri][predUri]) {
        objects2 = triplesSubtrahend[subjUri][predUri];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object1 = objects[_i];
          for (_j = 0, _len1 = objects2.length; _j < _len1; _j++) {
            object2 = objects2[_j];
            if (object1.type !== object2.type || object1.value !== object2.value || object1.lang !== object2.lang || object1.datatype !== object2.datatype) {
              objectsDiff.push(object1);
            }
          }
        }
      } else {
        objectsDiff = objects;
      }
      if (objectsDiff.length > 0) {
        if (!triplesDiff[subjUri]) {
          triplesDiff[subjUri] = {};
        }
        triplesDiff[subjUri][predUri] = objectsDiff;
      }
    }
  }
  return triplesDiff;
};

RdfJsonDoc = (function() {
  function RdfJsonDoc(triples) {
    if (triples == null) {
      triples = {};
    }
    this._uriRegex = /^\w+:\/\/\w+(\.\w+)+\//;
    this._triples = {};
    this.insert(triples);
  }

  RdfJsonDoc.byInternalTripleSet = function(triples) {
    var doc;
    doc = new RdfJsonDoc;
    doc._triples = triples;
    return doc;
  };

  RdfJsonDoc.prototype.exportTriples = function() {
    return exportTriples(this._triples);
  };

  RdfJsonDoc.prototype.clone = function() {
    var doc;
    doc = new RdfJsonDoc;
    doc._triples = cloneTriples(this._triples);
    return doc;
  };

  RdfJsonDoc.prototype.insert = function(triples) {
    var object, objectHash, objects, predicateUri, predicates, subjectUri, _results;
    _results = [];
    for (subjectUri in triples) {
      predicates = triples[subjectUri];
      this.assertSubjectIsUri(subjectUri);
      if (!this._triples[subjectUri]) {
        this._triples[subjectUri] = {};
      }
      _results.push((function() {
        var _results1;
        _results1 = [];
        for (predicateUri in predicates) {
          objects = predicates[predicateUri];
          this.assertPredicateIsUri(predicateUri, subjectUri);
          this.assertObjectsArray(objects, subjectUri, predicateUri);
          if (!this._triples[subjectUri][predicateUri]) {
            this._triples[subjectUri][predicateUri] = {};
          }
          _results1.push((function() {
            var _i, _len, _results2;
            _results2 = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              objectHash = hashTripleObject(object);
              _results2.push(this._triples[subjectUri][predicateUri][objectHash] = object);
            }
            return _results2;
          }).call(this));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  RdfJsonDoc.prototype["delete"] = function(triples) {
    var objectCount, objectToRemove, objectToRemoveHash, objects, predicateCount, predicateUri, predicates, presentObject, presentObjectHash, presentObjects, subjectUri, _i, _len, _results;
    _results = [];
    for (subjectUri in triples) {
      predicates = triples[subjectUri];
      this.assertSubjectIsUri(subjectUri);
      if (!this._triples[subjectUri]) {
        continue;
      }
      predicateCount = 0;
      for (predicateUri in predicates) {
        objects = predicates[predicateUri];
        this.assertPredicateIsUri(predicateUri, subjectUri);
        this.assertObjectsArray(objects, subjectUri, predicateUri);
        predicateCount++;
        if (!this._triples[subjectUri][predicateUri]) {
          continue;
        }
        presentObjects = this._triples[subjectUri][predicateUri];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          objectToRemove = objects[_i];
          objectToRemoveHash = hashTripleObject(objectToRemove);
          if (presentObjects[objectToRemoveHash]) {
            delete this._triples[subjectUri][predicateUri][objectToRemoveHash];
          }
        }
        objectCount = 0;
        for (presentObjectHash in presentObjects) {
          presentObject = presentObjects[presentObjectHash];
          objectCount++;
        }
        if (objectCount === 0) {
          predicateCount--;
          delete this._triples[subjectUri][predicateUri];
        }
      }
      if (predicateCount === 0) {
        _results.push(delete this._triples[subjectUri]);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  RdfJsonDoc.prototype.assertSubjectIsUri = function(subject) {
    if (typeof subject !== 'string' || !this.isUri(subject)) {
      throw new Error("Subject must be an URI: " + subject);
    }
  };

  RdfJsonDoc.prototype.assertPredicateIsUri = function(predicate, subject) {
    if (typeof predicate !== 'string' || !this.isUri(predicate)) {
      throw new Error("Predicate must be an URI: " + predicate + " (of subject " + subject + ")");
    }
  };

  RdfJsonDoc.prototype.assertObjectsArray = function(objects, subject, predicate) {
    if (typeof objects !== 'object' || !(objects instanceof Array)) {
      throw new Error("Objects must be an array of objects: " + objects + " (of subject " + subject + ", predicate " + predicate + ")");
    }
  };

  RdfJsonDoc.prototype.isUri = function(str) {
    return str.match(this._uriRegex);
  };

  return RdfJsonDoc;

})();

RdfJsonOperation = (function() {
  RdfJsonOperation.insert = function(triplesToAdd) {
    return new RdfJsonOperation(triplesToAdd, {});
  };

  RdfJsonOperation["delete"] = function(triplesToDelete) {
    return new RdfJsonOperation({}, triplesToDelete);
  };

  function RdfJsonOperation(triplesToAdd, triplesToDelete) {
    this._triplesAdd = triplesToAdd;
    this._triplesDel = triplesToDelete;
  }

  RdfJsonOperation.prototype.clone = function() {
    return new RdfJsonOperation(cloneExportTriples(this.getTriplesToAdd()), cloneExportTriples(this.getTriplesToDel()));
  };

  RdfJsonOperation.prototype.getTriplesToAdd = function() {
    return this._triplesAdd;
  };

  RdfJsonOperation.prototype.setTriplesToAdd = function(triples) {
    return this._triplesAdd = triples;
  };

  RdfJsonOperation.prototype.hasTriplesToAdd = function() {
    return !this._triplesEmpty(this._triplesAdd);
  };

  RdfJsonOperation.prototype.getTriplesToDel = function() {
    return this._triplesDel;
  };

  RdfJsonOperation.prototype.setTriplesToDel = function(triples) {
    return this._triplesDel = triples;
  };

  RdfJsonOperation.prototype.hasTriplesToDel = function() {
    return !this._triplesEmpty(this._triplesDel);
  };

  RdfJsonOperation.prototype._triplesEmpty = function(triples) {
    var k, v;
    for (k in triples) {
      v = triples[k];
      return false;
    }
    return true;
  };

  return RdfJsonOperation;

})();

rdfJson = {
  Doc: RdfJsonDoc,
  Operation: RdfJsonOperation,
  exportTriples: exportTriples,
  name: 'rdf-json',
  create: function() {
    return new RdfJsonDoc;
  },
  apply: function(snapshot, op) {
    var newSnapshot;
    snapshot = this._ensureDoc(snapshot);
    op = this._ensureOp(op);
    newSnapshot = snapshot.clone();
    if (op.hasTriplesToAdd()) {
      newSnapshot.insert(op.getTriplesToAdd());
    }
    if (op.hasTriplesToDel()) {
      newSnapshot["delete"](op.getTriplesToDel());
    }
    return newSnapshot;
  },
  transform: function(op1, op2, side) {
    var op1First, op1t, transformTriples;
    transformTriples = function(op1Triples, op2Triples) {
      var intersect;
      intersect = exportTriplesIntersect(op1Triples, op2Triples);
      return exportTriplesDifference(op1Triples, intersect);
    };
    op1t = op1.clone();
    op1First = side === 'right';
    if (side !== 'left' && side !== 'right') {
      throw new Error("Bad parameter 'side' given: " + side);
    }
    if (op1First) {
      return op1t;
    }
    if (isTriplesEmpty(op1.getTriplesToAdd()) && isTriplesEmpty(op2.getTriplesToAdd())) {
      return op1t;
    }
    if (isTriplesEmpty(op1.getTriplesToDel()) && isTriplesEmpty(op2.getTriplesToDel())) {
      return op1t;
    }
    op1t.setTriplesToAdd(exportTriplesDifference(op1.getTriplesToAdd(), op2.getTriplesToDel()));
    op1t.setTriplesToDel(exportTriplesDifference(op1.getTriplesToDel(), op2.getTriplesToAdd()));
    return op1t;
  },
  compose: function(op1, op2) {
    var triplesToAdd, triplesToAddUnion, triplesToDel, triplesToDelUnion;
    triplesToAddUnion = exportTriplesUnion(op1.getTriplesToAdd(), op2.getTriplesToAdd());
    triplesToDelUnion = exportTriplesUnion(op1.getTriplesToDel(), op2.getTriplesToDel());
    triplesToAdd = exportTriplesDifference(triplesToAddUnion, triplesToDelUnion);
    triplesToDel = exportTriplesDifference(triplesToDelUnion, triplesToAddUnion);
    return new RdfJsonOperation(triplesToAdd, triplesToDel);
  },
  _ensureDoc: function(doc) {
    if (doc instanceof RdfJsonDoc) {
      return doc;
    }
    if (typeof doc === 'object' && doc._triples) {
      return RdfJsonDoc.byInternalTripleSet(doc._triples);
    }
    throw new Error("Snapshot must be a rdf-json document. Given: " + snapshot);
  },
  _ensureOp: function(op) {
    if (op instanceof RdfJsonOperation) {
      return op;
    }
    if (typeof op === 'object' && op._triplesAdd && op._triplesDel) {
      return new RdfJsonOperation(op._triplesAdd, op._triplesDel);
    }
    throw new Error("Operation must be a rdf-json operation. Given: " + op);
  }
};

if (WEB != null) {
  sharejs = window.sharejs;
  sharejs.types || (sharejs.types = {});
  sharejs.types['rdf-json'] = rdfJson;
} else {
  SparkMD5 = require('spark-md5');
  module.exports = rdfJson;
}

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

/*jshint bitwise:false*/
/*global unescape*/

(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;
        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.SparkMD5 = factory();
    }
}(function (undefined) {

    'use strict';

    ////////////////////////////////////////////////////////////////////////////

    /*
     * Fastest md5 implementation around (JKM md5)
     * Credits: Joseph Myers
     *
     * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
     * @see http://jsperf.com/md5-shootout/7
     */

    /* this function is much faster,
      so if possible we use it. Some IEs
      are the only ones I know of that
      need the idiotic second function,
      generated by an if clause.  */
    var add32 = function (a, b) {
        return (a + b) & 0xFFFFFFFF;
    },

    cmn = function (q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    },

    ff = function (a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    },

    gg = function (a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    },

    hh = function (a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    },

    ii = function (a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    },

    md5cycle = function (x, k) {
        var a = x[0],
            b = x[1],
            c = x[2],
            d = x[3];

        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);

        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);

        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);

        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    },

    /* there needs to be support for Unicode here,
       * unless we pretend that we can redefine the MD-5
       * algorithm for multi-byte characters (perhaps
       * by adding every four 16-bit characters and
       * shortening the sum to 32 bits). Otherwise
       * I suggest performing MD-5 as if every character
       * was two bytes--e.g., 0040 0025 = @%--but then
       * how will an ordinary MD-5 sum be matched?
       * There is no way to standardize text to something
       * like UTF-8 before transformation; speed cost is
       * utterly prohibitive. The JavaScript standard
       * itself needs to look at this: it should start
       * providing access to strings as preformed UTF-8
       * 8-bit unsigned value arrays.
       */
    md5blk = function (s) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    },

    md5blk_array = function (a) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
    },

    md51 = function (s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);
        return state;
    },

    md51_array = function (a) {
        var n = a.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }

        // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
        // containing the last element of the parent array if the sub array specified starts
        // beyond the length of the parent array - weird.
        // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
        a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);

        return state;
    },

    hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'],

    rhex = function (n) {
        var s = '',
            j;
        for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    },

    hex = function (x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
        }
        return x.join('');
    },

    md5 = function (s) {
        return hex(md51(s));
    },



    ////////////////////////////////////////////////////////////////////////////

    /**
     * SparkMD5 OOP implementation.
     *
     * Use this class to perform an incremental md5, otherwise use the
     * static methods instead.
     */
    SparkMD5 = function () {
        // call reset to init the instance
        this.reset();
    };


    // In some cases the fast add32 function cannot be used..
    if (md5('hello') !== '5d41402abc4b2a76b9719d911017c592') {
        add32 = function (x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        };
    }


    /**
     * Appends a string.
     * A conversion will be applied if an utf8 string is detected.
     *
     * @param {String} str The string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.append = function (str) {
        // converts the string to utf8 bytes if necessary
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        // then append as binary
        this.appendBinary(str);

        return this;
    };

    /**
     * Appends a binary string.
     *
     * @param {String} contents The binary string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.appendBinary = function (contents) {
        this._buff += contents;
        this._length += contents.length;

        var length = this._buff.length,
            i;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._state, md5blk(this._buff.substring(i - 64, i)));
        }

        this._buff = this._buff.substr(i - 64);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     * Use the raw parameter to obtain the raw result instead of the hex one.
     *
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            i,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = !!raw ? this._state : hex(this._state);

        this.reset();

        return ret;
    };

    /**
     * Finish the final calculation based on the tail.
     *
     * @param {Array}  tail   The tail (will be modified)
     * @param {Number} length The length of the remaining buffer
     */
    SparkMD5.prototype._finish = function (tail, length) {
        var i = length,
            tmp,
            lo,
            hi;

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(this._state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Do the final computation based on the tail and length
        // Beware that the final length may not fit in 32 bits so we take care of that
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._state, tail);
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.reset = function () {
        this._buff = "";
        this._length = 0;
        this._state = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other aditional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.prototype.destroy = function () {
        delete this._state;
        delete this._buff;
        delete this._length;
    };


    /**
     * Performs the md5 hash on a string.
     * A conversion will be applied if utf8 string is detected.
     *
     * @param {String}  str The string
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.hash = function (str, raw) {
        // converts the string to utf8 bytes if necessary
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        var hash = md51(str);

        return !!raw ? hash : hex(hash);
    };

    /**
     * Performs the md5 hash on a binary string.
     *
     * @param {String}  content The binary string
     * @param {Boolean} raw     True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.hashBinary = function (content, raw) {
        var hash = md51(content);

        return !!raw ? hash : hex(hash);
    };

    /**
     * SparkMD5 OOP implementation for array buffers.
     *
     * Use this class to perform an incremental md5 ONLY for array buffers.
     */
    SparkMD5.ArrayBuffer = function () {
        // call reset to init the instance
        this.reset();
    };

    ////////////////////////////////////////////////////////////////////////////

    /**
     * Appends an array buffer.
     *
     * @param {ArrayBuffer} arr The array to be appended
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.append = function (arr) {
        // TODO: we could avoid the concatenation here but the algorithm would be more complex
        //       if you find yourself needing extra performance, please make a PR.
        var buff = this._concatArrayBuffer(this._buff, arr),
            length = buff.length,
            i;

        this._length += arr.byteLength;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._state, md5blk_array(buff.subarray(i - 64, i)));
        }

        // Avoids IE10 weirdness (documented above)
        this._buff = (i - 64) < length ? buff.subarray(i - 64) : new Uint8Array(0);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     * Use the raw parameter to obtain the raw result instead of the hex one.
     *
     * @param {Boolean} raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.ArrayBuffer.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            i,
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = !!raw ? this._state : hex(this._state);

        this.reset();

        return ret;
    };

    SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.reset = function () {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._state = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other aditional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;

    /**
     * Concats two array buffers, returning a new one.
     *
     * @param  {ArrayBuffer} first  The first array buffer
     * @param  {ArrayBuffer} second The second array buffer
     *
     * @return {ArrayBuffer} The new array buffer
     */
    SparkMD5.ArrayBuffer.prototype._concatArrayBuffer = function (first, second) {
        var firstLength = first.length,
            result = new Uint8Array(firstLength + second.byteLength);

        result.set(first);
        result.set(new Uint8Array(second), firstLength);

        return result;
    };

    /**
     * Performs the md5 hash on an array buffer.
     *
     * @param {ArrayBuffer} arr The array buffer
     * @param {Boolean}     raw True to get the raw result, false to get the hex result
     *
     * @return {String|Array} The result
     */
    SparkMD5.ArrayBuffer.hash = function (arr, raw) {
        var hash = md51_array(new Uint8Array(arr));

        return !!raw ? hash : hex(hash);
    };

    return SparkMD5;
}));
