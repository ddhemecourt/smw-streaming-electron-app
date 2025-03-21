const net = require("net");
const { resolve } = require("path");

class SmwUtilities {
  constructor() {
    this._smwControlPort = 5025;
    this._ip_address = "";
    this._decoder = new TextDecoder("ascii");
  }

  async writeread(dataIn) {
    return new Promise((resolve, reject) => {
      this._controlIntf.write(dataIn + "\n");
      this._controlIntf.on("data", (data) => {
        resolve(this._decoder.decode(data).trim());
      });
      this._controlIntf.on("error", (err) => {
        reject(err);
      });
    });
  }

  async initiateSmwControlInterface(ip_address) {
    return new Promise((resolve, reject) => {
      this._ip_address = ip_address;
      this._controlIntf = new net.Socket();

      const timeoutId = setTimeout(() => {
        this._controlIntf.destroy();
        reject("Not Connected");
      }, 1000);

      this._controlIntf.connect(this._smwControlPort, ip_address, async () => {
        clearTimeout(timeoutId);
        resolve("Connected");
      });

      this._controlIntf.on("error", (err) => {
        reject(err);
      });
    });
  }

  closeControlInterface() {
    this._controlIntf.destroy();
  }

  async optionsList() {
    const opts = await this.writeread("*OPT?");
    return { options: opts };
  }

  async getBasebandIps(bbNum) {
    try {
      let bbIps = [];
      for (let i = 0; i < bbNum; i++) {
        const ipAddress = await this.writeread(
          `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress?`
        );
        const subnetMask = await this.writeread(
          `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress:SUBNet:MASK?`
        );
        const defaultGateway = await this.writeread(
          `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress:GATeway?`
        );
        const port = await this.writeread(
          `:SYSTem:COMMunicate:BB${i + 1}:NETWork:PORT?`
        );
        const bbIp = {
          ip_address: ipAddress.split('"')[1],
          subnet_mask: subnetMask.split('"')[1],
          default_gateway: defaultGateway.split('"')[1],
          port: port,
        };
        bbIps.push(bbIp);
      }

      return bbIps;
    } catch (error) {
      return error;
    }
  }

