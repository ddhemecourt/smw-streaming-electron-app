const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const PdwSchema = new mongoose.Schema({
  basebands: {
    type: String,
    require: true,
  },
  toa: {
    type: String,
    require: true,
  },
  word_type: {
    type: String,
    require: true,
  },
  mop: {
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
  pulse_width: {
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
  barker_chip_width: {
    type: String,
    require: true,
  },
  barker_code: {
    type: String,
    require: true,
  },
  m1: {
    type: String,
    require: true,
  },
  m2: {
    type: String,
    require: true,
  },
  m3: {
    type: String,
    require: true,
  },
  repetitions: {
    type: String,
    require: true,
  },
  burst_pri: {
    type: String,
  },
  tcdw_path: {
    type: String,
    require: true,
  },
  tcdw_command: {
    type: String,
    require: true,
  },
  tcdw_freq: {
    type: String,
    require: true,
  },
  tcdw_level: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Pdw", PdwSchema);
