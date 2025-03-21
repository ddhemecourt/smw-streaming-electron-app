const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const EmitterSchema = new mongoose.Schema({
  basebands: {
    type: String,
    require: true,
  },
  pw: {
    type: String,
    require: true,
  },
  pri: {
    type: String,
    require: true,
  },
  mop: {
    type: String,
    require: true,
  },
  time_offset: {
    type: String,
    require: true,
  },
  freq_offset: {
    type: String,
    require: true,
  },
  level_offset: {
    type: String,
    require: true,
  },
  phase_offset: {
    type: String,
    require: true,
  },
  rise_time: {
    type: String,
    require: true,
  },
  fall_time: {
    type: String,
    require: true,
  },
  edge_shape: {
    type: String,
    require: true,
  },
  arb_seg_index: {
    type: String,
    require: true,
  },
  lfm_bandwidth: {
    type: String,
    require: true,
  },
  barker_code: {
    type: String,
    require: true,
  },
  barker_chip_width: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Emitter", EmitterSchema);
