"use strict";
var express = require('express');
var bodyParser  = require('body-parser');


var	module = require('./module/module');

var app = express();
var port = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, token, Accept");
  next();
});


app.options('/api/*', function (request, response, next) {
    response.header("Access-Control-Allow-Methods", "GET");
    response.send();
});


app.get('/connect/:groupName', module.connexion);
app.get('/play/:x/:y/idJoueur', module.play);
app.get('/turn/:idJoueur', module.turn);


app.listen(port);
console.log('SERVICE WORKSHOP 2 - Game Server - Listening on port ' + port + '...');