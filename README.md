#leveldbmongodb

A simple leveldb mongodb wrapper

##THIS IS IN EARLY DEVELOPMENT!

And I only developed it because *I* needed it for a project that means: it is not *100%* ready for an other production use. But, feel free to use and start hacking on it `;-)`. Contributions are welcome.

##Documentation

Actually you should checkout the `test.js` file, most of the stuff is tested there and you can see the usage.

```javascript
var mongolvl = require('leveldbmongodb')

// opening a DB connection
var db = mongolvl.open('./test_db')

// inserting
db.collection('test').insert({test: 1}, function (err, document) {})

// finding (by id)
db.collection('test').findOne({_id: '10a78485a68786186e852a88'}, function (err, doc) {})
  
// saving
db.collection('test').save(aDocumentAMadeBefore, function (err, doc) {})

// find one (by a query)
db.collection('test').findOne({ttt: 1}, function (err, doc) {})
```

##License: MIT of Cause

MIT ftw.
