// Import Modules...
import express from "express";
// import helmet from 'helmet'; // Will be enabled in future...
import mysql from "mysql";
import compression from "compression";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import session from "express-session";
import connectMysql from "connect-mysql";
const MySQLStore = connectMysql(session);
/* --------------------------------------------------------------------------- */
// SEO tool ~ prerender.io
import prerender from "prerender-node";
/* --------------------------------------------------------------------------- */

import {
  generateShortLink,
  redirectToOriginalUrl,
  renderHomePage,
  _delete,
} from "./controllers/controllers.js";
// PORT
const PORT = process.env.PORT;
// Expresss app initialization...
const app = express();
// create connection to db...
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.USER,
  password: process.env.KEY,
  database: process.env.DB,
});

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
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      expires: 1000 * 60 * 60 * 24 * 3,
    },
    store: new MySQLStore({ pool: db }),
  })
);
// Setting local variable...
app.use((req, res, next) => {
  res.locals.hostname = req.hostname;
  next();
});
// Define ROUTES...
// @ / GET
app.get("/", renderHomePage);
// @ / POST
app.post("/", generateShortLink);
// @ /:id POST
app.get("/:id", redirectToOriginalUrl);
// @ /id DELETE
app.delete("/:id", _delete);
// ERROR handeler...{to be fixed}
app.use((err, req, res, next) => {
  res.status(500).render("index", { err: err.message, urls: req.session.urls });
});
// Server Init...
app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
// Error Exceptions...
process.on("uncaughtException", (err) => {
  console.error(err.name, "->", err.message);
  process.exit(0);
});
//  END