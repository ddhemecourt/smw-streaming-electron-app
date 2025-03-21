const net = require("net");
const { resolve } = require("path");

class PdwUtilities {
  constructor() {
    this.pdwSockets = {};
    // this.buffer = Buffer.alloc(48 * 10); //48 byte words, 10 word packets
  }

  async closeAllPdwStreams() {
    for (let i = 0; i < Object.keys(this.pdwSockets).length; i++) {
      this.pdwSockets[i].destroy();
    }
    this.pdwSockets = {};
  }

  async checkPdwSocketStatus(smws) {
    smws.forEach((smw) => {
      for (let i = 0; i < smw.bb_ips.length; i++) {
        smw.bb_ips[i].active = "false";
        for (let j = 0; j < Object.keys(this.pdwSockets).length; j++) {
          if (smw.bb_ips[i].ip_address === this.pdwSockets[j].remoteAddress) {
            console.log(
              i,
              j,
              this.pdwSockets[j].remoteAddress,
              this.pdwSockets[j].readyState
            );
            if (this.pdwSockets[j].readyState === "open") {
              smw.bb_ips[i].active = "true";
            } else {
              smw.bb_ips[i].active = "false";
            }
          }
        }
      }
    });
    return smws;
  }

  async initPdwSockets(smw) {
    for (let i = 0; i < smw.bb_ips.length; i++) {
      try {
        await this.initPdwSocket(smw.bb_ips[i]);
      } catch (error) {
        return `Error: BB_${i + 1}`;
      }
    }
    return `Success`;
  }

  async initPdwSocket(bbIp) {
    return new Promise((resolve, reject) => {
      const pdwIdxs = Object.keys(this.pdwSockets);
      let newPdwIdx;
      if (pdwIdxs.length > 0) {
        newPdwIdx = +pdwIdxs[pdwIdxs.length - 1] + 1;
      } else {
        newPdwIdx = 0;
      }
      let newPdwSocket = new net.Socket();
      if (bbIp.active === "true") {
        const timeoutId = setTimeout(() => {
          newPdwSocket.destroy();
          // this.pdwSockets = {};
          // console.log("Connection timed out after 3 seconds");
          reject("ERROR: Connection timed out after 3 seconds");
        }, 3000);

        newPdwSocket.connect(bbIp.port, bbIp.ip_address, async () => {
          // clearTimeout(timeoutId);
          this.pdwSockets[newPdwIdx] = newPdwSocket;
          clearTimeout(timeoutId);
          resolve(
            `Socket initialized on SMW BB IP: ${bbIp.ip_address} Port: ${bbIp.port}`
          );
        });
      } else {
        this.pdwSockets[newPdwIdx] = newPdwSocket;
        resolve(
          `Socket created, not initialized on SMW BB IP: ${bbIp.ip_address} Port: ${bbIp.port}`
        );
      }
    });
  }

  createPdwPacket(dataArray) {
    for (let i = 0; i < dataLength; i++) {
      buffer.writeUInt8(dataArray[i], i);
    }
    return buffer;
  }

  //   const byteArray = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // Example: "Hello" in ASCII
  //   const tcpPacket = createTcpPacket(byteArray);

  //   console.log(tcpPacket);

  async streamPdwLists(pdwList) {
    const pdwLists = await this.pdwListToPdwLists(pdwList);
    for (let i = 0; i < Object.keys(this.pdwSockets).length; i++) {
      console.log(pdwLists[i], i, pdwLists);
      await this.streamPdwList(pdwLists[i], i);
    }
  }

  async streamPdwList(pdwList, socket) {
    const buffLen = 48 * 10; //48 byte words, 10 word packets
    let buffer = Buffer.alloc(buffLen); //buffer per baseband
    let buffTailPtr = 0;
    for (let i = 0; i < pdwList.length; i++) {
      const pdw = this.constructPdwExpert(pdwList[i]);
      for (let j = 0; j < pdw.length; j++) {
        buffer.writeUInt8(pdw[j], buffTailPtr);
        buffTailPtr++;
      }
      if ((i + 1) % 10 === 0) {
        console.log("sending pdw packet with length 10 pdws");
        this.pdwSockets[socket].write(buffer.subarray(0, buffTailPtr));
        buffTailPtr = 0;
      }
      if (i === pdwList.length - 1) {
        this.pdwSockets[socket].write(buffer.subarray(0, buffTailPtr));
        buffTailPtr = 0;
      }
    }
  }

  async pdwListToPdwLists(pdwList) {
    let pdwLists = {};
    for (let i = 0; i < Object.keys(this.pdwSockets).length; i++) {
      const newKey = Object.keys(this.pdwSockets)[i];
      pdwLists[newKey] = [];
    }
    pdwList.forEach((pdw) => {
      const bbs = pdw.basebands.split(",");
      bbs.forEach((bb) => {
        pdwLists[+bb - 1].push(pdw);
      });
    });
    // console.log(pdwLists);
    return pdwLists;
  }

