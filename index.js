var levelup = require('levelup'),
Sublevel = require('level-sublevel'),
db,
_ = require('highland');

function _genUID () {
  var _rnds = new Array(16)
  for (var j = 0, r; j < 16; j++) {
    if ((j & 0x03) === 0) r = Math.random() * 0x100000000;
    _rnds[j] = r >>> ((j & 0x03) << 3) & 0xff;
  }
  return _rnds.map(function (k) { return k.toString(16) }).join('').substr(0,24)
}

function Cursor (readstream) {
  this.rs = readstream
}
Cursor.prototype.toArray = function (fn) {
  var that = this
  if (this.sortingObj) {
    this.rs.toArray(function (arr) {
      arr = arr.map(function (a) {
        return _.extend({"_id": a.key}, a.value)
      })
      Object.keys(that.sortingObj).forEach(function (key) {
        arr = arr.sort(function (a,b) { return a[key] - b[key] })
      })
      fn(null, arr)
    })
  } else {
    this.rs.toArray(function (arr) {
      fn(null, arr.map(function (a) {
        return _.extend({"_id": a.key}, a.value)
      }))
    })
  }
}
Cursor.prototype.sort = function (sortingObj) {
  this.sortingObj = sortingObj; 
  return this 
}

function Collection (id) {
  this.collection = this._c = db.sublevel(id)
}
Collection.prototype.count = function (fn) {
  _(this.collection.createKeyStream()).toArray(function (arr) {
    fn(null, arr.length)
  })
}
Collection.prototype.find = function () {
  return new Cursor(_(this.collection.createReadStream({valueEncoding : 'json'})))
}
Collection.prototype.findOne = function (query, fn) {
  if (query.hasOwnProperty('_id'))
    return this.collection.get(query._id, function (err, doc) { fn(err, JSON.parse(doc)) })

  var _stream = this.collection.createReadStream()
  _stream.on('data', function (kv) {
    if (kv.value.replace(/{|}/gi, '').match(JSON.stringify(query).replace(/{|}/gi, ''))) {
      if (fn)
        fn(null, JSON.parse(kv.value))
      fn = null
    }
  }).on('close', function () {
    if (fn)
      fn(null, null)
  })
}
Collection.prototype.save = function (document, fn) {
  var _id = document._id ? document._id : _genUID()
  _.extend({"_id": _id}, document)

  this.collection.put(_id, document, {valueEncoding : 'json'}, function (err) {
    if (typeof fn === 'function') fn(err, document)
  })
}
Collection.prototype.insert = function (document, fn) {
  if (document.hasOwnProperty('_id'))
    document._id = null
  this.save(document, fn)
}
Collection.prototype.remove = function (query, fn) {
  var that = this
  if (typeof query === 'function') {
    fn = query
    _(this.collection.createKeyStream()).toArray(function (arr) {
      that.collection.batch(arr.map(function (a) { return { type: 'del', key: a } }))
      fn(null)
    })
  }
}

function DB (id) {
  db = Sublevel(levelup('./'+id))
}
DB.prototype.collection = function (id) {
  return new Collection(id)
}

module.exports.open = function (path) {
  return new DB(path)
}

function ObjectID (id) { this.uid = id ? id : _genUID() }
ObjectID.prototype.toString = function () { return this.uid }
ObjectID.prototype.inspect = ObjectID.prototype.toString

module.exports.ObjectID = ObjectID

