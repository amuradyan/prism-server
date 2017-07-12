const fs = require('fs');
const https = require('https');
const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');

var prismDB;

// Express
const app = express();
app.use(bodyParser.json());

app.route('/prism')
  .get(function(req, response) {
    console.log('Fetching all prisms for ' + req.query.URLs);
    const crit = JSON.parse(req.query.URLs);

    if (Array.isArray(crit)) {
      prismDB.collection('prisms').find({ url: { $in: crit } }).toArray(
        function(err, results) {
          console.log(results);
          console.log(err);
          response.send(results);
        });
    } else {
      prismDB.collection('prisms').find({ url: crit }).toArray(
        function(err, results) {
          console.log(results);
          console.log(err);
          response.send(results);
        });
    }
  })
  .put(function(req, response) {
    const prism = req.body;
    console.log(prism);
    prismDB.collection('prisms')
      .update({ url: prism.url }, {
        // $addToSet: {
        //   facets: { $each: prism.facets },
        //   topics: { $each: prism.topics }
        // },
        $set: {
          facets: prism.facets,
          topics: prism.topics,
          creationDate: prism.creationDate
        }
      }, { upsert: true });
  });

// HTTPS server
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(11111, function() {
  console.log('Started Prism HTTPS server on 11111');
});

//MongoDB
const mongoURL = 'mongodb://localhost:27017/prism';
const MongoClient = mongodb.MongoClient;

MongoClient.connect(mongoURL, function(err, db) {
  if (err === null) {
    console.log('Connected to MongoDB...');
    prismDB = db;
  }
});

// Used for tests via Postman, since I can't find a
// way to import the SSL certificate into it/chrome
// var http = require('http');
// const httpServer = http.createServer(app);

// httpServer.listen(1111, function() {
//   console.log('Started Prism HTTP server on 1111');
// });
