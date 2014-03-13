var levelup = require('levelup')
var Sublevel = require('level-sublevel')
var db = Sublevel(levelup('/does/not/matter', { db: require('memdown') }))
var _ = require('highland')
var Iterator = require('js-array-iterator')

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
  this.collection = db.sublevel(id)
}
Collection.prototype.count = function (fn) {
  _(this.collection.createKeyStream()).toArray(function (arr) {
    fn(null, arr.length)
  })
}
Collection.prototype.find = function () {
  return new Cursor(_(this.collection.createReadStream({valueEncoding : 'json'})))
}
Collection.prototype.save = function (document, fn) {
  var _id = _genUID()
  this.collection.put(_id, document, {valueEncoding : 'json'}, function (err) {
    fn(err, _.extend({"_id": _id}, document))
  })
}
Collection.prototype.update = function (query, update, fn) {
  var that = this
  var keys = Object.keys(query)
  var it = new Iterator(keys)
  it.on('next', function (el) {
    that.collection.get(query[el], {valueEncoding: 'json'}, function (err, doc) {
      keys.slice(1).forEach(function (k) {
        if (k.match(/\./)) {
          var ks = k.split('.')
          var lastref;
          doc[ks[0]].forEach(function (item) {
            if (eval("item."+k.split('.').splice(1).join('.')) == query[k]) {
              if (update.hasOwnProperty("$set")) {
                var upd = Object.keys(update.$set)[0] 
                eval("item"+upd.substring(upd.match(/\$\./).index+1) + "= "+update.$set[upd]) 
                fn(null, doc)
              }
            }
          })
        }
      })
    })
  }).on('end', function () {
  }).next()
}

function DB () {}
DB.prototype.collection = function (id) {
  return new Collection(id)
}

module.exports.open = function (path) {
  return new DB()
}
