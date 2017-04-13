"use strict";
var express 	= require('express');
var bodyParser  = require('body-parser');
var	module 		= require('./module/module');
var app 		= express();
var port 		= process.env.PORT || 3005;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (request, response, next) {
	response.header("Access-Control-Allow-Origin",  "*");
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, token, Accept");
    response.header("Access-Control-Allow-Methods", "PUT");
	next();
});

app.put('/board', module.handleBoard);

app.listen(port);
console.log('WORKSHOP 2 - TEAM BADGER - Service IA listening on port ' + port + '...');