const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const SmwSchema = new mongoose.Schema({
  ip_address: {
    type: String,
    require: true,
  },
  options: {
    rf_ports: {
      type: String,
      require: true,
    },
    rf_freq: {
      type: String,
      require: true,
    },
    rf_bandwidth: {
      type: String,
      require: true,
    },
    basebands: {
      type: String,
      require: true,
    },
  },
  bb_ips: [
    {
      ip_address: {
        type: String,
      },
      subnet_mask: {
        type: String,
      },
      default_gateway: {
        type: String,
      },
      port: {
        type: String,
      },
      active: {
        type: String,
      },
    },
  ],
  adw_interface: {
    ip_address: {
      type: String,
    },
    port: {
      type: String,
    },
    // subnet_mask: {
    //   type: String,
    // },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Smw", SmwSchema);
