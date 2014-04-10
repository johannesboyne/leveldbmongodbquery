var mongolvl = require('./index'),
assert = require('assert')

var db = mongolvl.open('./test_db')

// inserting
db.collection('test').insert({test: 1}, function (err, document) {
  assert.equal(document.test, 1)
  
  // finding
  db.collection('test').findOne({_id: document._id}, function (err, doc) {
    assert.equal(doc.test, 1)

    doc.test = 2
    doc.ttt = 1
    doc.properObject = { inside: true }

    // saving
    db.collection('test').save(doc, function (err, docdoc) {
      assert.equal(docdoc.test, 2)
      
      // find one
      db.collection('test').findOne({ttt: 1}, function (err, doc) {
        assert.equal(doc.test, 2)
      })
      // find one proper query
      db.collection('test').findOne({properObject: { inside: true }}, function (err, doc) {
        assert.equal(doc.test, 2)
        assert.equal(doc.properObject.inside, true)
      })

      // find and get back a cursor, it even supports toArray!
      db.collection('test').find().toArray(function (err, array) {
        assert.equal(array instanceof Array, true)
      })
    })
  })
})
