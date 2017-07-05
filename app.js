var fs = require('fs');
var https = require('https');
var express = require('express');
var mongodb = require('mongodb');
var assert = require('assert');

var MongoClient = mongodb.MongoClient;
var prismDB;
var privateKey  = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');


var app = express();

app.get('/', function (req, res) {
	res.send('Hovo')
	prismDB.collection('prisms').insert({hovo:'Hovo'}, function (err, result) {
		console.log('insertion complete');
	})
});

var credentials = {key:privateKey, cert:certificate};
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(11111, function () {
	console.log('Started Prism HTTPS server on 11111');
});

var mongoURL = 'mongodb://localhost:27017/prism';

MongoClient.connect(mongoURL, function (err, db) {
	if(err == null){
		console.log('Connected to mongodb...');
		console.log(db);
		prismDB = db;
	}
})