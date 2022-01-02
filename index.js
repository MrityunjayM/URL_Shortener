// enviromental variable config...
// import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Import Modules...
import express from "express";
import cookieParser from "cookie-parser";
// import helmet from 'helmet'; // Will be enabled in future...
import compression from "compression";
import mysql from "mysql";
import session from "express-session";
import connectMysql from "connect-mysql";
const MySQLStore = connectMysql(session);
import methodOverride from "method-override";
/* --------------------------------------------------------------------------- */
// SEO tool ~ prerender.io
import prerender from "prerender-node";
/* --------------------------------------------------------------------------- */
// PORT
const PORT = process.env.PORT;

// Expresss App Initialization...
const app = express();

// create connection to db...
const db = mysql.createPool({
  host: process.env["dbhost"],
  user: process.env["user"],
  password: process.env["pwd"],
  database: process.env["db"],
});

// Rand_ID_Generator...
const generate_id = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z0-9]/gi, "")
    .slice(2, 8);

// query functions....
const addURL = (id, url, slug) =>
  `INSERT INTO Links (URL, ShortedUrlsID, slug) VALUES ('${url}','${id}', '${slug}');`;
const findById = (id) =>
  `SELECT * FROM Links WHERE ShortedUrlsID='${id}' LIMIT 1;`;
// const findByUrl = (url) => `SELECT * FROM Links WHERE URL='${url}' LIMIT 1;`;
const deleteURL = (id) => `DELETE FROM Links WHERE ShortedUrlsID = '${id}';`;

// view engine set-up...
app.set("view engine", "pug");
app.set("views", "./views");

// Serving static files from --> 'public'
app.use(express.static("./public"));

// SEO Middleware...
app.use(prerender.set("prerenderToken", process.env.PRERENDER_TOCKEN));

// set-up middlewares...
// app.use(helmet()); // Security Middleware
app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(
  session({
    secret: process.env.SESS_SECRET,
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

// Setting Local variable...
app.use((req, res, next) => {
  res.locals.hostname = req.hostname;
  next();
});

// define Routes...
app.get("/", (req, res) => {
  if (req.session.urls) return res.render("index", { urls: req.session.urls });

  return res.render("index");
});

app.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query(findById(id), (err, link) => {
    if (err) return console.error(err);

    !(link.length <= 0)
      ? res.redirect(link[0].URL)
      : res
          .status(301)
          .render("index", { msg: "Invalid URL!!", urls: req.session.urls });
  });
});

app.post("/api/fetch", (req, res) => {
  console.log(req.body);

  res.status(201).json(req.body);
});

// GENERATE Shorten URL and STORE in Database...
app.post("/", (req, res) => {
  let { url, slug } = req.body;
  let id = slug || generate_id();
  console.log(id, url, slug);
  
  if (!url) {
    throw new Error("URL field is required...");
  }

  db.query(addURL(id, url, slug), (err) => {
    if (err) {
      err.code == "ER_DUP_ENTRY"
        ? res.status(400).render("index", {
            msg: `A link is already generated using this suffix "${slug}", kindly prefer something different.`,
            urls: req.session.urls,
          })
        : res.status(500).render("index", {
            msg: "Oops.., Something went wrong on server.",
            urls: req.session.urls,
          });
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
    if (err) return console.error(err);

    req.session.urls = req.session.urls.filter((x) => x.id != id);
    req.session.save(() => res.redirect("/"));
  });
});

app.use((err, req, res, next) => {
  // console.error(err.message);
  res.status(400).render("index", { err: err.message, urls: req.session.urls });
});

// Server Init...
app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));

// Error
process.on("uncaughtException", (err) => console.error(err));

//  END