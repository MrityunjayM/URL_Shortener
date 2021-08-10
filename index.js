// Import Modules...
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('connect-mysql')(session);
const pug = require('pug');
const methodOverride = require('method-override');
const fetch = require('node-fetch');

// SEO tool ~ prerender.io
const prerender = require('prerender-node');

// PORT 
const PORT = process.env['PORT'];
// Expresss App Initialization...
const app = express();

// create connection to db...
const db = mysql.createPool({
	host: process.env['dbhost'],
	user: process.env['user'],
	password: process.env['pwd'],
	database: process.env['db']
});

// SessionStore options
const options = {
	secret: 'thissecretcannnotberevealed',
	pool: db
}

const sessionStore = new MySQLStore(options)

// view engine set-up...
app.set('view engine', 'pug');
app.set('views', './Views');

// SEO Middleware...
app.use(prerender.set('prerenderToken','W0VDYrHkzoSOK81LX0c4'));
// set-up middlewares..
app.use(express.static(path.join(__dirname, 'Views')));
app.use(session({
	secret: 'thissecretcannnotberevealed',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: false,
		secure: true,
		maxAge: 1000 * 60 * 60 * 24 * 3,
		expires: 1000 * 60 * 60 * 24 * 3
	},
	store: sessionStore
}, db))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// app.use((req, res, next) => {
//   res.locals.session= {name :"MRITYUNJAY"}
// 	next();
// });

// define Routes...
app.get('/', (req, res) => {
	let sess = req.session;
	const query = `SELECT * FROM Links;`;
	db.query(query, (err, data) => {
		if (err) throw err;

		// console.log(sess);
		res.render('index', {data: req.session.data});
	});
});

app.get('/awake', (req, res) => {
	let response = {
		status: 'OK'
	};

	console.log(req.route.path);
	res.status(200).json(response);
});

app.get('/:id', (req, res) => {

	const ShortedUrlID = req.params.id;

	const query = `SELECT * FROM Links WHERE ShortedUrlsID='${ShortedUrlID}' LIMIT 1;`;
	
	ShortedUrlID != 'favicon.ico' ?
		db.query(query, (err, link) => {
			if (err) throw err;
			res.redirect(link[0].URL);
		})
	: res.redirect('/')

});

app.post('/', (req, res) => {

	let host = req.hostname;

	let sess = req.session;
	let originalURL = req.body.url;
	let ShortedUrlID = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').substr(2, 10);

	if (originalURL) {
		const query = `INSERT INTO Links (URL, ShortedUrlsID) VALUES ('${originalURL}','${ShortedUrlID}');`;

		// console.log(query)

		db.query(query, (err, result, fields) => {

			if (err) {
				res.status(500)
				.send('<center><h1> Something went wrong on server,</h1><h4> sorry for your Inconvenience!</h4><h4>Do visit again later...</h4><h3><a href="/">Go Back</a></h3></center>')
			}

			if(sess.urls){
				sess.urls += [{url: originalURL, id : ShortedUrlID}];
			} else {
				sess.urls= [{url: originalURL, id : ShortedUrlID}]
			}

			// console.log('Not available');
			res.render('index', { host, url: originalURL, id: ShortedUrlID });
		});

	} else {
		res
		.status(301)
		.json({ 
			"Err-Type": "DO Fill the input form..!!!!" 
		});
	}
});

app.delete('/:id', (req, res) => {
	const ShortedUrlID = req.params.id;
	const query = `DELETE FROM Links WHERE ShortedUrlsID = '${ShortedUrlID}';`;

	db.query(query, (err, link) => {
		if (err) throw err;
		res.redirect('/');
	});
});

// Ping to keep the repo awake...
setInterval(() => {
	fetch('https://surl.mrityunjay.xyz/awake')
	.then(result => result.json())
	.then(result => {
		console.log(result)
	}, e => console.error(e))
	.catch(e => console.error(e))
},1000*60*25)

// Server Init...
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// Error 
process.on('uncaughtException', err => console.error(err));