  constructPdwExpert(pdw) {
    if (pdw.word_type === "TCDW") {
      return this.constructTcdw(pdw);
    }
    const toa = BigInt(Math.round(+pdw.toa * 2.4e9));
    const seg = pdw.mop === "Arb Seg" ? 1 : 0;
    const freq_offset = Math.round(
      (+pdw.freq_offset / 2.4e9) * Math.pow(2, 32)
    );
    const level_offset = Math.round(
      Math.pow(10, -pdw.level_offset / 20) * (Math.pow(2, 15) - 1)
    );
    const phase_offset = Math.round((pdw.phase_offset / 360) * Math.pow(2, 16));
    const ton = Math.round(pdw.pulse_width * 1e-6 * 2.4e9);
    const edge_type = pdw.edge_type === "LIN" ? 0 : 1;
    const rise_time = pdw.rise_time * 1e-9 * 2.4e9;
    const fall_time = pdw.fall_time * 1e-9 * 2.4e9;
    const freq_inc = BigInt(
      Math.round(((pdw.lfm_bandwidth * 1e6) / ton / 2.4e9) * Math.pow(2, 64))
    );
    const chip_width = pdw.barker_chip_width * 1e-6 * 2.4e9;
    const m1 = pdw.m1 === "true" ? 1 : 0;
    const m2 = pdw.m2 === "true" ? 1 : 0;
    const m3 = pdw.m3 === "true" ? 1 : 0;

    const burst_pri = pdw.burst_pri * 1e-6 * 2.4e9;
    const burst_add_segments = +pdw.repetitions;

    let pdw_word = [];

    pdw_word.push(Number((toa >> BigInt(44)) & BigInt(0xff)));
    pdw_word.push(Number((toa >> BigInt(36)) & BigInt(0xff)));
    pdw_word.push(Number((toa >> BigInt(28)) & BigInt(0xff)));
    pdw_word.push(Number((toa >> BigInt(20)) & BigInt(0xff)));
    pdw_word.push(Number((toa >> BigInt(12)) & BigInt(0xff)));
    pdw_word.push(Number((toa >> BigInt(4)) & BigInt(0xff)));
    pdw_word.push(
      Number(
        ((toa << BigInt(4)) |
          (BigInt(seg) << BigInt(3)) |
          (BigInt(true) << BigInt(2)) |
          BigInt(0x00)) &
          BigInt(0xff)
      )
    );
    // console.log(toa, toa >> 4, toa << 4, pdw_word);
    //flags
    pdw_word.push(0x00 | (pdw.M3 << 2) | (pdw.M2 << 1) | pdw.M1);

    //body
    pdw_word.push((freq_offset >> 24) & 0xff);
    pdw_word.push((freq_offset >> 16) & 0xff);
    pdw_word.push((freq_offset >> 8) & 0xff);
    pdw_word.push(freq_offset & 0xff);
    pdw_word.push((level_offset >> 8) & 0xff);
    pdw_word.push(level_offset & 0xff);
    pdw_word.push((phase_offset >> 8) & 0xff);
    pdw_word.push(phase_offset & 0xff);

    //payload
    if (pdw.mop === "Unmod") {
      pdw_word.push(0x00 | (ton >> 40));
      pdw_word.push((ton >> 32) & 0xff);
      pdw_word.push((ton >> 24) & 0xff);
      pdw_word.push((ton >> 16) & 0xff);
      pdw_word.push((ton >> 8) & 0xff);
      pdw_word.push(ton & 0xff);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
    } else if (pdw.mop === "LFM") {
      pdw_word.push((0x01 << 4) | (ton >> 24));
      pdw_word.push((ton >> 16) & 0xff);
      pdw_word.push((ton >> 8) & 0xff);
      pdw_word.push(ton & 0xff);
      // pdw_word.push(Number((toa >> BigInt(44)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(56)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(48)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(40)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(32)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(24)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(16)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(8)) & BigInt(0xff)));
      pdw_word.push(Number(freq_inc & BigInt(0xff)));
    } else if (pdw.mop === "TLFM") {
      pdw_word.push((0x02 << 4) | (ton >> 24));
      pdw_word.push((ton >> 16) & 0xff);
      pdw_word.push((ton >> 8) & 0xff);
      pdw_word.push(ton & 0xff);
      pdw_word.push(Number((freq_inc >> BigInt(56)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(48)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(40)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(32)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(24)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(16)) & BigInt(0xff)));
      pdw_word.push(Number((freq_inc >> BigInt(8)) & BigInt(0xff)));
      pdw_word.push(Number(freq_inc & BigInt(0xff)));
    } else if (pdw.mop == "Barker") {
      pdw_word.push((0x03 << 4) | (chip_width >> 40));
      pdw_word.push((chip_width >> 32) & 0xff);
      pdw_word.push((chip_width >> 24) & 0xff);
      pdw_word.push((chip_width >> 16) & 0xff);
      pdw_word.push((chip_width >> 8) & 0xff);
      pdw_word.push(chip_width & 0xff);
      pdw_word.push((+pdw.barker_code << 4) | 0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
    } else if (pdw.mop == "Arb Seg") {
      pdw_word.push((+pdw.arb_seg_index >> 16) & 0xff);
      pdw_word.push((+pdw.arb_seg_index >> 8) & 0xff);
      pdw_word.push(+pdw.arb_seg_index & 0xff);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
      pdw_word.push(0x00);
    }

    //extension flags
    if (+pdw.repetitions === 0) {
      pdw_word.push(0x20);
      pdw_word.push(0x00);
    } else {
      pdw_word.push(0x28);
      pdw_word.push(0x00);
    }

    //rise time field
    pdw_word.push((edge_type << 5) | (false << 4) | (rise_time >> 18));
    pdw_word.push((rise_time >> 10) & 0xff);
    pdw_word.push((rise_time >> 2) & 0xff);
    pdw_word.push((rise_time << 6) | (fall_time >> 16));
    pdw_word.push(fall_time >> 8);
    pdw_word.push(fall_time);

    //burst field
    pdw_word.push((burst_pri >> 24) & 0xff);
    pdw_word.push((burst_pri >> 16) & 0xff);
    pdw_word.push((burst_pri >> 8) & 0xff);
    pdw_word.push(burst_pri & 0xff);
    pdw_word.push((burst_add_segments >> 8) & 0xff);
    pdw_word.push(burst_add_segments & 0xff);

    //unused field
    pdw_word.push(0x00);
    pdw_word.push(0x00);
    pdw_word.push(0x00);
    pdw_word.push(0x00);
    pdw_word.push(0x00);
    pdw_word.push(0x00);

    return pdw_word;
  }

  constructTcdw(pdw) {
    const tcdw = pdw;
    const toa = BigInt(Math.round(+tcdw.toa * 2.4e9));
    const FVAL = BigInt(+tcdw.tcdw_freq);
    let L_POSNEG;
    let CMD;
    let L_INT;
    let L_TENTH;
    let L_HUND;
    console.log(tcdw.tcdw_path);
    console.log(tcdw.tcdw_command);
    let PATH = tcdw.tcdw_path === "A" ? 0 : 1;

    if (tcdw.tcdw_level <= 0) {
      L_POSNEG = 1;
    } else {
      L_POSNEG = 0;
    }

    let temp;
    if (tcdw.tcdw_level < 0) {
      temp = -1 * tcdw.tcdw_level;
    } else {
      temp = tcdw.tcdw_level;
    }

    L_INT = Math.floor(temp);
    L_TENTH = Math.floor(10 * (temp - Math.floor(temp)));
    L_HUND =
      Math.floor(100 * (temp - Math.floor(temp))) -
      10 * Math.floor(10 * (temp - Math.floor(temp)));

    if ("Frequency" === tcdw.tcdw_command) {
      CMD = 0;
    } else if ("Amplitude" === tcdw.tcdw_command) {
      CMD = 1;
    } else if ("Frequency & Amplitude" === tcdw.tcdw_command) {
      CMD = 2;
    } else if ("Re-Arm" === tcdw.tcdw_command) {
      CMD = 3;
    }
    let tcdw_word = [];
    tcdw_word.push(Number((toa >> BigInt(44)) & BigInt(0xff)));
    tcdw_word.push(Number((toa >> BigInt(36)) & BigInt(0xff)));
    tcdw_word.push(Number((toa >> BigInt(28)) & BigInt(0xff)));
    tcdw_word.push(Number((toa >> BigInt(20)) & BigInt(0xff)));
    tcdw_word.push(Number((toa >> BigInt(12)) & BigInt(0xff)));
    tcdw_word.push(Number((toa >> BigInt(4)) & BigInt(0xff)));
    tcdw_word.push(
      Number(
        ((toa << BigInt(4)) | (BigInt(PATH) << BigInt(3)) | BigInt(CMD)) &
          BigInt(0xff)
      )
    );
    tcdw_word.push(0x80);
    tcdw_word.push(Number((FVAL >> BigInt(32)) & BigInt(0xff)));
    tcdw_word.push(Number((FVAL >> BigInt(24)) & BigInt(0xff)));
    tcdw_word.push(Number((FVAL >> BigInt(16)) & BigInt(0xff)));
    tcdw_word.push(Number((FVAL >> BigInt(8)) & BigInt(0xff)));
    tcdw_word.push(Number(FVAL & BigInt(0xff)));
    tcdw_word.push((L_POSNEG << 7) | L_INT);
    tcdw_word.push(L_TENTH | L_HUND);
    tcdw_word.push(0x00);
    console.log(tcdw_word);
    return tcdw_word;
  }
}

module.exports = PdwUtilities;
