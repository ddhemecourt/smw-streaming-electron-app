const axios = require("axios");
class AdwsApi {
  constructor() {
    this._apiURL = "http://localhost:5000/api/adws";
  }

  getAdws() {
    return axios.get(this._apiURL);
  }

  addAdw(data) {
    return axios.post(this._apiURL, data);
  }

  updateAdw(id, data) {
    return axios.put(`${this._apiURL}/${id}`, data);
  }

  deleteAdw(id) {
    // console.log("adwsapi delete");
    return axios.delete(`${this._apiURL}/${id}`, {
      data: { text: "" },
    });
  }
}

module.exports = new AdwsApi();
