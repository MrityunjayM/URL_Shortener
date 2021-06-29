// Import Modules...
const mysql = require('mysql');
const express = require('express');
const path = require('path')
const bodyParser = require('body-parser');
const pug = require('pug');

// PORT 
const PORT = 5000;
const app = express();

// create connection to db...
const db = mysql.createConnection({
	host: 'remotemysql.com',
	user: process.env['user'],
	password: process.env['pwd'],
	database: 'mlURVbCN6A'
});

db.connect((err) => err ? console.log(err) : console.log('Connected to Database 	Succesfully...')
);

// view engine set-up...
app.set('view engine', 'pug');
app.set('views', './Views');

// set-up middlewares..
app.use(express.static(path.join(__dirname, 'Views')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// define Routes...
app.get('/', (req, res) => {

	let query = `SELECT * FROM Links;`;
	db.query(query,(err,data) => {
		if(err) throw err;
		res.render('index', {data});
	});
});

app.get('/redirectlink/:id', (req, res) => {
	
	const ShortedUrlID = req.params.id;
	const query = `SELECT * FROM Links WHERE ShortedUrlsID='${ShortedUrlID}' LIMIT 1;`;

	db.query(query,(error, link) => {
		if (error) throw error;
		let redirectLink = link[0].URL;
		// console.log(redirectLink)
		res.redirect(redirectLink);
	});
});

app.post('/', (req, res) => {
	const originalURL = req.body.url;
	const date = new Date;
	const ShortedUrlID = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').substr(2, 10);

	const query = `INSERT INTO Links (URL, ShortedUrlsID) VALUES ('${originalURL}','${ShortedUrlID}');`;

	db.query(query, err => {
		if(err) console.log(err)
	});

	let query1 = `SELECT * FROM Links;`;
	db.query(query1,(err,data) => {
		if(err) throw err;
		res.render('index', { url: originalURL, id: ShortedUrlID , data});
	});
});

// server Init...
app.listen(PORT, () => {
	console.log(`Server running on ${PORT}`)
});