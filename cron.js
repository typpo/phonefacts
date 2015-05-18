var fs = require('fs');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

// Load all facts
// to access: collections[collectionId][index]
var collections = {}
var filenames = fs.readdirSync(path.resolve(__dirname, 'collections'));
filenames.forEach(function(filename) {
  console.log('Loading ' + filename);
  var text = fs.readFileSync('collections/' + filename) + '';
  lines = text.match(/[^\r\n]+/g);
  collections[filename] = lines;
});

MongoClient.connect('mongodb://127.0.0.1:27017/PhoneFacts', function(err, db) {
  if (err) throw err;
  phoneFacts = db.collection('PhoneFacts');
  phoneFacts.find().toArray(function(err, docs) {
    docs.forEach(function(doc) {
      if (doc.collectionId in collections && doc.factIndex != undefined) {
        console.log('Should send fact ' + collections[doc.collectionId][doc.factIndex]
          + " to number " + doc.friendNumber);
      } else {
        console.log('Found invalid subscription user ' + doc.user + ' collection id '
          + doc.collectionId + ' fact index ' + doc.factIndex);
      }
    });
  });
});
