const EmittersApi = require("../services/emittersApi");
const smwsApi = require("../services/smwsApi");
const SmwsApi = require("../services/smwsApi");

class EmitterList {
  constructor() {
    this._emitterListEl = document.querySelector("#emitter-list");
    this._smwBBListEl = document.querySelector("#bb-select-card");
    this._smwBBListElStream = document.querySelector(
      "#pdw-emitter-bb-selections"
    );
    this._table = document.querySelector("TABLE");
    this._emitterCardEl = document.querySelector("#emitter-card");
    this._smws = [];
    this._emitters = [];
    this._basebands = "";
    this._selected = 0;
    this.render();
    this.getDisplaySmwBasebands();
    this.getEmitters();
    this.checkEmptyEmitterList();
    this.renderSendableBasebands();
  }

  addEventListeners() {
    this._smwBBListEl.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      if (e.target.tagName === "INPUT") {
        console.log(e.target.id.split("_"));
        const bbIdx = e.target.id.split("_")[0].slice(2);
        const smwIdx = e.target.id.split("_")[1].slice(3);
        this._smws[smwIdx].bb_ips[bbIdx].active = `${e.target.checked}`;
        console.log(this._smws);
      }
    });

    // this._emitterCardEl.addEventListener("click", (e) => {
    //   e.stopImmediatePropagation();
    //   console.log(e.target);
    //   if (e.target.classList.contains("fa-plus")) {
    //     console.log("adding...");
    //     this.newEmitterCreate();
    //   } else if (e.target.classList.contains("fa-minus")) {
    //     console.log("deleting...");
    //     this.deleteEmitter();
    //   }
    // });

    document.querySelector(".fa-plus").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      console.log("adding...");
      this.newEmitterCreate();
    });

    document.querySelector(".fa-minus").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      console.log("deleting...");
      this.deleteEmitter();
    });

    document.querySelector("table").addEventListener("focusout", (e) => {
      e.stopImmediatePropagation();
      if (e.target.tagName === "TD") {
        this.updateEmitterTable(e.target);
      }
    });

    document.querySelector("table").addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      e.target.focusin;
      if (e.target.tagName === "INPUT" && e.target.name[0] === "r") {
        e.target.classList.add("selected");
        const radBtns = this._table.querySelectorAll('input[type="radio"]');
        radBtns.forEach((radBtn) => {
          if (radBtn.name !== e.target.name) {
            radBtn.classList.remove("selected");
            radBtn.checked = false;
          }
        });
      }
    });

    document.querySelector("table").addEventListener("keydown", (e) => {
      e.stopImmediatePropagation();
      if (e.key === "Enter" || e.key === "Esc") {
        e.target.blur();
      }
    });

    document
      .querySelector("#init-streaming-btn")
      .addEventListener("click", async (e) => {
        e.stopImmediatePropagation();
        await this.initEmitterStreaming();
      });

    document
      .querySelector("#stop-streaming-btn")
      .addEventListener("click", async (e) => {
        e.stopImmediatePropagation();
        await this.stopEmitterStreaming();
      });

    document
      .querySelector("#stream-emitter-table-btn")
      .addEventListener("click", async (e) => {
        e.stopImmediatePropagation();
        console.log("streaming table");
        await SmwsApi.streamEmitters(this._emitters);
      });

    this._smwBBListElStream.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      console.log(e.target);
      if (e.target.tagName === "INPUT") {
        e.target.classList.add("selected");
        const radBtns = this._smwBBListElStream.querySelectorAll(
          'input[type="radio"]'
        );
        radBtns.forEach((radBtn) => {
          if (radBtn.name !== e.target.name) {
            radBtn.classList.remove("selected");
            radBtn.checked = false;
          }
        });
        this.checkSelectedEmitterBaseband(e.target);
      }
    });
  }

  async initEmitterStreaming() {
    document.querySelector("#intitialization-status").innerHTML =
      "Status: Pending";
    document.querySelector("#init-spinner").classList.add("visible");
    await SmwsApi.closePdwStreams();

    const initResponse = await smwsApi.initEmitterStreaming(this._smws);
    document.querySelector("#init-spinner").classList.remove("visible");
    if (initResponse.data.data === "Success") {
      document.querySelector("#intitialization-status").innerHTML =
        "Status: Connected";
      this.renderSendableBasebands();
      const radBtns = Array.from(
        this._smwBBListElStream.querySelectorAll('input[type="radio"]')
      );
      radBtns[0].click();
    } else {
      document.querySelector("#intitialization-status").innerHTML =
        "Status: Connection Not Initiated";
    }
  }

  async stopEmitterStreaming() {
    document.querySelector("#stop-spinner").classList.add("visible");
    const stopResponse = await smwsApi.stopEmitterStreaming();
    document.querySelector("#stop-spinner").classList.remove("visible");
    if (stopResponse.data.data === "Emitter Interface Stopped") {
      document.querySelector("#intitialization-status").innerHTML =
        "Status: Stopped";
    } else {
      document.querySelector("#intitialization-status").innerHTML =
        "Status: Error Stopping";
    }
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

  async getEmitters() {
    try {
      const res = await EmittersApi.getEmitters();
      this._emitters = res.data.data;
      this.renderEmitterList();
    } catch (error) {
      console.log(error);
    }
  }

  async addEmitter(emitter) {
    try {
      const newEmitter = await EmittersApi.addEmitter(emitter);
      this.addEmitterToList(newEmitter.data.data);
    } catch (error) {
      alert("There was an issue adding the Emitter to the Backend Database");
    }
  }

  async deleteEmitter() {
    if (this.checkEmptyEmitterList() == true) {
      return;
    }
    const emitterRowRadBtn = document.querySelector(".selected");
    if (+emitterRowRadBtn.name[1] === this._emitters.length - 1) {
      this._selected = this._emitters.length - 2;
    } else {
      this._selected = +emitterRowRadBtn.name[1];
    }

    console.log(emitterRowRadBtn);
    const emitterID = emitterRowRadBtn.parentElement.parentElement.dataset.id;
    emitterRowRadBtn.parentElement.parentElement.remove();
    try {
      //Delete from server
      const res = await EmittersApi.deleteEmitter(emitterID);
      this._emitters = this._emitters.filter(
        (emitter) => emitter._id !== emitterID
      );
      this.getEmitters();
    } catch (error) {
      alert("You cannot delete this resource");
    }
  }

  checkEmptyEmitterList() {
    const deleteEmitterBtn = document.querySelector("#delete-emitter-btn");
    if (this._emitters.length === 0) {
      deleteEmitterBtn.disabled = true;
      return true;
    } else {
      deleteEmitterBtn.disabled = false;
      return false;
    }
  }

  async updateEmitter(id, emitter) {
    const res = await EmittersApi.updateEmitter(id, emitter);
    this.render();
  }

  updateEmitterTable(tableRowEl) {
    const emitterNum = tableRowEl.parentElement.id.split("_")[1];
    this._emitters[emitterNum][tableRowEl.classList[0]] =
      tableRowEl.textContent;
    this.updateEmitter(
      tableRowEl.parentElement.dataset.id,
      this._emitters[emitterNum]
    );
  }

  checkSelectedEmitterBaseband(el) {
    let emBaseband = el.name.split("_")[0].slice(2);
    for (let i = 0; i < this._emitters.length; i++) {
      this._emitters[i].basebands = emBaseband;
    }
    console.log(this._emitters);
  }

  newEmitterCreate() {
    const emitter = {
      basebands: "0",
      pw: "10",
      pri: "100",
      mop: "Unmod",
      time_offset: "0",
      freq_offset: "0",
      level_offset: "0",
      phase_offset: "0",
      rise_time: "0",
      fall_time: "0",
      edge_shape: "LIN",
      arb_seg_index: "0",
      lfm_bandwidth: "0",
      barker_code: "0",
      barker_chip_width: "0",
    };

    //Add Emitter to DB
    this.addEmitter(emitter);
  }

  addEmitterToList(emitter) {
    this._emitters.push(emitter);
    this.renderEmitterList();
  }

  renderSmwBasebands() {
    let idxTotal = 0;
    this._smwBBListEl.innerHTML = this._smws
      .map((smw, smwIdx) => {
        return `
        <div class="bb-select">
          <h4>SMW ${smw.ip_address}:</h4>
          ${smw.bb_ips
            .map((bbIp, bbIdx) => {
              idxTotal = idxTotal + 1;
              return `
            <span>BB${idxTotal}</span><input type="checkbox" name="BB${idxTotal}" id="BB${bbIdx}_SMW${smwIdx}" />
            `;
            })
            .join("")}
        </div>
    `;
      })
      .join("");
  }

  renderSendableBasebands() {
    let idxTotal = 0;
    const bbFormCheckboxes = this._smws.map((smw) => {
      return `${smw.bb_ips
        .map((bbIp) => {
          idxTotal = idxTotal + 1;
          if (bbIp.active === "true") {
            console.log("bbActive: " + bbIp.active);
            return `<span>BB${idxTotal}</span><input type="radio" name="BB${idxTotal}_sel" id="BB${idxTotal}_sel" />`;
          } else {
            return "";
          }
        })
        .join("")}`;
    });
    console.log("BBCHecks: " + bbFormCheckboxes);
    this._smwBBListElStream.innerHTML =
      "<h4>Basebands:</h4>" + bbFormCheckboxes;
  }

  renderEmitterList() {
    this._emitterListEl.innerHTML = this._emitters
      .map((emitter, index) => {
        return `<tr id="emitter_${index}" data-id="${emitter._id}">
                <td><input type="radio" class="emitter_select${
                  index === this._selected ? " selected" : ""
                }" name="r${index}"${
          index === this._selected ? ' checked="true"' : ""
        }"></td>
                <td class="pw" contenteditable="true">${emitter.pw}</td>
                <td class="pri" contenteditable="true">${emitter.pri}</td>
                <td class="mop" contenteditable="true">${emitter.mop}</td>
                <td class="time_offset" contenteditable="true">${
                  emitter.time_offset
                }</td>
                <td class="freq_offset" contenteditable="true">${
                  emitter.freq_offset
                }</td>
                <td class="level_offset" contenteditable="true">${
                  emitter.level_offset
                }</td>
                <td class="phase_offset" contenteditable="true">${
                  emitter.phase_offset
                }</td>
                <td class="rise_time" contenteditable="true">${
                  emitter.rise_time
                }</td>
                <td class="fall_time" contenteditable="true">${
                  emitter.fall_time
                }</td>
                <td class="edge_shape" contenteditable="true">${
                  emitter.edge_shape
                }</td>
                <td class="arb_seg_index" contenteditable="true">${
                  emitter.arb_seg_index
                }</td>
                <td class="lfm_bandwidth" contenteditable="true">${
                  emitter.lfm_bandwidth
                }</td>
                <td class="barker_code" contenteditable="true">${
                  emitter.barker_code
                }</td>
                <td class="barker_chip_width" contenteditable="true">${
                  emitter.barker_chip_width
                }</td>

              </tr>`;
      })
      .join("");
  }

  render() {
    this.renderSmwBasebands();
    this.renderEmitterList();
    this.addEventListeners();
  }
}

module.exports = EmitterList;
