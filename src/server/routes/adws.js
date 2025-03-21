const express = require("express");
const router = express.Router();
const Adw = require("../models/Adw");

//get all ADWs
router.get("/", async (req, res) => {
  try {
    const adws = await Adw.find();
    res.json({ success: true, data: adws });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//get ADW with id
router.get("/:id", async (req, res) => {
  const adw = await Adw.findById(req.params.id);
  try {
    res.json({ success: true, data: adw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//add ADW
router.post("/", async (req, res) => {
  const adw = new Adw({
    seg: req.body.seg,
    use_extension: req.body.use_extension,
    seg_interrupt: req.body.seg_interrupt,
    ignore_adw: req.body.ignore_adw,
    m1: req.body.m1,
    m2: req.body.m2,
    m3: req.body.m3,
    freq_offset: req.body.freq_offset,
    level_offset: req.body.level_offset,
    phase_offset: req.body.phase_offset,
    segment_index: req.body.segment_index,
    burst_sri: req.body.burst_sri,
    burst_add_segments: req.body.burst_add_segments,
  });

  try {
    const savedAdw = await adw.save();
    res.json({ success: true, data: savedAdw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//Update ADW
router.put("/:id", async (req, res) => {
  try {
    const adw = await Adw.findById(req.params.id);

    const updatedAdw = await Adw.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          seg: req.body.seg,
          use_extension: req.body.use_extension,
          seg_interrupt: req.body.seg_interrupt,
          ignore_adw: req.body.ignore_adw,
          m1: req.body.m1,
          m2: req.body.m2,
          m3: req.body.m3,
          freq_offset: req.body.freq_offset,
          level_offset: req.body.level_offset,
          phase_offset: req.body.phase_offset,
          segment_index: req.body.segment_index,
          burst_sri: req.body.burst_sri,
          burst_add_segments: req.body.burst_add_segments,
        },
      },
      {
        new: true,
      }
    );
    res.json({ success: true, data: updatedAdw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//delete ADW
router.delete("/:id", async (req, res) => {
  try {
    // console.log("server side delete route");
    const adw = await Adw.findById(req.params.id);
    const deletedAdw = await Adw.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: "ADW was deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

module.exports = router;
