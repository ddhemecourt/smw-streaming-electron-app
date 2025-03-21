const SmwsApi = require("../services/smwsApi");
const SmwList = require("./SmwList");

class SmwForm {
  constructor() {
    this._formModal = document.querySelector("#form-modal");
    this._smwList = new SmwList();
    this._update = false;
    this._connectionStatus = false;
    this.pdwBasebands;
    this.rfBandwidth;
    this.rfPorts;
    this.rfFreq;
    this.bbIps = [];
    this.adwInterface = { ip_address: "", port: "", subnet_mask: "" };
    this._pdwStreamingChecked = false;
    this._adwStreamingChecked = false;
  }

  addEventListeners() {
    this._form.addEventListener("submit", this.handleSubmit.bind(this));
    this._form
      .querySelector("#needs-pdw-streaming")
      .addEventListener("change", this.pdwStreamingCheck.bind(this));
    this._form
      .querySelector("#needs-adw-streaming")
      .addEventListener("change", this.adwStreamingCheck.bind(this));
    document.addEventListener("updatesmw", () => (this._update = true));
    this._form
      .querySelector("#connect-smw-btn")
      .addEventListener("click", this.try_connect_smw.bind(this));
    document.addEventListener("update_form_fields", (e) => {
      e.stopImmediatePropagation();
      this.try_connect_smw(e);
    });
    document.addEventListener("status_checked", (e) => {
      e.stopImmediatePropagation();
      this.pdwStreamingCheck();
      this.adwStreamingCheck();
    });
  }

  async pdwStreamingCheck() {
    const pdwStreamDiv = this._form.querySelector("#pdw-streaming-ips");
    const checkbox = this._form.querySelector("#needs-pdw-streaming");
    if (checkbox.checked) {
      let pdwIpSection = "";
      for (let i = 0; i < this.pdwBasebands; i++) {
        pdwIpSection += `<label>BB_${i + 1} IP Address: </label>
        <input type="text" id="bb-pdw-ip-${i + 1}" value="${
          this.bbIps[i].ip_address
        }"/>
        <label>Subnet Mask: </label>
        <input type="text" id="bb-pdw-subnet-${i + 1}" value="${
          this.bbIps[i].subnet_mask
        }"/>
        <label>Default Gateway: </label>
        <input type="text" id="bb-pdw-gateway-${i + 1}" value="${
          this.bbIps[i].default_gateway
        }"/>
        <label>Port: </label>
        <input type="text" id="bb-pdw-port-${i + 1}" value="${
          this.bbIps[i].port
        }"/>`;
      }

      pdwStreamDiv.innerHTML = pdwIpSection;
      this._pdwStreamingChecked = true;
    } else {
      pdwStreamDiv.innerHTML = "";
      this._pdwStreamingChecked = false;
    }
  }

  async adwStreamingCheck() {
    console.log(this.adwInterface);
    const checkbox = this._form.querySelector("#needs-adw-streaming");
    const pdwStreamDiv = this._form.querySelector("#adw-streaming-ips");
    if (checkbox.checked) {
      pdwStreamDiv.innerHTML = `<label>Baseband IP: </label>
       <input type="text" id="bb-adw-ip" value="${this.adwInterface.ip_address}"/><label>Port:</label>
       <input type="text" id="bb-adw-port" value="${this.adwInterface.port}"/>`;
      this._adwStreamingChecked = true;
    } else {
      pdwStreamDiv.innerHTML = "";
      this._adwStreamingChecked = false;
    }
    console.log(pdwStreamDiv.querySelector("#bb-adw-port"));
  }

  async try_connect_smw(e) {
    e.preventDefault(e);
    const ipAddr = this._form.querySelector("#smw_ip").value;
    const res = await SmwsApi.tryConnectSmw(ipAddr);
    console.log(res.data.data);
    if (res.data.data.status === "Success") {
      document.querySelector(
        "#try-connect-status"
      ).innerHTML = `Status: SMW Connected`;
      const smw = res.data.data;
      this._connectionStatus = true;
      this.updateOptions(smw);
      this.displayOptions();
    } else {
      this._connectionStatus = false;
      document.querySelector(
        "#try-connect-status"
      ).innerHTML = `Status: Could not connect SMW`;
    }
  }

