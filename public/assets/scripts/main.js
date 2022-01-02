function check_prefix(text) {
  if (text && !text.includes("http://") && !text.includes("https://"))
    url.value = `http://${text.trim()}`;
}

let url = document.querySelector("#inpurl");
url.addEventListener("change", (e) => check_prefix(e.target.value));

// const call_fetch = () => {
//   body = JSON.stringify({
//     first_name: "Mrityunjay",
//     last_name: "Mishra",
//   });

//   options = {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body,
//   };

//   fetch("/api/fetch", options)
//     .then((data) => data.json())
//     .then((res) => console.log(res))
//     .catch((err) => console.log(err));
// };
