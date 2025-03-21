const axios = require("axios");
class PdwsApi {
  constructor() {
    this._apiURL = "http://localhost:5000/api/pdws";
  }

  getPdws() {
    return axios.get(this._apiURL);
  }

  addPdw(data) {
    return axios.post(this._apiURL, data);
  }

  updatePdw(id, data) {
    return axios.put(`${this._apiURL}/${id}`, data);
  }

  deletePdw(id) {
    return axios.delete(`${this._apiURL}/${id}`, {
      data: { text: "" },
    });
  }
}

module.exports = new PdwsApi();