  updateOptions(smw) {
    this.pdwBasebands = smw.options.basebands;
    this.rfBandwidth = smw.options.rf_bandwidth;
    this.rfPorts = smw.options.rf_ports;
    this.rfFreq = smw.options.rf_freq;
    this.bbIps = smw.bb_ips;
    this.adwInterface = smw.adw_interface;
    console.log(smw);
  }

  displayOptions() {
    document.querySelector(
      "#pdw-basebands"
    ).innerHTML = `PDW Basebands: ${this.pdwBasebands}`;
    document.querySelector(
      "#rf-bandwidth"
    ).innerHTML = `RF Bandwidth: ${this.rfBandwidth}`;
    document.querySelector(
      "#rf-freq-range"
    ).innerHTML = `Frequency Range: ${this.rfFreq}`;
    document.querySelector(
      "#port-count"
    ).innerHTML = `RF Port Count: ${this.rfPorts}`;
  }

  getBasebandIps() {
    //only change ips if user has checked the checkbox
    if (this._form.querySelector("#needs-pdw-streaming").checked === true) {
      this.bbIps = [];
      for (let i = 0; i < this.pdwBasebands; i++) {
        const newIp = {
          ip_address: document.querySelector(`#bb-pdw-ip-${i + 1}`).value,
          subnet_mask: document.querySelector(`#bb-pdw-subnet-${i + 1}`).value,
          default_gateway: document.querySelector(`#bb-pdw-gateway-${i + 1}`)
            .value,
          port: document.querySelector(`#bb-pdw-port-${i + 1}`).value,
          active: false,
        };
        this.bbIps.push(newIp);
      }
    }
  }

  getAdwInterfaceIp() {
    this.adwInterface = {
      ip_address: document.querySelector("#bb-adw-ip").value,
      port: document.querySelector("#bb-adw-port").value,
    };
  }

  async handleSubmit(e) {
    e.preventDefault(e);

    //If fields are empty don't submit
    if (document.querySelector("#port-count").innerHTML === "RF Port Count: ") {
      // alert(
      //   "Try to connect to this SMW. Cannot submit unless it is on the network."
      // );
      return;
    }

    if (this._pdwStreamingChecked) {
      this.getBasebandIps();
    }
    if (this._adwStreamingChecked) {
      this.getAdwInterfaceIp();
    }

    const smw = {
      ip_address: this._form.elements.smw_ip.value,
      options: {
        rf_ports: this.rfPorts,
        rf_freq: this.rfFreq + "e9",
        rf_bandwidth: this.rfBandwidth + "e9",
        basebands: this.pdwBasebands,
      },
      bb_ips: this.bbIps,
      adw_interface: this.adwInterface,
    };

    this._smwList.updateOrAddSmw(smw);

    this.render();

    document.dispatchEvent(new Event("closemodal"));
  }

  render() {
    this._formModal.innerHTML = `<form id="smw-form">
          <div id="smw-title"><h2>SMW200A [0]</h2></div>
          <div class="form-control">
            <div id="smw-ip-block">
              <label for="smw-ip">Enter SMW200A IP Address:</label>
              <input type="text" name="smw_ip" id="smw_ip" value="192.168.1.55"/>
              <button id="connect-smw-btn">Try Connect</button>
            </div>
          </div>
          <div class="form-control">
          <label id="try-connect-status">Status: </label>
            <label id="port-count">RF Port Count: </label>
            <label id="pdw-basebands">PDW Basebands: </label>
            <label id="rf-bandwidth">Bandwidth: </label>
            <label id="rf-freq-range">Frequency Range: </label>
            <span>PDW Streaming: </span><input type="checkbox" name="needs-pdw-streaming" id="needs-pdw-streaming" />
            <div id="pdw-streaming-ips"></div>
            <span>ADW Streaming: </span><input type="checkbox" name="needs-adw-streaming" id="needs-adw-streaming" />
            <div id="adw-streaming-ips"></div>
            </div>
          <button class="btn" type="submit" id="submit">Submit SMW200A</button>
        </form>`;
    this._form = document.querySelector("#smw-form");

    this.addEventListeners();
  }
}

module.exports = SmwForm;