  async setBasebandIps(smw) {
    const errString = "Something went wrong in setting SMW Baseband IP address";
    console.log(smw.bb_ips.length);
    for (let i = 0; i < +smw.bb_ips.length; i++) {
      //Set to static ip
      if (
        !(
          (await this.writeread(
            `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress:MODE STAT; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
      //Write IP Address
      if (
        !(
          (await this.writeread(
            `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress "${
              smw.bb_ips[i].ip_address
            }"; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
      //Write Subnet Mask
      if (
        !(
          (await this.writeread(
            `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress:SUBNet:MASK "${
              smw.bb_ips[i].subnet_mask
            }"; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
      //Write Default Gateway
      if (
        !(
          (await this.writeread(
            `:SYSTem:COMMunicate:BB${i + 1}:NETWork:IPADdress:GATeway "${
              smw.bb_ips[i].default_gateway
            }"; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
      //Write Port
      if (
        !(
          (await this.writeread(
            `:SYSTem:COMMunicate:BB${i + 1}:NETWork:PORT ${
              smw.bb_ips[i].port
            }; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
    }
    return "Success";
  }

  async initPdwStreaming(smw) {
    console.log("initializing pdw streaming");
    const errString = "Error on init pdw_streaming";

    const bbIPs = smw.bb_ips;

    console.log(bbIPs.length);
    if (bbIPs.length < 3) {
      for (let index = 0; index < bbIPs.length; index++) {
        if (
          (await this.writeread(
            `:SOURce${index + 1}:BB:ESEQuencer:MODE RTCI; *OPC?`
          )) !== "1"
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SOURce${index + 1}:BB:ESEQuencer:RTCI:PDWFormat EXP; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SOURce${
                index + 1
              }:BB:ESEQuencer:TRIGger:OUTPut1:MODE PDW; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SYSTem:COMMunicate:BB${
                index + 1
              }:NETWork:IPADdress:MODE STAT; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SOURce${index + 1}:BB:ESEQuencer:STATe ${
                bbIps[index].active === "true" ? `1` : `0`
              }; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
      }
    } else {
      if (
        !((await this.writeread(`:SCONfiguration:MODE ESEQ; *OPC?`)) === "1")
      ) {
        return errString;
      }
      if (!((await this.writeread(`:SCONfiguration:APPLy; *OPC?`)) === "1")) {
        return errString;
      }
      if (
        !(
          (await this.writeread(`:SOURce1:BB:ESEQuencer:MODE RTCI; *OPC?`)) ===
          "1"
        )
      ) {
        return errString;
      }
      if (
        !(
          (await this.writeread(
            `:SOURce1:BB:ESEQuencer:RTCI:PDWFormat EXP; *OPC?`
          )) === "1"
        )
      ) {
        return errString;
      }
      for (let index = 0; index < bbIPs.length; index++) {
        if (
          !(
            (await this.writeread(
              `:SOURce1:BB:ESEQuencer:SEQuencer${index + 1}:STATe 1; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SYSTem:COMMunicate:BB${
                index + 1
              }:NETWork:IPADdress:MODE STAT; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
        if (
          !(
            (await this.writeread(
              `:SOURce1:BB:ESEQuencer:TRIGger:SEQuencer${
                index + 1
              }:OUTPut1:MODE PDW; *OPC?`
            )) === "1"
          )
        ) {
          return errString;
        }
      }
      if (
        !(
          (await this.writeread(`:SOURce1:BB:ESEQuencer:STATe 1; *OPC?`)) ===
          "1"
        )
      ) {
        return errString;
      }
    }
    return "PDW Streaming Initiated";
  }

  async getAdwIps() {
    let adwIpSettings;

    const ipAddress = await this.writeread(
      `:SYSTem:COMMunicate:BB1:QSFP:NETWork:IPADdress?`
    );

    const port = await this.writeread(
      `:SYSTem:COMMunicate:BB1:QSFP:NETWork:PORT?`
    );

    // const subnetMask = await this.writeread(
    //   `:SYSTem:COMMunicate:BB1:QSFP:NETWork:IPADdres:SUBNet:MASK?`
    // );

    const adwIp = {
      ip_address: ipAddress.split('"')[1],
      port: port,
      // subnet_mask: subnetMask,
    };
    return adwIp;
  }

  async setAdwIps(smw) {
    await this.writeread(
      `:SYSTem:COMMunicate:BB1:QSFP:NETWork:IPADdress "${smw.adw_interface.ip_address}"; *OPC?`
    );
    await this.writeread(
      `:SYSTem:COMMunicate:BB1:QSFP:NETWork:PORT ${smw.adw_interface.port}; *OPC?`
    );
    // await this.writeread(
    //   `:SYSTem:COMMunicate:BB1:QSFP:NETWork:IPADdres:SUBNet:MASK ${adwInterface.subnet_mask}`
    // );
  }

  async initAdwStreaming(smw) {
    const errString = "Error initializing adw streaming";

    if (
      !(
        (await this.writeread(`:SOURce1:BB:ESEQuencer:MODE ASEQ; *OPC?`)) ===
        "1"
      )
    ) {
      return errString;
    }

    if (
      !(
        (await this.writeread(
          `:SOURce1:BB:ESEQuencer:ASEQ:OMODe INST; *OPC?`
        )) === "1"
      )
    ) {
      return errString;
    }

    if (
      !(
        (await this.writeread(
          `:SYSTem:COMM:BB1:QSFP:NETWork:IPADdress "${smw.adw_interface.ip_address}"; *OPC?`
        )) === "1"
      )
    ) {
      return errString;
    }
    console.log(smw.adw_interface.port);

    if (
      !(
        (await this.writeread(
          `:SYSTem:COMM:BB1:QSFP:NETWork:PORT ${smw.adw_interface.port}; *OPC?`
        )) === "1"
      )
    ) {
      return errString;
    }
  }

  parseSmwBasebandOptions(opts) {
    const options = opts.options;
    //basebands
    let basebands;
    let b9s = 0;
    let b15s = 0;
    let k503s = 0;
    let k315 = false;
    options.split(",").forEach((opt) => {
      if (opt === "SMW-B9") b9s++;
      if (opt === "SMW-B15") b15s++;
      if (opt === "SMW-K315") k315 = true;
      if (opt === "SMW-K503") k503s++;
    });
    console.log(`B9s: ${b9s}, B15s: ${b15s}`);
    basebands = b9s + b15s;

    if (b15s > 0 && b9s < 2) {
      basebands = b9s;
    }
    if (k315 === false) basebands = b9s;
    if (k503s < b9s) basebands = k503s;

    return basebands;
  }

  parseSmwBandwidthOptions(opts) {
    const options = opts.options;
    let bandwidth = 500;
    options.split(",").forEach((opt) => {
      if (opt === "SMW-K525") bandwidth = 1000;
      if (opt === "SMW-K527") bandwidth = 2000;
    });
    return bandwidth;
  }

  parseSmwFreqOptions(opts) {
    const options = opts.options;
    let freq;
    options.split(",").forEach((opt) => {
      if (opt === "SMW-B1003") freq = 3;
      if (opt === "SMW-B1006") freq = 6;
      if (opt === "SMW-B1007") freq = 7.5;
      if (opt === "SMW-B1012") freq = 12.75;
      if (opt === "SMW-B1020") freq = 20;
      if (opt === "SMW-B1031") freq = 31.8;
      if (opt === "SMW-B1040") freq = 40;
      if (opt === "SMW-B1040N") freq = 40;
      if (opt === "SMW-B1044") freq = 44;
      if (opt === "SMW-B1044N") freq = 44;
      if (opt === "SMW-B1056") freq = 56;
      if (opt === "SMW-B1067") freq = 67;
    });
    return freq;
  }

  parseSmwPortCountOptions(opts) {
    const options = opts.options;
    let ports = undefined;
    options.split(",").forEach((opt) => {
      if (opt.length > 8 && opt.slice(0, 7) === "SMW-B10") ports = 1;
      if (opt.length > 8 && opt.slice(0, 7) === "SMW-B20") ports = 2;
    });
    return ports;
  }

  async getStreamingOptions() {
    const options = await this.optionsList();
    const basebands = this.parseSmwBasebandOptions(options);
    const rfBandwidth = this.parseSmwBandwidthOptions(options);
    const rfPorts = this.parseSmwPortCountOptions(options);
    const rfFreq = this.parseSmwFreqOptions(options);
    let bbIps = await this.getBasebandIps(+basebands);
    let adwInterface = await this.getAdwIps();

    const smw = {
      ip_address: this._ip_address,
      options: {
        rf_ports: rfPorts,
        rf_freq: rfFreq,
        rf_bandwidth: rfBandwidth,
        basebands: basebands,
      },
      bb_ips: bbIps,
      adw_interface: adwInterface,
    };

    return smw;
  }

  async executeBBTrigger() {
    await this.writeread(`:SOURce1:BB:ESEQuencer:TRIGger:EXECute; *OPC?`);
  }
  async armBBTrigger() {
    await this.writeread(`:SOURce1:BB:ESEQuencer:TRIGger:ARM:EXECute; *OPC?`);
  }
}

module.exports = SmwUtilities;
