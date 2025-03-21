const express = require("express");
const router = express.Router();
const Emitter = require("../models/Emitter");

//get all Emitters
router.get("/", async (req, res) => {
  try {
    const emitters = await Emitter.find();
    res.json({ success: true, data: emitters });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//get Emitter with id
router.get("/:id", async (req, res) => {
  const emitter = await Emitter.findById(req.params.id);
  try {
    res.json({ success: true, data: emitter });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//add emitter
router.post("/", async (req, res) => {
  const emitter = new Emitter({
    basebands: req.body.basebands,
    pw: req.body.pw,
    pri: req.body.pri,
    mop: req.body.mop,
    time_offset: req.body.time_offset,
    freq_offset: req.body.freq_offset,
    level_offset: req.body.level_offset,
    phase_offset: req.body.phase_offset,
    rise_time: req.body.rise_time,
    fall_time: req.body.fall_time,
    edge_shape: req.body.edge_shape,
    arb_seg_index: req.body.arb_seg_index,
    lfm_bandwidth: req.body.lfm_bandwidth,
    barker_code: req.body.barker_code,
    barker_chip_width: req.body.barker_chip_width,
  });

  try {
    const savedEmitter = await emitter.save();
    res.json({ success: true, data: savedEmitter });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//Update Emitter
router.put("/:id", async (req, res) => {
  try {
    const emitter = await Emitter.findById(req.params.id);

    const updatedEmitter = await Emitter.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          basebands: req.body.basebands,
          pw: req.body.pw,
          pri: req.body.pri,
          mop: req.body.mop,
          time_offset: req.body.time_offset,
          freq_offset: req.body.freq_offset,
          level_offset: req.body.level_offset,
          phase_offset: req.body.phase_offset,
          rise_time: req.body.rise_time,
          fall_time: req.body.fall_time,
          edge_shape: req.body.edge_shape,
          arb_seg_index: req.body.arb_seg_index,
          lfm_bandwidth: req.body.lfm_bandwidth,
          barker_code: req.body.barker_code,
          barker_chip_width: req.body.barker_chip_width,
        },
      },
      {
        new: true,
      }
    );
    res.json({ success: true, data: updatedEmitter });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//delete Emitter
router.delete("/:id", async (req, res) => {
  try {
    const emitter = await Emitter.findById(req.params.id);
    const deletedEmitter = await Emitter.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: "Emitter was deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

module.exports = router;
