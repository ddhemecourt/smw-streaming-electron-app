const axios = require("axios");
class EmittersApi {
  constructor() {
    this._apiURL = "http://localhost:5000/api/emitters";
  }

  getEmitters() {
    return axios.get(this._apiURL);
  }

  addEmitter(data) {
    return axios.post(this._apiURL, data);
  }

  updateEmitter(id, data) {
    return axios.put(`${this._apiURL}/${id}`, data);
  }

  deleteEmitter(id) {
    return axios.delete(`${this._apiURL}/${id}`, {
      data: { text: "" },
    });
  }
}

module.exports = new EmittersApi();
