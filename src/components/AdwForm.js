const AdwsApi = require("../services/adwsApi");
const AdwList = require("./AdwList");

class AdwForm {
  constructor() {
    this._formModal = document.querySelector("#form-modal");
    this._adwList = new AdwList();
    this._update = false;
  }

  addEventListeners() {
    this._form.addEventListener("submit", this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault(e);
    console.log(this._formModal.querySelector("#seg").checked);

    const adw = {
      // ip_address: this._form.elements.smw_ip.value,
      seg: this._formModal.querySelector("#seg").checked.toString(),
      use_extension: this._formModal
        .querySelector("#use_extension")
        .checked.toString(),
      seg_interrupt: this._formModal
        .querySelector("#seg_interrupt")
        .checked.toString(),
      ignore_adw: this._formModal
        .querySelector("#ignore_adw")
        .checked.toString(),
      m1: this._formModal.querySelector("#m1").checked.toString(),
      m2: this._formModal.querySelector("#m2").checked.toString(),
      m3: this._formModal.querySelector("#m3").checked.toString(),
      freq_offset: this._formModal
        .querySelector("#freq_offset")
        .value.toString(),
      level_offset: this._formModal
        .querySelector("#level_offset")
        .value.toString(),
      phase_offset: this._formModal
        .querySelector("#phase_offset")
        .value.toString(),
      segment_index: this._formModal
        .querySelector("#segment_index")
        .value.toString(),
      burst_sri: this._formModal.querySelector("#burst_sri").value.toString(),
      burst_add_segments: this._formModal
        .querySelector("#burst_add_segments")
        .value.toString(),
    };

    console.log(adw);

    this._adwList.updateOrAddAdw(adw);

    // this.render();

    document.dispatchEvent(new Event("closemodal"));
  }

  render() {
    this._formModal.innerHTML = `<form id="adw-form">
          <div id="adw-title"><h2>Agile Descriptor Word</h2></div>
          <div class="form-control">
            <div class="adw-field">
              <label for="adw-seg">SEG: </label>
              <input type="checkbox" name="seg" id="seg" checked/>
            </div>
            <div class="adw-field">
              <label for="adw-use-extension">Use Extension: </label>
              <input type="checkbox" name="use_extension" id="use_extension" checked/>
            </div>
            <div class="adw-field">
              <label for="adw-seg-interrupt">Seg Interrupt: </label>
              <input type="checkbox" name="seg_interrupt" id="seg_interrupt" checked/>
            </div>
            <div class="adw-field">
              <label for="adw-ignore-adw">Ignore ADW: </label>
              <input type="checkbox" name="ignore_adw" id="ignore_adw"/>
            </div>
            <div class="adw-field">
              <label for="adw-m1">M1: </label>
              <input type="checkbox" name="m1" id="m1"/>
            </div>
            <div class="adw-field">
              <label for="adw-m2">M2: </label>
              <input type="checkbox" name="m2" id="m2"/>
            </div>
            <div class="adw-field">
              <label for="adw-m3">M3: </label>
              <input type="checkbox" name="m3" id="m3"/>
            </div>
            <div class="adw-field">
              <label for="adw-freq-offset">Freq Offset (Hz): </label>
              <input type="text" name="freq_offset" id="freq_offset" value="0"/>
            </div>
            <div class="adw-field">
              <label for="adw-level-offset">Level Offset (dB): </label>
              <input type="text" name="level_offset" id="level_offset" value="0"/>
            </div>
            <div class="adw-field">
              <label for="adw-phase-offset">Phase Offset (deg): </label>
              <input type="text" name="phase_offset" id="phase_offset" value="0"/>
            </div>
            <div class="adw-field">
              <label for="adw-phase-offset">Segment Index: </label>
              <input type="text" name="segment_index" id="segment_index" value="0"/>
            </div>
            <div class="adw-field">
              <label for="adw-burst-sri">Burst SRI (us): </label>
              <input type="text" name="burst_sri" id="burst_sri" value="10"/>
            </div>
            <div class="adw-field">
              <label for="adw-burst-add-segments">Burst Add Segments: </label>
              <input type="text" name="burst_add_segments" id="burst_add_segments" value="1"/>
            </div>
          </div>

          <button class="btn" type="submit" id="submit">Submit ADW</button>
        </form>`;
    this._form = document.querySelector("#adw-form");
    this.addEventListeners();
  }
}

module.exports = AdwForm;
