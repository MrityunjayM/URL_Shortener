module.exports = addURL = (id, url, slug) => `INSERT INTO Links (URL, ShortedUrlsID, slug) VALUES ('${url}','${id}', '${slug}');`;
module.exports = findURL = (id) => `SELECT * FROM Links WHERE ShortedUrlsID='${id}' LIMIT 1;`;
module.exports = deleteURL = (id) => `DELETE FROM Links WHERE ShortedUrlsID = '${id}';`;