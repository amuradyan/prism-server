var fs = require('fs');
var https = require('https');
var express = require('express');
var mongodb = require('mongodb');
var assert = require('assert');
var bodyParser = require('body-parser');

var prismDB;

// Express
var app = express();
app.use(bodyParser.json());

app.post('/facet', function(req, res) {
  prismDB.collection('facets').insert(req.body, function(err, res) {
    console.log(err == null ? res : err);
  });
});

// HTTPS server
var privateKey = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');
var credentials = { key: privateKey, cert: certificate };
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(11111, function() {
  console.log('Started Prism HTTPS server on 11111');
});

//MongoDB
var mongoURL = 'mongodb://localhost:27017/prism';
var MongoClient = mongodb.MongoClient;

MongoClient.connect(mongoURL, function(err, db) {
  if (err == null) {
    console.log('Connected to mongodb...');
    prismDB = db;
  }
});
