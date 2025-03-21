const SmwsApi = require("../services/smwsApi");
const SmwForm = require("./SmwForm");

class SmwList {
  constructor() {
    this._smwListEl = document.querySelector("#smw-list");
    this._smws = [];
    this.getSmws();
    this._form = document.querySelector("#form-modal");
    this._updatingID = "";
  }

  addEventListeners() {
    this._smwListEl.addEventListener("click", (e) => {
      console.log(e.target);
      if (e.target.classList.contains("fa-times")) {
        e.stopImmediatePropagation();
        const smwID = e.target.parentElement.parentElement.dataset.id;
        this.deleteSmw(smwID);
      } else if (e.target.classList.contains("fa-edit")) {
        e.stopImmediatePropagation();
        this._updatingID = e.target.parentElement.parentElement.dataset.id;
        this.updateSmwForm();
        document.dispatchEvent(new Event("openmodal"));
      }
    });
    document.querySelector("#add-smw-btn").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      this._updatingID = "";
      this.addSmwFieldReset();
      document.dispatchEvent(new Event("openmodal"));
    });
  }

  async getSmws() {
    try {
      const res = await SmwsApi.getSmws();
      console.log(res);
      this._smws = res.data.data;
      this.render();
    } catch (error) {
      console.log(error);
    }
  }

  async deleteSmw(smwID) {
    try {
      //Delete from server
      const res = await SmwsApi.deleteSmw(smwID);
      this._smws.filter((smw) => smw._id !== smwID);
      this.getSmws();
    } catch (error) {
      alert("You cannot delete this resource");
    }
  }

  async updateOrAddSmw(smw) {
    if (this._updatingID === "") {
      const newSmw = await SmwsApi.addSmw(smw);
      await this.addSmwToList(newSmw.data.data);
      // this.getSmwStatus(smw);
    } else {
      console.log("UPDATING SMW");
      const updatedSmw = await this.updateSmw(smw);
      // this.getSmwStatus(smw);
      this._updatingID = "";
    }
  }

  addSmwFieldReset() {
    this._form.querySelector("#needs-pdw-streaming").checked = false;
    this._form.querySelector("#needs-adw-streaming").checked = false;
    this._form.querySelector("#smw_ip").value = "192.168.1.55";
    this._form.querySelector("#try-connect-status").innerHTML = "Status: ";
    this._form.querySelector("#port-count").innerHTML = "RF Port Count: ";
    this._form.querySelector("#pdw-basebands").innerHTML = "PDW Basebands: ";
    this._form.querySelector("#rf-bandwidth").innerHTML = "Bandwidth: ";
    this._form.querySelector("#rf-freq-range").innerHTML = "Frequency Range: ";
    document.dispatchEvent(new Event("status_checked"));
  }

  async getSmwStatus(smw) {
    console.log("SMW IP: ", smw.ip_address);
    const response = await SmwsApi.tryConnectSmw(smw.ip_address);
    console.log(response.data.data);
    const smwCardEl = document.querySelector(`[data-id="${smw._id}"]`);
    if (response.data.data !== "error") {
      smwCardEl.querySelector("#smw-connected-row div").innerHTML = "Connected";
      smwCardEl.querySelector(".fa-solid").classList.remove("fa-circle-xmark");
      smwCardEl.querySelector(".fa-solid").classList.remove("fa-circle");
      smwCardEl.querySelector(".fa-solid").classList.add("fa-circle-check");
    } else {
      smwCardEl.querySelector("#smw-connected-row div").innerHTML =
        "Not Connected";
      smwCardEl.querySelector(".fa-solid").classList.remove("fa-circle-check");
      smwCardEl.querySelector(".fa-solid").classList.remove("fa-circle");
      smwCardEl.querySelector(".fa-solid").classList.add("fa-circle-xmark");
    }
  }

  updateDisplaySmwStatus(smw) {}

  updateSmwForm() {
    const smwUpdating = this._smws.find((smw) => {
      return smw._id === this._updatingID;
    });
    this._form.querySelector("#smw_ip").value = smwUpdating.ip_address;
    this._form.querySelector("#needs-pdw-streaming").checked = false;
    this._form.querySelector("#needs-adw-streaming").checked = false;
    document.dispatchEvent(new Event("update_form_fields"));
  }

  updateSmwList(smwUpdate) {
    this._smws.forEach((smw) => {
      if (smw._id === this._updatingID) {
        smw.ip_address = smwUpdate.ip_address;
        smw.options = smwUpdate.options;
        smw.bb_ips = smwUpdate.bb_ips;
      }
    });
  }

  async updateSmw(smw) {
    this.updateSmwList(smw);
    const res = await SmwsApi.updateSmw(this._updatingID, smw);
    this.render();
  }

  getTagClass(tag) {
    tag = tag.toLowerCase();
    let tagClass = "";
    if (this._validTags.has(tag)) {
      return `tag tag-${tag}`;
    } else {
      return `tag`;
    }
  }

  async addSmwToList(smw) {
    this._smws.push(smw);
    await this.render();
  }

  async render() {
    console.log("RENDER");
    this._smwListEl.innerHTML = this._smws
      .map((smw) => {
        return `<div class="card" data-id="${smw._id}">
        <button id="editSmwBtn"><i class="fas fa-edit fa-2x"></i></button>
        <button id="deleteSmwBtn"><i class="fas fa-times fa-2x"></i></button>
        <h3>SMW IP Address: ${smw.ip_address}</h3>
        <h4>Connection Status:</h4>
        <div id="smw-connected-row">
          <div> </div>
          <i class="fa-solid fa-circle"></i>
        </div>
        <p>Options: Frequency: ${
          smw.options.rf_freq / 1000000000
        } GHz, Ports: ${smw.options.rf_ports}, Bandwidth: ${
          smw.options.rf_bandwidth / 1000000000
        } GHz, Basebands: ${smw.options.basebands}</p>
      </div>`;
      })
      .join("");
    this.addEventListeners();
    for (let i = 0; i < this._smws.length; i++) {
      console.log(`Getting status of SMW: ${this._smws[i]._id}`);
      await this.getSmwStatus(this._smws[i]);
    }
  }
}

module.exports = SmwList;
