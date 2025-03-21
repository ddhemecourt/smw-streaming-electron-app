const Modal = require("./components/Modal");
const SmwForm = require("./components/SmwForm");
const SmwList = require("./components/SmwList");

console.log("SMW Control");

new Modal("#add-smw-btn");
const smwForm = new SmwForm();
smwForm.render();

// new SmwList();
