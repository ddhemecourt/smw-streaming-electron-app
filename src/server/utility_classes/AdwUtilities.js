const dgram = require("node:dgram");
const { resolve } = require("path");

class AdwUtilities {
  constructor() {}

  setAdwSocketParams(adw_interface) {
    this.port = adw_interface.port;
    this.ipAddress = adw_interface.ip_address;
  }

  async sendAdw(adw) {
    const adw_word = this.constructAdw(adw);
    this.adwSocket = dgram.createSocket("udp4");

    let buffer = Buffer.alloc(32);
    for (let i = 0; i < adw_word.length; i++) {
      buffer.writeUInt8(adw_word[i], i);
    }

    await this.adwSocket.send(buffer, this.port, this.ipAddress, (err) => {
      if (err) {
        console.log("Error sending message:", err);
        this.adwSocket.close();
        return;
      }
      console.log(`ADW sent to ${this.ipAddress}:${this.port}`);
    });

    this.adwSocket.close();
  }

  constructAdw(adw) {
    const FREQ_OFFSET = Math.round(
      (+adw.freq_offset / 2.4e9) * Math.pow(2, 32)
    );
    const LEVEL_OFFSET = Math.round(
      Math.pow(10, -+adw.level_offset / 20) * (Math.pow(2, 15) - 1)
    );
    const PHASE_OFFSET = Math.round(
      (+adw.phase_offset / 360) * Math.pow(2, 16)
    );

    const USE_EXTENSION = adw.use_extension === "true" ? 1 : 0;
    const SEG = adw.seg === "true" ? 1 : 0;
    const SEG_INTERRUPT = adw.seg_interrupt === "true" ? 1 : 0;
    const IGNORE_ADW = adw.ignore_adw === "true" ? 1 : 0;
    const M1 = adw.m1 === "true" ? 1 : 0;
    const M2 = adw.m2 === "true" ? 1 : 0;
    const M3 = adw.m3 === "true" ? 1 : 0;

    const SEGMENT_IDX = +adw.segment_index;
    const BURST_SRI = +adw.burst_sri * 1e-6 * 2.4e9;
    const BURST_ADD_SEGMENTS = +adw.burst_add_segments;

    console.log(BURST_SRI, BURST_ADD_SEGMENTS);

    let adw_word = [];

    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push((0x00 | (SEG << 3) | (USE_EXTENSION << 2)) & 0xff);
    adw_word.push(
      (0x00 |
        (adw.SEG_INTERRUPT << 6) |
        (false << 5) |
        (adw.IGNORE_ADW << 4) |
        (false << 3) |
        (M3 << 2) |
        (M2 << 1) |
        M1) &
        0xff
    );
    adw_word.push((FREQ_OFFSET >> 24) & 0xff);
    adw_word.push((FREQ_OFFSET >> 16) & 0xff);
    adw_word.push((FREQ_OFFSET >> 8) & 0xff);
    adw_word.push(FREQ_OFFSET & 0xff);
    adw_word.push((LEVEL_OFFSET >> 8) & 0xff);
    adw_word.push(LEVEL_OFFSET & 0xff);
    adw_word.push((PHASE_OFFSET >> 8) & 0xff);
    adw_word.push(PHASE_OFFSET & 0xff);
    adw_word.push((SEGMENT_IDX >> 16) & 0xff);
    adw_word.push((SEGMENT_IDX >> 8) & 0xff);
    adw_word.push(SEGMENT_IDX & 0xff);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push(0x00);
    adw_word.push((BURST_SRI >> 24) & 0xff);
    adw_word.push((BURST_SRI >> 16) & 0xff);
    adw_word.push((BURST_SRI >> 8) & 0xff);
    adw_word.push(BURST_SRI & 0xff);
    adw_word.push((BURST_ADD_SEGMENTS >> 8) & 0xff);
    adw_word.push(BURST_ADD_SEGMENTS & 0xff);

    console.log(adw_word);
    return adw_word;
  }
}

module.exports = AdwUtilities;
