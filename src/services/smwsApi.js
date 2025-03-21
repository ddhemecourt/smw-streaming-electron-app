const axios = require("axios");
class SmwsApi {
  constructor() {
    this._apiRoot = "http://localhost:5000/api/smws";
    this._apiURL = "http://localhost:5000/api/smws/smw_list";
  }

  getSmws() {
    return axios.get(this._apiURL);
  }

  addSmw(data) {
    return axios.post(this._apiURL, data);
  }

  connectSmw(id, data) {
    return axios.post(`${this._apiURL}/${id}/connect`, data);
  }

  tryConnectSmw(ipAddress) {
    const data = { ip_address: ipAddress };
    return axios.post(`${this._apiRoot}/connect`, data);
  }

  updateSmw(id, data) {
    return axios.put(`${this._apiURL}/${id}`, data);
  }

  deleteSmw(id) {
    return axios.delete(`${this._apiURL}/${id}`, {
      data: { text: "" },
    });
  }

  initPdwStreaming(id) {
    const data = {};
    return axios.post(`${this._apiURL}/${id}/init_pdw_streaming`, data);
  }

  closePdwStreams() {
    return axios.post(`${this._apiRoot}/close_pdw_sockets`, "");
  }

  streamPdwList(data) {
    return axios.post(`${this._apiRoot}/stream_pdw_list`, data);
  }

  initAdwStreaming(id) {
    const data = {};
    return axios.post(`${this._apiURL}/${id}/init_adw_streaming`, data);
  }

  streamAdw(adw) {
    return axios.post(`${this._apiRoot}/stream_adw`, adw);
  }

  //Emitter interface connection
  initEmitterStreaming(smws) {
    return axios.post(`${this._apiRoot}/init_emitter_streaming`, smws);
  }

  stopEmitterStreaming() {
    return axios.post(`${this._apiRoot}/stop_emitter_streaming`, "");
  }

  streamEmitters(emitters) {
    return axios.post(`${this._apiRoot}/stream_emitters`, emitters);
  }
}

module.exports = new SmwsApi();
