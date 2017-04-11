"use strict";
var express 	= require('express');
var restclient 	= require('node-rest-client').Client;
var bodyParser  = require('body-parser');
var	module 		= require('./module/module');

var httpArgs = { headers: { "Content-Type": "application/json" } };
var client = new restclient();
var app = express();
var port = process.env.PORT || 3001;
var gameServerUrl = "http://localhost:3000/";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port);
console.log('SERVICE WORKSHOP 2 IA Server - Listening on port ' + port + '...');


// Connexion au serveur de jeu
function connect() {
	// On tente de se connecter au serveur de jeu
	client.get(gameServerUrl + "/connect/groupName", httpArgs, function(data, respo) {
		if (data.code == 200) {
		}
	}).on('error', function(error) {
		console.log(error);
	});
}

// Appel le service permettant de placer un pion
function play(x, y) {
// On tente de se connecter au serveur de jeu
	client.get(gameServerUrl + "/play/x/y/idJoueur", httpArgs, function(data, respo) {
		if (data.code == 200) {
		}
	}).on('error', function(error) {
		console.log(error);
	});
}

// Appel le service permettant de placer un pion
function turn(x, y) {
// On tente de se connecter au serveur de jeu
	client.get(gameServerUrl + "/turn/idJoueur", httpArgs, function(data, respo) {
		if (data.code == 200) {
		}
	}).on('error', function(error) {
		console.log(error);
	});
}

function launcheGame() {

}();