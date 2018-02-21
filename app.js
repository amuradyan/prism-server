const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const base64url = require('base64url');
const jwt = require('jsonwebtoken');
const debug = require('debug')('prism-server');

const secretStore = {
  amanda: 'Chancellor Palpatine is Darth Sidious'
};

const header = {
  typ: 'JWT',
  kid: 'amanda',
  alg: 'HS512'
};

const options = { 
  header: header, 
  expiresIn: '1h'
};

// const verified = jwt.verify(signedToken, secretStore['amanda'], { algorithms: 'HS512' });

let prismDB;

// Express
const app = express();
app.use(bodyParser.json());

// User router
const userRouter = express.Router();

userRouter.route('/users')
  .post(function (req, response) {
    const userSpec = req.body;
    debug('Registering a user', userSpec);
    var pUser = prismDB.collection('users').insert(userSpec, { fullResult: true });
    pUser.then(function (value) {
      debug(value);
      response.send(value);
    });
  });

userRouter.route('/users/:userId')
  .get(function (req, response) {
    const userSpec = req.body;
    debug('Fetching a user with ID : ' + req.params.userId);
    debug(userSpec);
    response.send('Fetching a user with ID : ' + req.params.userId);
  });

userRouter.route('/users/:userId')
  .delete(function (req, response) {
    const userSpec = req.body;
    debug('Deleting user with ID : ' + req.params.userId);
    debug(userSpec);
    response.send('Removed user with ID : ' + req.params.userId);
  });

// Prism router
const prismRouter = express.Router({ mergeParams: true });

prismRouter.route('/prisms')
  .get(function (req, response) {
    let URLs = null;
    if (req.query.URLs)
      URLs = JSON.parse(req.query.URLs);

    if (Array.isArray(URLs)) {
      debug('Fetching prisms for user ' + req.params.userId + ' for URLs ' + req.query.URLs);
      prismDB.collection('prisms').find({ url: { $in: URLs },  }).toArray(
        function (err, results) {
          debug(results);
          debug(err);
          response.send(results);
        });
    } else {
      debug('Fetching all prisms for user ' + req.params.userId);
      prismDB.collection('prisms').find({ url: URLs }).toArray(
        function (err, results) {
          debug(results);
          debug(err);
          response.send(results);
        });
    }
  });

prismRouter.route('/prisms')
  .put(function (req, response) {
    const prism = req.body;
    debug(prism);
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
    debug('deleting prism with ID: ' + req.params.prismId);
  });

prismRouter.route('/prisms')
  .delete(function (req, response) {
    debug('deleting prism all prisms for user : ' + req.params.userId);
  });

// Token router
const tokenRouter = express.Router();

tokenRouter.route('/tokens')
  .post(function (req, response) {
    const credentials = req.body;
    debug('loging in user with credentials : ', credentials);
    prismDB.collection('users').findOne({
        handle: credentials.handle,
        regPasswordHash: credentials.passwordHash
      }, function(err, doc){
        if(!err && doc){
            // FIXME: Dirty removal of user password hash field from Mongo doc
            delete doc.regPasswordHash;
            
            const payload = {
              iat: Date.now(),
              sub: doc['_id']
            };
                      
            const signedToken = jwt.sign(payload, secretStore['amanda'], options);
            
            response.send({
                msg: "Success",
                pld: doc,
                tkn: signedToken
              });
        } else {
          response.send({
            msg: "Failure"
          });
        }
      });
  });

// Handle router
const handleRouter = express.Router()

handleRouter.route('/handle/:handle')
  .get(function (req, response) {
    debug('checking for handle availability');
  });


userRouter.use('/users/:userId', prismRouter);
app.use('', userRouter);
app.use('', tokenRouter);
app.use('', handleRouter);

// HTTPS server
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

// httpsServer.listen(11111, function () {
//   debug('Started Prism HTTPS server on 11111');
// });

const httpServer = http.createServer(app).listen(1111, function(){
  debug('Started Prism HTTP server on 1111');
});

//MongoDB
const mongoURL = 'mongodb://localhost:27017/prism';
const MongoClient = mongodb.MongoClient;

MongoClient.connect(mongoURL, function (err, db) {
  if (err === null) {
    debug('Connected to MongoDB...');
    prismDB = db;
  }
});