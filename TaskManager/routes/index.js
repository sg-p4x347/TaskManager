'use strict';
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var git = require('nodegit');
/* GET home page. */
router.get('/', function (req, res) {
	res.render('index');
});
/* Upload data */
router.post('/update', (req, res) => {
	fs.writeFile('data.json', JSON.stringify(req.body), (err) => { });
	// make a commit
	git.Repository.open(path.resolve('..')).then(function (repo) {
		let signature = git.Signature.now('Gage Coates', 'sg.p4x347@gmail.com');
		git.Commit.create(repo, 'HEAD', signature, signature, null, "A Change was made to data.json").then(oid => {
			res.send(oid.tostrS());
		});
	}).catch((reason) => {
		console.log(reason);
	});
});
/* Download data */
router.get('/get', (req, res) => {
	fs.readFile('data.json',(err,data) => {
		res.send(data.toString());
	});
});
module.exports = router;