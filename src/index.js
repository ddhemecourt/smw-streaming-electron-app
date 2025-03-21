console.log("INDEXJS LOG");
// require("./css/style.css");
// require("@fortawesome/fontawesome-free/css/all.css");
const Modal = require("./components/Modal");

document.querySelector("#go-to-smw-control").addEventListener("click", (e) => {
  e.preventDefault();
  location.href = "smw_control.html";
});

document
  .querySelector("#go-to-direct-pdw-send")
  .addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "direct_pdw_send.html";
  });

document
  .querySelector("#go-to-rt-pdw-controller")
  .addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "rt_pdw_controller.html";
  });

document
  .querySelector("#go-to-rt-adw-controller")
  .addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "rt_adw_controller.html";
  });
