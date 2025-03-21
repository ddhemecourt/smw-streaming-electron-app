const express = require("express");
const router = express.Router();
const Smw = require("../models/Smw");
const SmwUtilities = require("../utility_classes/SmwUtilities");
const PdwUtilities = require("../utility_classes/PdwUtilities");
const AdwUtilities = require("../utility_classes/AdwUtilities");
const EmitterUtilities = require("../utility_classes/EmitterUtilities");
let smwCtrl;
let pdwStreamer = new PdwUtilities();
let adwStreamer = new AdwUtilities();
let emitterStreamer = new EmitterUtilities();
//get all SMWs
router.get("/smw_list/", async (req, res) => {
  try {
    let smws = await Smw.find();
    smws = await pdwStreamer.checkPdwSocketStatus(smws);
    let smwsUpdatedIpStatus = [];
    for (let i = 0; i < smws.length; i++) {
      const updatedSmw = await Smw.findByIdAndUpdate(
        smws[i]._id,
        {
          $set: {
            ip_address: smws[i].ip_address,
            options: {
              rf_ports: smws[i].options.rf_ports,
              rf_freq: smws[i].options.rf_freq,
              rf_bandwidth: smws[i].options.rf_bandwidth,
              basebands: smws[i].options.basebands,
            },
            bb_ips: smws[i].bb_ips,
            adw_interface: smws[i].adw_interface,
          },
        },
        {
          new: true,
        }
      );
      smwsUpdatedIpStatus.push(updatedSmw);
    }

    res.json({ success: true, data: smwsUpdatedIpStatus });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//get SMW with id
router.get("/smw_list/:id", async (req, res) => {
  const smw = await Smw.findById(req.params.id);
  try {
    res.json({ success: true, data: smw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//add smw
router.post("/smw_list/", async (req, res) => {
  smwCtrl = new SmwUtilities();
  const smw = new Smw({
    ip_address: req.body.ip_address,
    options: {
      rf_ports: req.body.options.rf_ports,
      rf_freq: req.body.options.rf_freq,
      rf_bandwidth: req.body.options.rf_bandwidth,
      basebands: req.body.options.basebands,
    },
    bb_ips: req.body.bb_ips,
    adw_interface: req.body.adw_interface,
  });

  try {
    const savedSmw = await smw.save();
    const status = await smwCtrl.initiateSmwControlInterface(
      savedSmw.ip_address
    );
    await smwCtrl.setBasebandIps(savedSmw);
    await smwCtrl.setAdwIps(savedSmw);
    console.log("Setting bb ips for SMW: " + savedSmw);
    smwCtrl.closeControlInterface();
    res.json({ success: true, data: savedSmw });
  } catch (error) {
    console.log(error);
    console.log("Saved SMW: " + savedSmw);
    res.json({ success: false, data: savedSmw });
  }
});

//Update SMW
router.put("/smw_list/:id", async (req, res) => {
  smwCtrl = new SmwUtilities();
  try {
    const smw = await Smw.findById(req.params.id);
    // console.log(req.body);

    const updatedSmw = await Smw.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ip_address: req.body.ip_address,
          options: {
            rf_ports: req.body.options.rf_ports,
            rf_freq: req.body.options.rf_freq,
            rf_bandwidth: req.body.options.rf_bandwidth,
            basebands: req.body.options.basebands,
          },
          bb_ips: req.body.bb_ips,
          adw_interface: req.body.adw_interface,
        },
      },
      {
        new: true,
      }
    );
    await smwCtrl.initiateSmwControlInterface(updatedSmw.ip_address);
    console.log("Setting bb ips for SMW: " + updatedSmw);
    await smwCtrl.setBasebandIps(updatedSmw);
    await smwCtrl.setAdwIps(updatedSmw);
    smwCtrl.closeControlInterface();
    // console.log(`UPDATED SMW: ${updatedSmw}`);
    res.json({ success: true, data: updatedSmw });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//delete SMW
router.delete("/smw_list/:id", async (req, res) => {
  try {
    const smw = await Smw.findById(req.params.id);
    const deletedSmw = await Smw.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: "SMW was deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

//try connect smw control interface
router.post("/connect", async (req, res) => {
  smwCtrl = new SmwUtilities();
  console.log("IP: ", req.body.ip_address);
  try {
    await smwCtrl.initiateSmwControlInterface(req.body.ip_address);
    const smwRes = await smwCtrl.getStreamingOptions();
    // console.log(smwRes);
    smwRes.status = "Success";
    smwCtrl.closeControlInterface();
    res.json({ success: true, data: smwRes });
  } catch (error) {
    res.json({ success: false, data: "error" });
    console.log("Error: ", error);
  }
});

//connect smw control interface on already-registered smw
router.post("/:id/connect", async (req, res) => {
  const smw = await Smw.findById(req.params.id);
  smwCtrl = new SmwUtilities();
  try {
    const smwCtrl = await smwCtrl.initiateSmwControlInterface(smw.ip_address);
    // const smwRes = await smwCtrl.optionsList();
    smwCtrl.closeControlInterface();
    smwRes.status = "Success";
    res.json({ success: true, data: smwCtrl });
  } catch (error) {
    res.json({ success: false, data: smwCtrl });
  }
});

//get smw options
router.post("/smw_list/:id/smw_options", async (req, res) => {
  // smwCtrl = new SmwUtilities();
  try {
    const options = await smwCtrl.optionsList();
    console.log(options);
    res.json({ success: true, data: JSON.parse(options) });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//get smw options
router.post("/smw_list/:id/set_pdw_ip_settings", async (req, res) => {
  // smwCtrl = new SmwUtilities();
  try {
    const options = await smwCtrl.optionsList();
    console.log(options);
    res.json({ success: true, data: JSON.parse(options) });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//set smw baseband ip address fields for pdw streaming
router.post("/smw_list/:id/init_pdw_streaming_bb_ips", async (req, res) => {
  const smw = await Smw.findById(req.params.id);
  try {
    const initStatus = await smwCtrl.setBasebandIps(smw);
    console.log(initStatus);
    res.json({ success: true, data: initStatus });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//get init smw basebands pdw streaming
router.post("/smw_list/:id/init_pdw_streaming", async (req, res) => {
  smwCtrl = new SmwUtilities();
  console.log("initilizing pdw streaming");
  const smw = await Smw.findById(req.params.id);
  console.log(smw);
  try {
    await smwCtrl.initiateSmwControlInterface(smw.ip_address);
    const initStatus = await smwCtrl.initPdwStreaming(smw);
    const pdwSocketStatus = await pdwStreamer.initPdwSockets(smw);
    // console.log(initStatus);
    console.log(`PDW SOCKET STATUS: ${pdwSocketStatus}`);
    smwCtrl.closeControlInterface();
    res.json({ success: true, data: pdwSocketStatus });
    console.log("successfully sent data back");
  } catch (error) {
    console.log("Error: ", error);
  }
});

//stream pdw table
router.post("/stream_pdw_list", async (req, res) => {
  const pdwList = req.body;
  // console.log(pdwList);
  try {
    const streamStatus = await pdwStreamer.streamPdwLists(pdwList);
    res.json({ success: true, data: streamStatus });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//stream pdw table
router.post("/close_pdw_sockets", async (req, res) => {
  try {
    await pdwStreamer.closeAllPdwStreams();
    res.json({ success: true, data: "Closed Streams" });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//get init smw basebands adw streaming
router.post("/smw_list/:id/init_adw_streaming", async (req, res) => {
  smwCtrl = new SmwUtilities();
  try {
    const smw = await Smw.findById(req.params.id);
    console.log(smw);
    await smwCtrl.initiateSmwControlInterface(smw.ip_address);
    // const initStatus = await smwCtrl.initAdwStreaming(smw);
    adwStreamer.setAdwSocketParams(smw.adw_interface);
    smwCtrl.closeControlInterface();
    res.json({ success: true, data: "Adw Streaming Initiated" });
  } catch (error) {
    console.log("Error: ", error);
  }
});

//get init smw basebands adw streaming
router.post("/stream_adw", async (req, res) => {
  try {
    const adw = req.body;
    console.log("Streaming ADW: ", adw);
    await adwStreamer.sendAdw(adw);
    res.json({ success: true, data: "ADW Sent" });
  } catch (error) {
    res.json({ success: false, data: error });
  }
});

//init emitter streaming
router.post("/init_emitter_streaming", async (req, res) => {
  console.log("Inititiating emitter streaming");
  smwCtrl = new SmwUtilities();
  try {
    let bbIps = [];
    const smws = req.body;
    for (let i = 0; i < smws.length; i++) {
      const smw = smws[i];
      for (bb of smw.bb_ips) {
        console.log(bb);
        if (bb.active === "true") {
          bbIps.push(bb.ip_address);
        }
      }
      // console.log(smw);
      await smwCtrl.initiateSmwControlInterface(smw.ip_address);
      const initStatus = await smwCtrl.initPdwStreaming(smw);
      await smwCtrl.armBBTrigger();
      await smwCtrl.executeBBTrigger();
      smwCtrl.closeControlInterface();
    }

    console.log("initializing emitter streaming");
    const responseClose = await emitterStreamer.stopEmitterExecutable();
    console.log(responseClose);
    const startres = await emitterStreamer.startEmitterExecutable(
      smws[0],
      bbIps
    );
    console.log("Start res: " + startres);
    const response = await emitterStreamer.initEmitterSocket();
    console.log("RES: " + response);
    res.json({ success: true, data: response });
  } catch (error) {
    res.json({ success: false, data: error });
  }
});

//stream emitters
router.post("/stop_emitter_streaming", async (req, res) => {
  try {
    console.log("stopping emitters");
    await emitterStreamer.stopEmitterSocket();
    await emitterStreamer.stopEmitterExecutable();
    res.json({ success: true, data: "Emitter Interface Stopped" });
  } catch (error) {
    res.json({ success: false, data: error });
  }
});

//stream emitters
router.post("/stream_emitters", async (req, res) => {
  try {
    console.log("streaming emitters" + req.body);
    await emitterStreamer.sendEmitterPacket(req.body);
    res.json({ success: true, data: "Emitter Interface Initialized" });
  } catch (error) {
    res.json({ success: false, data: error });
  }
});

module.exports = router;
