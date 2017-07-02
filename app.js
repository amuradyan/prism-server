var fs = require('fs');
var https = require('https');
var privateKey  = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');
var express = require('express');

var app = express();

app.get('/', function (req, res) {
	res.send('Hovo')
});

var credentials = {key:privateKey, cert:certificate};
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(11111);