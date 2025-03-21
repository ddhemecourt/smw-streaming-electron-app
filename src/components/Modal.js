class Modal {
  constructor(modalBtnId) {
    this._modal = document.querySelector("#modal");
    this._modalBtn = document.querySelector(modalBtnId);
    this.addEventListeners();
  }

  addEventListeners() {
    // this._modalBtn.addEventListener("click", this.open.bind(this));
    window.addEventListener("click", this.outsideClick.bind(this));
    document.addEventListener("closemodal", () => this.close());
    document.addEventListener("openmodal", () => this.open());
  }

  open() {
    this._modal.style.display = "block";
  }

  close() {
    this._modal.style.display = "none";
  }

  outsideClick(e) {
    if (e.target === this._modal) {
      this.close();
    }
  }
}

module.exports = Modal;
