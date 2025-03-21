const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const AdwSchema = new mongoose.Schema({
  seg: {
    type: String,
    require: true,
  },
  use_extension: {
    type: String,
    require: true,
  },
  seg_interrupt: {
    type: String,
    require: true,
  },
  ignore_adw: {
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
  segment_index: {
    type: String,
    require: true,
  },
  burst_sri: {
    type: String,
    require: true,
  },
  burst_add_segments: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Adw", AdwSchema);
