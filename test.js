var test = require("tap").test
var mongolvl = require('./index')
var db = mongolvl.open('./mydb')

test("counting", function (t) {
  db.collection('semesters').save({ type: 1, num: 3 }, function (err) {
    db.collection('semesters').save({ type: 1, num: 2 }, function (err) {
      db.collection('semesters').save({ type: 1, num: 4 }, function (err) {
        db.collection('semesters').save({ type: 2, num: 1 }, function (err) {
          db.collection('semesters').find().sort({num: 1, type: 1}).toArray(function (err, sems) {
            t.equal(sems.length, 4);
            db.collection('semesters').count(function (err, count) {
              t.equal(count, 4);
              t.end()
            })
          }) 
        })
      })
    })
  })
})

test("2nd", function (t) {
  db.collection('students').save({
    name: "Johannes",
    choosing: [{
      partmodule: {
        "id" : "5319d4006ef972d80c782e95"
      }
    }]
  }, function (err, doc) {
    t.ok(doc, 'doc1 exists')
    db.collection('students').update({_id: doc._id, "choosing.partmodule.id":"5319d4006ef972d80c782e95"}, {$set: {"choosing.$.partmodule.raffled": true}}, function (err, doc) {
      t.ok(doc, 'doc2 exists')
      t.equal(doc.name, "Johannes")
      t.equal(doc.choosing[0].partmodule.raffled, true)
      t.end()
    })
  })
})
