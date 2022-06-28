// Rand_ID_Generator...
export const generate_id = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z0-9]/gi, "")
    .slice(2, 8)

// query functions....
export const addURL = (id, url, slug) =>
  `INSERT INTO Links (URL, ShortedUrlsID, slug) 
                VALUES ('${url}','${id}', '${slug}');`

export const findById = (id) =>
  `SELECT * FROM Links 
            WHERE ShortedUrlsID='${id}' LIMIT 1;`

export const deleteURL = (id) =>
  `DELETE FROM Links 
          WHERE ShortedUrlsID = '${id}';`
