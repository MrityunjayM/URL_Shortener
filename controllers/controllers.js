import { db } from "../index.js"
import { addURL, findById, deleteURL, generate_id } from "../helpers.js"

export const renderHomePage = (req, res) => {
  if (req.session.urls) return res.status(200).render("index")

  return res.status(200).render("index")
}

export const generateShortLink = (req, res) => {
  let { url, slug } = req.body
  let id = slug || generate_id()

  if (!url) {
    throw new Error("Please Enter a valid URL.")
  }

  db.query(addURL(id, url, id /* this is slug not actual id*/), (err) => {
    if (err) {
      return err.code == "ER_DUP_ENTRY"
        ? res.status(400).render("index", {
            msg: `A link is already generated using this suffix "${slug}", kindly prefer something different.`,
          })
        : res.status(500).render("index", {
            msg: "Oops.., Something went wrong on server.",
          })
    }

    if (req.session.urls) {
      req.session.urls = [...req.session.urls, { url, id }]
    } else {
      req.session.urls = [{ url, id }]
    }
    return req.session.save(() => res.render("index", { url, id }))
  })
}

export const redirectToOriginalUrl = (req, res) => {
  const { id } = req.params

  db.query(findById(id), (err, link) => {
    if (err) return console.error(err)

    return !(link.length <= 0)
      ? res.redirect(link[0].URL)
      : res.status(301).render("index", { msg: "Invalid URL!!" })
  })
}

export const _delete = (req, res) => {
  const { id } = req.params

  db.query(deleteURL(id), (err) => {
    if (err) return console.error(err)

    req.session.urls = req.session.urls.filter((x) => x.id != id)
    return req.session.save(() => res.redirect("/"))
  })
}
