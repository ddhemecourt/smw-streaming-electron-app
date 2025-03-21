const PdwsApi = require("../services/pdwsApi");
const SmwsApi = require("../services/smwsApi");

class PdwList {
  constructor() {
    this._pdwListEl = document.querySelector("#pdw-list");
    this._smwBBListEl = document.querySelector("#bb-select-card-pdw");
    this._pdwCardEl = document.querySelector("#pdw-card");
    this._smws = [];
    this._pdws = [];
    this.bbs = [];
    this._selected = 0;
    this.initFields();
    this.addEventListeners();
    console.log(this._smws);
    console.log(this.bbs);
  }

  async initFields() {
    await this.getDisplaySmwBasebands();
    await this.getPdws();
    this.checkEmptyPdwList();
  }

  addEventListeners() {
    document
      .querySelector("#bb-select-card-pdw")
      .addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT") {
          // console.log(+e.target.id.split("_")[1].slice(3));
          const smwIdx = +e.target.id.split("_")[1].slice(3);
          const bbIdx = +e.target.id.split("_")[0].slice(2);
          const idxTotal = +e.target.name.slice(2);
          // this.bbs[idxTotal].active = e.target.checked;
          // console.log(this.bbs);
          this._smws[smwIdx].bb_ips[bbIdx].active = e.target.checked;
          SmwsApi.updateSmw(this._smws[smwIdx]._id, this._smws[smwIdx]);
          this.updateSelectableBasebandsPdwTable();
          //this.bbs[+e.target.name.slice(2)].active = e.target.checked;
          // this._smws[+e.target.name.slice(2)].bb_ips[+e.target.classList.split('_').slice(3)];
          //TODO: Modify SMW accordingly after initstreaming
        }
      });

    document
      .querySelector("#bb-select-card-pdw")
      .addEventListener("click", async (e) => {
        if (e.target.id === "init-streaming-btn") {
          await this.initPdwStreaming();
          await this.getDisplaySmwBasebands();
          this.renderPDWList();
        }
      });

    this._pdwCardEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("fa-plus")) {
        this.newPdwCreate();
      } else if (e.target.classList.contains("fa-minus")) {
        this.deletePdw();
      } else if (e.target.id === "stream-pdw-table-btn") {
        SmwsApi.streamPdwList(this._pdws);
      } else if (e.target.classList.contains("bb-dropdown-check-list")) {
        e.target.querySelector(".fa-solid").classList.toggle("rotate");
        const ul = e.target.querySelector(":nth-child(2)");
        if (ul.classList.contains("visible")) {
          ul.classList.remove("visible");
        } else {
          ul.classList.add("visible");
        }
      } else if (e.target.classList.contains("fa-chevron-down")) {
        const ul =
          e.target.parentElement.parentElement.querySelector(":nth-child(2)");
        e.target.classList.toggle("rotate");
        if (ul.classList.contains("visible")) {
          ul.classList.remove("visible");
        } else {
          ul.classList.add("visible");
        }
      }
    });
    document.querySelector("table").addEventListener("focusout", (e) => {
      if (e.target.tagName === "TD") {
        this.updatePDWTable(e.target, e.target.textContent);
      }
    });

    document.querySelector("table").addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT" && e.target.name[0] === "r") {
        e.target.classList.add("selected");
        const radBtns = document.querySelectorAll('input[type="radio"]');
        radBtns.forEach((radBtn) => {
          if (radBtn.name !== e.target.name) {
            radBtn.classList.remove("selected");
            radBtn.checked = false;
          }
        });
      }
    });

    document.querySelector("table").addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Esc") {
        e.target.blur();
      }
    });

    document.querySelector("table").addEventListener("change", (e) => {
      if (e.target.tagName === "SELECT") {
        this.updatePDWTable(e.target.parentElement, e.target.value);
      } else if (e.target.tagName === "INPUT") {
        const anchorEl =
          e.target.parentElement.parentElement.previousElementSibling;
        let bb_options = e.target.parentElement.parentElement.children;
        console.log(bb_options);
        let selecetedBbs = [];
        for (let i = 0; i < bb_options.length; i++) {
          if (bb_options[i].querySelector("INPUT").checked === true) {
            selecetedBbs.push(bb_options[i].id.slice(2));
          }
        }
        if (selecetedBbs.length > 0) {
          anchorEl.innerHTML = `${selecetedBbs.join(
            ","
          )}<i class="fa-solid fa-chevron-down rotate"></i>`;
          anchorEl.parentElement.dataset.id = `${selecetedBbs.join(",")}`;
        } else {
          anchorEl.innerHTML = `<i class="fa-solid fa-chevron-down rotate"></i>`;
          anchorEl.parentElement.dataset.id = ``;
        }
        // console.log(anchorEl.parentElement.parentElement);
        this.updatePDWTableNoRender(
          anchorEl.parentElement.parentElement,
          anchorEl.parentElement.dataset.id
        );
      }
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

  //Initialize pdw streaming
  async initPdwStreaming() {
    document.querySelector(".spinner").classList.add("visible");
    await SmwsApi.closePdwStreams();
    for (let i = 0; i < this._smws.length; i++) {
      const resp = await SmwsApi.initPdwStreaming(this._smws[i]._id);
      console.log(resp.data.data);
    }
    document.querySelector(".spinner").classList.remove("visible");
  }

  async getPdws() {
    try {
      const res = await PdwsApi.getPdws();
      this._pdws = res.data.data;
      this.renderPDWList();
    } catch (error) {
      console.log(error);
    }
  }

  async addPdw(pdw) {
    try {
      const newPdw = await PdwsApi.addPdw(pdw);
      this.addPdwToList(newPdw.data.data);
    } catch (error) {
      alert("There was an issue adding the PDW to the Backend Database");
    }
  }

  async deletePdw() {
    if (this.checkEmptyPdwList() == true) {
      return;
    }
    const pdwRowRadBtn = document.querySelector(".selected");
    console.log("name = " + pdwRowRadBtn.name);
    if (+pdwRowRadBtn.name[1] === this._pdws.length - 1) {
      this._selected = this._pdws.length - 2;
    } else {
      this._selected = +pdwRowRadBtn.name[1];
    }

    const pdwID = pdwRowRadBtn.parentElement.parentElement.dataset.id;
    pdwRowRadBtn.parentElement.parentElement.remove();
    try {
      //Delete from server
      const res = await PdwsApi.deletePdw(pdwID);
      this._pdws = this._pdws.filter((pdw) => pdw._id !== pdwID);
      this.getPdws();
    } catch (error) {
      alert("You cannot delete this resource");
    }
  }

  checkEmptyPdwList() {
    const deletePdwBtn = document.querySelector("#delete-pdw-btn");
    if (this._pdws.length === 0) {
      deletePdwBtn.disabled = true;
      return true;
    } else {
      deletePdwBtn.disabled = false;
      return false;
    }
  }

  async updatePdw(id, pdw) {
    const res = await PdwsApi.updatePdw(id, pdw);
    this.render();
  }

  async updatePdwNoRender(id, pdw) {
    const res = await PdwsApi.updatePdw(id, pdw);
  }

  updatePDWTable(tableRowEl, value) {
    const pdwNum = tableRowEl.parentElement.id.split("_")[1];
    this._pdws[pdwNum][tableRowEl.classList[0]] = value;
    this.updatePdw(tableRowEl.parentElement.dataset.id, this._pdws[pdwNum]);
  }

  updatePDWTableNoRender(tableRowEl, value) {
    const pdwNum = tableRowEl.parentElement.id.split("_")[1];
    this._pdws[pdwNum][tableRowEl.classList[0]] = value;
    this.updatePdwNoRender(
      tableRowEl.parentElement.dataset.id,
      this._pdws[pdwNum]
    );
  }

  newPdwCreate() {
    const pdw = {
      basebands: "1",
      toa: "0",
      word_type: "PDW",
      mop: "Unmod",
      freq_offset: "0",
      level_offset: "0",
      phase_offset: "0",
      pulse_width: "10",
      rise_time: "0",
      fall_time: "0",
      edge_shape: "LIN",
      repetitions: "0",
      arb_seg_index: "0",
      lfm_bandwidth: "0",
      barker_chip_width: "0",
      barker_code: "0",
      m1: "true",
      m2: "false",
      m3: "false",
      tcdw_path: "A",
      tcdw_command: "Frequency & Amplitude",
      tcdw_freq: "1000000000",
      tcdw_level: "0",
    };

    //Add pdw to DB
    this.addPdw(pdw);
  }

  updateSelectableBasebandsPdwTable() {
    const basebands = document.querySelectorAll('[name*="BB"]');
    basebands.forEach((bb) => {
      if (bb.checked) {
        this.bbs.active = "true";
      } else {
        this.bbs.active = "false";
      }
    });
    this.renderPDWList();
  }

  addPdwToList(pdw) {
    this._pdws.push(pdw);
    this.renderPDWList();
  }

  renderSmwBasebands() {
    let idxTotal = 0;
    this.bbs = [];
    this._smwBBListEl.innerHTML = `${this._smws
      .map((smw, smwIdx) => {
        return `
        <div class="bb-select">
          <h4>SMW ${smw.ip_address}:</h4>
          ${smw.bb_ips
            .map((bbIp, bbIdx) => {
              idxTotal = idxTotal + 1;
              this.bbs.push({
                bbName: `BB${idxTotal}`,
                bbIP: bbIp.ip,
                active: bbIp.active,
                smwNum: smwIdx,
              });
              console.log(`BB: ${bbIp}, this bbs: ${this.bbs}`);
              return `
            <span>BB${idxTotal}</span><input type="checkbox" name="BB${idxTotal}" id="BB${bbIdx}_SMW${smwIdx}" class="bb_active" ${
                bbIp.active === "true" ? `checked` : ``
              }/>
            `;
            })
            .join("")} 
        </div>
    `;
      })
      .join("")}
      <div id="intitialization-container">
      <button id="init-streaming-btn" class="init-streaming-button">
          <i class="fas fa-circle-arrow-up"></i> Initialize Streaming
        </button>
      <div class="spinner"></div>
      </div>
      <div id="pdw-stream-status">
      <h4>Status: </h4>
      ${this.genActivePdwStreamIcons()}
      </div>
            `;
  }

  genActivePdwStreamIcons() {
    let idxTotal = 0;
    const icons = `${this._smws
      .map((smw, smwIdx) => {
        return `
          ${smw.bb_ips
            .map((bbIp, bbIdx) => {
              idxTotal = idxTotal + 1;
              return `
            <span>BB${idxTotal}</span><i ${
                bbIp.active === "true"
                  ? `class="fa-solid fa-circle-check"`
                  : `class="fa-solid fa-circle-xmark"`
              }></i>
            `;
            })
            .join("")} 
    `;
      })
      .join("")}`;
    return icons;
  }

  setPdwDropdowns(pdw, val) {
    if (val === "word_type") {
      return `<select>
                   <option value="PDW" ${
                     pdw.word_type === "PDW" ? "selected" : ""
                   }>PDW</option>
                  <option value="TCDW" ${
                    pdw.word_type === "TCDW" ? "selected" : ""
                  }>TCDW</option>
                </select>`;
    } else if (val === "mop") {
      return `<select>
                   <option value="Unmod" ${
                     pdw.mop === "Unmod" ? "selected" : ""
                   }>Unmod</option>
                   <option value="LFM" ${
                     pdw.mop === "LFM" ? "selected" : ""
                   }>LFM</option>
                   <option value="TLFM" ${
                     pdw.mop === "TLFM" ? "selected" : ""
                   }>TLFM</option>
                   <option value="Barker" ${
                     pdw.mop === "Barker" ? "selected" : ""
                   }>Barker</option>
                   <option value="Arb Seg" ${
                     pdw.mop === "Arb Seg" ? "selected" : ""
                   }>Arb Seg</option>
                </select>`;
    } else if (val === "edge_shape") {
      return `<select>
      <option value="LIN" ${
        pdw.edge_shape === "LIN" ? "selected" : ""
      }>LIN</option>
      <option value="COS" ${
        pdw.edge_shape === "COS" ? "selected" : ""
      }>COS</option>
     </select>`;
    } else if (val === "m1") {
      return `<select>
                   <option value="true" ${
                     pdw.m1 === "true" ? "selected" : ""
                   }>true</option>
                   <option value="false"${
                     pdw.m1 === "false" ? "selected" : ""
                   } >false</option>
              </select>`;
    } else if (val === "m2") {
      return `<select>
                   <option value="true" ${
                     pdw.m2 === "true" ? "selected" : ""
                   }>true</option>
                   <option value="false"${
                     pdw.m2 === "false" ? "selected" : ""
                   } >false</option>
              </select>`;
    } else if (val === "m3") {
      return `<select>
                   <option value="true" ${
                     pdw.m3 === "true" ? "selected" : ""
                   }>true</option>
                   <option value="false"${
                     pdw.m3 === "false" ? "selected" : ""
                   } >false</option>
              </select>`;
    } else if (val === "basebands") {
      console.log("baseband in set pdw list: " + this.bbs);
      return `<div class="bb-dropdown-check-list" data-id="${pdw.basebands}">
                <span class="anchor">${
                  pdw.basebands
                }<i class="fa-solid fa-chevron-down"></i></span>
                <ul class="bb-items">
                ${this.bbs
                  .map((bb) => {
                    if (bb.active === "true") {
                      return `<li id="${
                        bb.bbName
                      }"><input type="checkbox" ${pdw.basebands
                        .split(",")
                        .map((bbSel) => {
                          console.log(bbSel, bb.bbName.slice(2));
                          if (+bbSel === +bb.bbName.slice(2)) {
                            return `checked`;
                          } else {
                            return ``;
                          }
                        })
                        .join("")}/>${bb.bbName}</li>`;
                    } else {
                      return ``;
                    }
                  })
                  .join("")}
                </ul>
              </div>`;
    } else if (val === "barker_code") {
      return `<select>
      <option value="0" ${pdw.barker_code === "0" ? "selected" : ""}>0</option>
      <option value="1" ${pdw.barker_code === "1" ? "selected" : ""}>1</option>
      <option value="2" ${pdw.barker_code === "2" ? "selected" : ""}>2</option>
      <option value="3" ${pdw.barker_code === "3" ? "selected" : ""}>3</option>
      <option value="4" ${pdw.barker_code === "4" ? "selected" : ""}>4</option>
      <option value="5" ${pdw.barker_code === "5" ? "selected" : ""}>5</option>
      <option value="6" ${pdw.barker_code === "6" ? "selected" : ""}>6</option>
      <option value="7" ${pdw.barker_code === "7" ? "selected" : ""}>7</option>
      <option value="8" ${pdw.barker_code === "8" ? "selected" : ""}>8</option>
     </select>`;
    } else if (val === "tcdw_path") {
      return `<select>
      <option value="A" ${pdw.tcdw_path === "A" ? "selected" : ""}>A</option>
      <option value="B" ${pdw.tcdw_path === "B" ? "selected" : ""}>B</option>
     </select>`;
    } else if (val === "tcdw_command") {
      return `<select>
      <option value="Frequency & Amplitude" ${
        pdw.tcdw_command === "Frequency & Amplitude" ? "selected" : ""
      }>Frequency & Amplitude</option>
      <option value="Frequency" ${
        pdw.tcdw_command === "Frequency" ? "selected" : ""
      }>Frequency</option>
      <option value="Amplitude" ${
        pdw.tcdw_command === "Amplitude" ? "selected" : ""
      }>Amplitude</option>
      <option value="Re-Arm" ${
        pdw.tcdw_command === "Re-Arm" ? "selected" : ""
      }>Re-Arm</option>
     </select>`;
    }
  }

  renderPDWList() {
    this._pdwListEl.innerHTML = this._pdws
      .map((pdw, index) => {
        return `<tr id="pdw_${index}" data-id="${pdw._id}">
                <td><input type="radio" class="pdw_select${
                  index === this._selected ? " selected" : ""
                }" name="r${index}"${
          index === this._selected ? ' checked="true"' : ""
        }"></td>
                <td class="basebands" contenteditable="false">${this.setPdwDropdowns(
                  pdw,
                  "basebands"
                )}</td>
                <td class="toa" contenteditable="true">${pdw.toa}</td>
                <td class="word_type" contenteditable="true">
                ${this.setPdwDropdowns(pdw, "word_type")}
                
                
                </td>
                <td class="mop" contenteditable="true">
                ${this.setPdwDropdowns(pdw, "mop")}
                </td>
                <td class="freq_offset" contenteditable="true">${
                  pdw.freq_offset
                }</td>
                <td class="level_offset" contenteditable="true">${
                  pdw.level_offset
                }</td>
                <td class="phase_offset" contenteditable="true">${
                  pdw.phase_offset
                }</td>
                <td class="pulse_width" contenteditable="true">${
                  pdw.pulse_width
                }</td>
                <td class="rise_time" contenteditable="true">${
                  pdw.rise_time
                }</td>
                <td class="fall_time" contenteditable="true">${
                  pdw.fall_time
                }</td>
                <td class="edge_shape" contenteditable="true">
                ${this.setPdwDropdowns(pdw, "edge_shape")}
                </td>
                <td class="repetitions" contenteditable="true">${
                  pdw.repetitions
                }</td>
                <td class="arb_seg_idx" contenteditable="true">${
                  pdw.arb_seg_index
                }</td>
                <td class="lfm_bandwidth" contenteditable="true">${
                  pdw.lfm_bandwidth
                }</td>
                <td class="barker_chip_width" contenteditable="true">${
                  pdw.barker_chip_width
                }</td>
                <td class="barker_code" contenteditable="true">${this.setPdwDropdowns(
                  pdw,
                  "barker_code"
                )}</td>
                <td class="m1" contenteditable="true">
                  ${this.setPdwDropdowns(pdw, "m1")}
                </td>
                <td class="m2" contenteditable="true">
                ${this.setPdwDropdowns(pdw, "m2")}
                </td>
                <td class="m3" contenteditable="true"> 
                ${this.setPdwDropdowns(pdw, "m3")}
                </td>
                <td class="tcdw_path" contenteditable="true">${this.setPdwDropdowns(
                  pdw,
                  "tcdw_path"
                )}</td>
                <td class="tcdw_command" contenteditable="true">${this.setPdwDropdowns(
                  pdw,
                  "tcdw_command"
                )}</td>
                <td class="tcdw_freq" contenteditable="true">${
                  pdw.tcdw_freq
                }</td>
                <td class="tcdw_level" contenteditable="true">${
                  pdw.tcdw_level
                }</td>
              </tr>`;
      })
      .join("");
  }

  render() {
    this.renderSmwBasebands();
    this.renderPDWList();
  }
}

module.exports = PdwList;
