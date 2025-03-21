const AdwsApi = require("../services/adwsApi");
const smwsApi = require("../services/smwsApi");
const SmwsApi = require("../services/smwsApi");

class AdwList {
  constructor() {
    this._adwListEl = document.querySelector("#adw-list");
    this._smwBBListEl = document.querySelector("#bb-select-card");
    this._adws = [];
    this._smws = [];
    this.getAdws();
    this._form = document.querySelector("#form-modal");
    this._updatingID = "";
    this.getDisplaySmwBasebands();
  }

  addEventListeners() {
    this._adwListEl.addEventListener("click", (e) => {
      console.log(e.target);
      if (e.target.classList.contains("fa-times")) {
        e.stopImmediatePropagation();
        const adwID = e.target.parentElement.parentElement.dataset.id;
        this.deleteAdw(adwID);
      } else if (e.target.classList.contains("fa-edit")) {
        e.stopImmediatePropagation();
        this._updatingID = e.target.parentElement.parentElement.dataset.id;
        this.updateAdwForm();
        document.dispatchEvent(new Event("openmodal"));
      } else if (e.target.classList.contains("adw-send-btn")) {
        e.stopImmediatePropagation();
        console.log(`SENDING ADW of adw: ${e.target.parentElement.dataset.id}`);
        const adw = this._adws.find(
          (adw) => adw._id === e.target.parentElement.dataset.id
        );
        SmwsApi.streamAdw(adw);
      }
    });
    this._smwBBListEl.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") {
        e.target.classList.add("smw_selected");
        const radioBtns = document.querySelectorAll('input[type="radio"]');
        radioBtns.forEach((btn) => {
          if (btn.name !== e.target.name) {
            btn.classList.remove("smw_selected");
            btn.checked = false;
          }
        });
      }
    });
    document
      .getElementById("init-adw-streaming-btn")
      .addEventListener("mousedown", (e) => {
        e.stopImmediatePropagation();
        let smwSelected = Array.from(
          document.querySelectorAll('input[type="radio"]')
        );
        smwSelected = smwSelected.filter((smw) => {
          return smw.checked === true;
        });
        const index = smwSelected[0].name.slice(3);
        const smw = this._smws[+index];
        smwsApi.initAdwStreaming(smw._id);
      });

    document.querySelector("#add-adw-btn").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      document.dispatchEvent(new Event("openmodal"));
      this._updatingID = "";
    });
  }

  //Get and render baseband resources
  async getDisplaySmwBasebands() {
    this._smws = [];
    const res = await SmwsApi.getSmws();
    const resSmws = res.data.data;
    for (let i = 0; i < resSmws.length; i++) {
      const response = await SmwsApi.tryConnectSmw(resSmws[i].ip_address);
      if (response.data.data !== "error") {
        this._smws.push(resSmws[i]);
      }
    }
    this.renderSmwBasebands();
  }

  async getAdws() {
    try {
      const res = await AdwsApi.getAdws();
      this._adws = res.data.data;
      this.render();
    } catch (error) {
      console.log(error);
    }
  }

  async deleteAdw(adwID) {
    try {
      //Delete from server
      console.log(adwID);
      const res = await AdwsApi.deleteAdw(adwID);
      this._adws.filter((adw) => adw._id !== adwID);
      this.getAdws();
    } catch (error) {
      alert("You cannot delete this resource");
    }
  }

  async updateOrAddAdw(adw) {
    if (this._updatingID === "") {
      const newAdw = await AdwsApi.addAdw(adw);
      console.log(newAdw);
      this.addAdwToList(newAdw.data.data);
    } else {
      const updatedAdw = await this.updateAdw(adw);
      this._updatingID = "";
    }
  }

  updateAdwForm() {
    const adwUpdating = this._adws.find((adw) => {
      return adw._id === this._updatingID;
    });
    console.log(adwUpdating);
    this._form.querySelector("#seg").checked = adwUpdating.seg === "true";
    this._form.querySelector("#use_extension").checked =
      adwUpdating.use_extension === "true";
    this._form.querySelector("#seg_interrupt").checked =
      adwUpdating.seg_interrupt === "true";
    this._form.querySelector("#ignore_adw").checked =
      adwUpdating.ignore_adw === "true";
    this._form.querySelector("#m1").checked = adwUpdating.m1 === "true";
    this._form.querySelector("#m2").checked = adwUpdating.m2 === "true";
    this._form.querySelector("#m3").checked = adwUpdating.m3 === "true";
    this._form.querySelector("#freq_offset").value = adwUpdating.freq_offset;
    this._form.querySelector("#level_offset").value = adwUpdating.level_offset;
    this._form.querySelector("#phase_offset").value = adwUpdating.phase_offset;
    this._form.querySelector("#segment_index").value =
      adwUpdating.segment_index;
    this._form.querySelector("#burst_sri").value = adwUpdating.burst_sri;
    this._form.querySelector("#burst_add_segments").value =
      adwUpdating.burst_add_segments;
  }

  updateAdwList(adwUpdate) {
    this._adws.forEach((adw) => {
      if (adw._id === this._updatingID) {
        adw.seg = adwUpdate.seg;
        adw.use_extension = adwUpdate.use_extension;
        adw.seg_interrupt = adwUpdate.seg_interrupt;
        adw.ignore_adw = adwUpdate.ignore_adw;
        adw.m1 = adwUpdate.m1;
        adw.m2 = adwUpdate.m2;
        adw.m3 = adwUpdate.m3;
        adw.freq_offset = adwUpdate.freq_offset;
        adw.level_offset = adwUpdate.level_offset;
        adw.phase_offset = adwUpdate.phase_offset;
        adw.segment_index = adwUpdate.segment_index;
        adw.burst_sri = adwUpdate.burst_sri;
        adw.burst_add_segments = adwUpdate.burst_add_segments;
      }
    });
  }

  async updateAdw(adw) {
    this.updateAdwList(adw);
    const res = await AdwsApi.updateAdw(this._updatingID, adw);
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

  addAdwToList(adw) {
    this._adws.push(adw);
    this.render();
  }

  renderSmwBasebands() {
    this._smwBBListEl.innerHTML = this._smws
      .map((smw, idx) => {
        return `
        <div class="bb-select">
          <h4>SMW ${smw.ip_address}:</h4>
          <input type="radio" name="SMW${idx}" id="SMW${idx}" />
        </div>
    `;
      })
      .join("");
  }

  render() {
    this._adwListEl.innerHTML = this._adws
      .map((adw, index) => {
        return `<div class="card" id=adw_${index} data-id="${adw._id}">
        <button id="deleteAdwBtn">
                 <i class="fas fa-times fa-2x"></i>
        </button>
          <button id="editAdwBtn">
            <i class="fas fa-edit fa-2x"></i>
          </button>
          <div class="adw-el">
            <h5>ADW ${index}</h5>
            <p>
              SEG: ${adw.seg}, USE EXTENSION: ${adw.use_extension}, SEG INTERRUPT: ${adw.seg_interrupt}, IGNORE ADW:
              ${adw.ignore_adw}, M1: ${adw.m1}, M2: ${adw.m2}, M3: ${adw.m3}, Freq. Offset: ${adw.freq_offset} Hz, Level
              Offset: ${adw.level_offset} dB, Phase Offset: ${adw.phase_offset} deg, Segment Index: ${adw.segment_index}, Burst SRI: ${adw.burst_sri}
              us, Burst Add Segments: ${adw.burst_add_segments}
            </p>
          </div>
          <button class="adw-send-btn">Stream ADW</button>
      </div>`;
      })
      .join("");
    this.addEventListeners();
  }
}

module.exports = AdwList;
