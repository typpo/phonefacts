var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
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

var stripe = require('stripe')(
  require('./config.js').STRIPE_SK
);

var phoneFacts;
MongoClient.connect('mongodb://127.0.0.1:27017/PhoneFacts', function(err, db) {
  if (err) throw err;
    phoneFacts = db.collection('PhoneFacts');
});

app.get('/', function(req, res) {
  serveFile('index.html', res);
});


app.get('/subscribe', function(req, res) {
  var newdoc = {
    user: req.query.user,
    friendNumber: req.query.friendNumber,
    collectionId : req.query.collectionId
  };
  phoneFacts.find(newdoc).toArray(function(err, docs) {
    if (docs.length > 0) {
      res.send({success: false, error: 'duplicate'});
      return;
    }
    phoneFacts.insert(newdoc, function(err, docs) {
      res.send({success: true});
    });
  });
});

app.get('/pay', function (req, res) {
  stripe.charges.create({
    amount: req.query.amount,
    currency: 'usd',
    source: req.query.tok,
    description: 'Charge for cat facts - ' + req.query.email,
  }, function(err, charge) {
    if (err) {
      console.log(err, charge);
      res.send('error');
      return;
    }
    res.send('ok');
  });
});

function serveFile(path, res) {
  fs.readFile(path, function (err, data){
    res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
    res.write(data);
    res.end();
  });
}

var server = app.listen(8111, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
