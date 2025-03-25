let exec = require('child_process').execFile;
const net = require('net');
const { resolve } = require('path');
const path = require('node:path');

class EmtterUtilities {
  constructor() {
    this.emitterProcess;
    // this.command = "../c_exec/cyclic_PDW_test";
    this.command = path.join(__dirname, '..', 'c_exec', 'cyclic_PDW_test');
    // this.command = path.join(process.resourcesPath, "cyclic_PDW_test");
    this.ipAddress = '127.0.0.1';
    this.port = 8080;
    this.emitterSocket;
  }

  async startEmitterExecutable(smw, bbIps) {
    const smwIp = smw.ip_address;
    console.log('SMW and BBS IPS: ' + smwIp + ' ' + bbIps);
    let args = [];
    for (let i = 0; i < bbIps.length; i++) {
      console.log(bbIps[i]);
      args.push(`${bbIps[i]}`);
    }
    args.push(`${smwIp}`);
    console.log(`Full string: ${this.command}`);
    return new Promise((resolve, reject) => {
      this.emitterProcess = exec(
        this.command,
        args,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            reject('There was an issue');
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          // reject("There was an issue");
        }
      );
      console.log('Started Executable');
      setTimeout(() => {
        resolve('Success');
      }, 3000);
    });
  }

  async stopEmitterExecutable() {
    return new Promise((resolve, reject) => {
      if (!this.emitterProcess) {
        resolve('No process to stop.');
      }
      this.emitterProcess.kill('SIGTERM');
      this.emitterProcess = null;
      this.emitterSocket.destroy();
      setTimeout(() => {
        console.log('Closed process');
        resolve('Success closed thread');
      }, 2000);
    });
  }

  async initEmitterSocket() {
    return new Promise((resolve, reject) => {
      this.emitterSocket = new net.Socket();
      const timeoutId = setTimeout(() => {
        this.emitterSocket.destroy();
        reject('ERROR: Timeout');
      }, 3000);
      this.emitterSocket.connect(this.port, this.ipAddress, () => {
        clearTimeout(timeoutId);
        resolve(`Success`);
        console.log('Connected socket');
      });
      this.emitterSocket.on('error', (err) => {
        console.error('Error:', err);
      });
    });
  }

  async stopEmitterSocket() {
    return new Promise((resolve, reject) => {
      this.emitterSocket.destroy();
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  sendEmitterPacket(emitters) {
    //To do: review format sent from matalb
    const header = 'EMITTER,';
    const basebands = emitters[0].basebands;
    // const basebands = "1";

    let emitterWord = '';

    emitterWord += header;
    emitterWord += basebands;

    for (const emitter of emitters) {
      let mop;
      switch (emitter.mop) {
        case 'Unmod':
          mop = 0;
          break;
        case 'LFM':
          mop = 1;
          break;
        case 'TLFM':
          mop = 2;
          break;
        case 'Barker':
          mop = 3;
          break;
        case 'Arb Seg':
          mop = 4;
          break;
      }

      let edgeType;
      switch (emitter.edge_shape) {
        case 'LIN':
          edgeType = 0;
          break;
        case 'COS':
          edgeType = 1;
          break;
      }

      const bursted = '0';
      const cpi = '0';
      const burstLength = '0';
      const cpiOffset = '0';
      const directionIndex = '0';

      emitterWord = this.appendField(emitterWord, mop);
      emitterWord = this.appendField(emitterWord, emitter.pri);
      emitterWord = this.appendField(emitterWord, emitter.pw);
      emitterWord = this.appendField(emitterWord, emitter.time_offset);
      emitterWord = this.appendField(emitterWord, edgeType);
      emitterWord = this.appendField(emitterWord, emitter.rise_time);
      emitterWord = this.appendField(emitterWord, emitter.fall_time);
      emitterWord = this.appendField(emitterWord, emitter.barker_chip_width);
      emitterWord = this.appendField(emitterWord, emitter.barker_code);
      emitterWord = this.appendField(emitterWord, emitter.freq_offset);
      emitterWord = this.appendField(emitterWord, emitter.level_offset);
      emitterWord = this.appendField(emitterWord, emitter.phase_offset);
      emitterWord = this.appendField(emitterWord, emitter.lfm_bandwidth);
      emitterWord = this.appendField(emitterWord, bursted);
      emitterWord = this.appendField(emitterWord, cpi);
      emitterWord = this.appendField(emitterWord, burstLength);
      emitterWord = this.appendField(emitterWord, cpiOffset);
      emitterWord = this.appendField(emitterWord, directionIndex);
    }

    console.log('emitterWord: ' + emitterWord);
    emitterWord += '\n';
    this.emitterSocket.write(emitterWord);
    //Send word
  }

  appendField(str, newField) {
    str = str + ',' + newField;
    return str;
  }
}
module.exports = EmtterUtilities;
