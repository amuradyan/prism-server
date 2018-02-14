const fs = require('fs');
const https = require('https');
const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');

var prismDB;

// Express
const app = express();
app.use(bodyParser.json());

// User router
const userRouter = express.Router({ mergeParams: true });

userRouter.route('/users')
  .post(function (req, response) {
    const userSpec = req.body;
    console.log('Registering a user');
    console.log(userSpec);
    response.send('Registration success!');
  });

userRouter.route('/users/:userId')
  .get(function (req, response) {
    const userSpec = req.body;
    console.log('Fetching a user with ID : ' + req.params.userId);
    console.log(userSpec);
    response.send('Fetching a user with ID : ' + req.params.userId);
  });

userRouter.route('/users/:userId')
  .delete(function (req, response) {
    const userSpec = req.body;
    console.log('Deleting user with ID : ' + req.params.userId);
    console.log(userSpec);
    response.send('Removed user with ID : ' + req.params.userId);
  });

// Prism router
const prismRouter = express.Router({ mergeParams: true });

prismRouter.route('/prisms')
  .get(function (req, response) {
    const URLs = null;
    if(req.query.URLs)
       URLs = JSON.parse(req.query.URLs);

    if (Array.isArray(URLs)) {
      console.log('Fetching prisms for user ' + req.params.userId + ' for URLs ' + req.query.URLs);
      prismDB.collection('prisms').find({ url: { $in: URLs } }).toArray(
        function (err, results) {
          console.log(results);
          console.log(err);
          response.send(results);
        });
    } else {
      console.log('Fetching all prisms for user ' + req.params.userId);
      prismDB.collection('prisms').find({ url: URLs }).toArray(
        function (err, results) {
          console.log(results);
          console.log(err);
          response.send(results);
        });
    }
  });

prismRouter.route('/prisms')
  .put(function (req, response) {
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

prismRouter.route('/prisms/:prismId')
  .delete(function (req, response) {
    console.log('deleting prism with ID: ' + req.params.prismId);
  });

prismRouter.route('/prisms')
  .delete(function (req, response) {
    console.log('deleting prism all prisms for user : ' + req.params.userId);
  });

// Token router
const tokenRouter = express.Router({ mergeParams: true });

tokenRouter.route('/tokens')
  .post(function (req, response) {
    const credentials = req.body;
    console.log('login');
    console.log(credentials);
    response.send('login success');
  });

// HTTPS server
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(11111, function () {
  console.log('Started Prism HTTPS server on 11111');
});

userRouter.use('/users/:userId', prismRouter);
app.use('', userRouter);
app.use('', tokenRouter);

//MongoDB
const mongoURL = 'mongodb://localhost:27017/prism';
const MongoClient = mongodb.MongoClient;

MongoClient.connect(mongoURL, function (err, db) {
  if (err === null) {
    console.log('Connected to MongoDB...');
    prismDB = db;
  }
});