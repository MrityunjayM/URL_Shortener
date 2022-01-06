import { db } from "../index.js";
import { addURL, findById, deleteURL } from "../helpers.js";

export const renderHomePage = (req, res) => {
  if (req.session.urls) return res.render("index", { urls: req.session.urls });

  res.render("index");
};

export const generateShortLink = (req, res) => {
  let { url, slug } = req.body;
  let id = slug || generate_id();

  if (!url) {
    throw new Error("URL field is required...");
  }

  db.query(addURL(id, url, id), (err) => {
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
    }

    if (req.session.urls) {
      req.session.urls = [...req.session.urls, { url, id }];
      req.session.save(() =>
        res.render("index", { url, id, urls: req.session.urls })
      );
    } else {
      req.session.urls = [{ url, id }];
      res.render("index", { url, id, urls: req.session.urls });
    }
  });
};

export const redirectToOriginalUrl = (req, res) => {
  const { id } = req.params;

  db.query(findById(id), (err, link) => {
    if (err) return console.error(err);

    !(link.length <= 0)
      ? res.redirect(link[0].URL)
      : res
          .status(301)
          .render("index", { msg: "Invalid URL!!", urls: req.session.urls });
  });
};

export const _delete = (req, res) => {
  const { id } = req.params;

  db.query(deleteURL(id), (err) => {
    if (err) return console.error(err);

    req.session.urls = req.session.urls.filter((x) => x.id != id);
    req.session.save(() => res.redirect("/"));
  });
};
