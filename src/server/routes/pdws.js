const express = require("express");
const router = express.Router();
const Pdw = require("../models/Pdw");

//get all PDWs
router.get("/", async (req, res) => {
  try {
    const pdws = await Pdw.find();
    res.json({ success: true, data: pdws });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//get PDW with id
router.get("/:id", async (req, res) => {
  const pdw = await Pdw.findById(req.params.id);
  try {
    res.json({ success: true, data: pdw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//add pdw
router.post("/", async (req, res) => {
  const pdw = new Pdw({
    basebands: req.body.basebands,
    toa: req.body.toa,
    word_type: req.body.word_type,
    mop: req.body.mop,
    freq_offset: req.body.freq_offset,
    level_offset: req.body.level_offset,
    phase_offset: req.body.phase_offset,
    pulse_width: req.body.pulse_width,
    rise_time: req.body.rise_time,
    fall_time: req.body.fall_time,
    edge_shape: req.body.edge_shape,
    repetitions: req.body.repetitions,
    arb_seg_index: req.body.arb_seg_index,
    lfm_bandwidth: req.body.lfm_bandwidth,
    barker_chip_width: req.body.barker_chip_width,
    barker_code: req.body.barker_code,
    m1: req.body.m1,
    m2: req.body.m2,
    m3: req.body.m3,
    tcdw_path: req.body.tcdw_path,
    tcdw_command: req.body.tcdw_command,
    tcdw_freq: req.body.tcdw_freq,
    tcdw_level: req.body.tcdw_level,
  });

  try {
    const savedPdw = await pdw.save();
    res.json({ success: true, data: savedPdw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//Update PDW
router.put("/:id", async (req, res) => {
  try {
    const pdw = await Pdw.findById(req.params.id);
    // console.log(req.body);

    const updatedPdw = await Pdw.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          basebands: req.body.basebands,
          toa: req.body.toa,
          word_type: req.body.word_type,
          mop: req.body.mop,
          freq_offset: req.body.freq_offset,
          level_offset: req.body.level_offset,
          phase_offset: req.body.phase_offset,
          pulse_width: req.body.pulse_width,
          rise_time: req.body.rise_time,
          fall_time: req.body.fall_time,
          edge_shape: req.body.edge_shape,
          repetitions: req.body.repetitions,
          arb_seg_index: req.body.arb_seg_index,
          lfm_bandwidth: req.body.lfm_bandwidth,
          barker_chip_width: req.body.barker_chip_width,
          barker_code: req.body.barker_code,
          m1: req.body.m1,
          m2: req.body.m2,
          m3: req.body.m3,
          tcdw_path: req.body.tcdw_path,
          tcdw_command: req.body.tcdw_command,
          tcdw_freq: req.body.tcdw_freq,
          tcdw_level: req.body.tcdw_level,
        },
      },
      {
        new: true,
      }
    );
    res.json({ success: true, data: updatedPdw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//delete PDW
router.delete("/:id", async (req, res) => {
  try {
    const pdw = await Pdw.findById(req.params.id);
    const deletedPdw = await Pdw.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: "PDW was deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

module.exports = router;
