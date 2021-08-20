// Import Modules...
const express = require('express');
const cookieParser = require("cookie-parser");
// const helmet = require('helmet');
const compression = require("compression");
const path = require("path");
const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("connect-mysql")(session);
const methodOverride = require("method-override");

// const fetch = require('node-fetch');

// SEO tool ~ prerender.io
const prerender = require("prerender-node");

// PORT
const PORT = process.env["PORT"];
// Expresss App Initialization...
const app = express();

// create connection to db...
const db = mysql.createPool({
  host: process.env["dbhost"],
  user: process.env["user"],
  password: process.env["pwd"],
  database: process.env["db"],
});

// view engine set-up...
app.set("view engine", "pug");
app.set("views", "./Views");

// Serving static files from 'Views' FOLDER
app.use(express.static(path.join(__dirname, "Views")));

// SEO Middleware...
app.use(prerender.set("prerenderToken", "W0VDYrHkzoSOK81LX0c4"));

// set-up middlewares...
// app.use(helmet()); // Security Middleware
app.use(compression());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "thissecretcannnotberevealed",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      expires: 1000 * 60 * 60 * 24 * 3,
    },
    store: new MySQLStore({ pool: db }),
  })
);

// Storing Locals variables...
app.use((req, res, next) => {
  res.locals.hostname = req.hostname;
  next();
});

// define Routes...
app.get("/", (req, res) => {
  // let sess = req.session;
  // const query = `SELECT * FROM Links;`;
  // db.query(query, (err, data) => {
  // 	if (err) throw err;
  // });
  if (req.session.urls) {
    return res.render("index", { urls: req.session.urls });
  } else {
    return res.render("index");
  }
});

// app.get('/awake', (req, res) => {
// 	let response = {
// 		status: 'OK'
// 	};

// 	console.log(req.route.path);
// 	res.status(200).json(response);
// });

app.get("/:id", (req, res) => {
  const { id } = req.params;

  const query = `SELECT * FROM Links WHERE ShortedUrlsID='${id}' LIMIT 1;`;

  id != "favicon.ico"
    ? db.query(query, (err, link) => {
        if (err) throw err;
		console.log(link);
        link[0].URL
          ? res.redirect(link[0].URL)
          : res.render("index", { msg: "Invalid URL!!" });
      })
    : res.redirect("/");
});

// GENERATE Shorten URL and STORE in Database...
app.post("/", (req, res) => {
  let { url, slug } = req.body;
  let id = !slug
    ? Math.random()
        .toString(36)
        .replace(/[^a-z0-9]/gi, "")
        .substr(2, 8)
    : slug;

  if (url) {
    const query = `INSERT INTO Links (URL, ShortedUrlsID, slug) VALUES ('${url}','${id}', '${slug}');`;

    db.query(query, (err, result) => {
      if (err) {
        err.code == "ER_DUP_ENTRY"
          ? res.status(400).render("index", {
              msg: `A link is already generated using this suffix "${slug}", kindly prefer somthing deferent...`,
            })
          : res.status(500).send(`
					<center>
						<h1> Something went wrong on server, </h1>
						<h4> sorry for your Inconvenience! </h4>
						<h4>Do visit again later... </h4>
						<h3> <a href="/"> Go Back </a> </h3>
					</center>
				`);
        return;
      }

      if (req.session.urls) {
        req.session.urls = [...req.session.urls, { url, id }];
        req.session.save(() =>
          res.render("index", { url, id, urls: req.session.urls })
        );
      } else {
        req.session.urls = [{ url, id }];
        return res.render("index", { url, id, urls: req.session.urls });
      }
    });
  } else {
    return res.status(301).render("index", {
      msg: "Please provide a valid URL.",
    });
  }
});

// DELETE URL from Database...
app.delete("/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM Links WHERE ShortedUrlsID = '${id}';`;

  db.query(query, (err) => {
    if (err) throw err;

    delete req.session.urls.find((x) => x.id == id);
    req.session.save(() => res.redirect("/"));
  });
});

// Ping to keep the repo awake...
// setInterval(() => {
// 	fetch('https://surl.mrityunjay.xyz/awake')
// 	.then(result => result.json())
// 	.then(result => {
// 		console.log(result)
// 	}, e => console.error(e))
// 	.catch(e => console.error(e))
// },1000*60*25);

// Server Init...
app.listen(PORT, () => console.log(`Server started on PORT: ${ PORT }`));

// Error 
process.on('uncaughtException', err => console.error(err));

//  END