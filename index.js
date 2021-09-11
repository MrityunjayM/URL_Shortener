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

// SEO tool ~ prerender.io
const prerender = require("prerender-node");

// PORT
const PORT = process.env["PORT"] || 5500;
// Expresss App Initialization...
const app = express();

// create connection to db...
const db = mysql.createPool({
  host: process.env["dbhost"],
  user: process.env["user"],
  password: process.env["pwd"],
  database: process.env["db"],
});

// query functions....
const addURL = (id, url, slug) => `INSERT INTO Links (URL, ShortedUrlsID, slug) VALUES ('${url}','${id}', '${slug}');`;
const findById = (id) => `SELECT * FROM Links WHERE ShortedUrlsID='${id}' LIMIT 1;`;
const findByUrl = (url) => `SELECT * FROM Links WHERE URL='${url}' LIMIT 1;`;
const deleteURL = (id) => `DELETE FROM Links WHERE ShortedUrlsID = '${id}';`;

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
    // store: new MySQLStore({ pool: db }),
  })
);

// Storing Locals variables...
app.use((req, res, next) => {
  res.locals.hostname = req.hostname;
  next();
});

// define Routes...
app.get("/", (req, res) => {
  if (req.session.urls) {
    return res.render("index", { urls: req.session.urls });
  }

  return res.render("index");
});

app.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query(findById(id), (err, link) => {
    if (err) throw err;

    !(link.length <= 0)
      ? res.redirect(link[0].URL)
      : res.render("index", { msg: "Invalid URL!!" });
  });
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

  if (!url) {
    return res
      .status(301)
      .render("index", { msg: "Please provide a valid URL." });
  }

  // db.query(findByUrl(url), (err, data) =>{
  //   if(data){
  //     let { ShortedUrlsID, url, slug } = data[0];
  //     return res.render('index', {id: ShortedUrlsID, url, slug});
  //   }
  // });

  db.query(addURL(id, url, slug), (err) => {
    if (err) {
      err.code == "ER_DUP_ENTRY"
        ? res.status(400).render("index", {
            msg: `A link is already generated using this suffix "${slug}", kindly prefer something deferent.`
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
});

// DELETE URL from Database...
app.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(deleteURL(id), (err) => {
    if (err) throw err;

    req.session.urls = req.session.urls.filter((x) => x.id != id);
    req.session.save(() => res.redirect("/"));
  });
});

// Server Init...
app.listen(PORT, () => console.log(`Server started on PORT: ${ PORT }`));

// Error 
process.on('uncaughtException', err => console.error(err));

//  END