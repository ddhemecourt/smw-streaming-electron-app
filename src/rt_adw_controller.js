const Modal = require("./components/Modal");
const AdwForm = require("./components/AdwForm");
const AdwList = require("./components/AdwList");

new Modal("#add-adw-btn");
const adwForm = new AdwForm();
adwForm.render();

new AdwList();
