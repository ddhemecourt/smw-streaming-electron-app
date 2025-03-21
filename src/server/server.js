const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const connectDB = require("./config/db");
const hostname = "127.0.0.1";

console.log("SERVER TEST");
class Server {
  constructor() {
    connectDB();

    const app = express();

    //Static Folder
    app.use(express.static(path.join(__dirname, "public")));

    //Body parser middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    //cors middleware
    app.use(
      cors({
        origin: ["http://localhost:5000", "http://localhost:3000"],
        credentials: true,
      })
    );

    //create a route
    app.get("/", (req, res) => {
      res.json({ message: "Welcome to the SMW Streaming API" });
    });

    //smw route
    const smwRouter = require("./routes/smws");
    app.use("/api/smws", smwRouter);

    //pdw route
    const pdwRouter = require("./routes/pdws");
    app.use("/api/pdws", pdwRouter);

    //emitter route
    const emitterRouter = require("./routes/emitters");
    app.use("/api/emitters", emitterRouter);

    //adw route
    const adwRouter = require("./routes/adws");
    app.use("/api/adws", adwRouter);

    //Start server
    const server = app.listen(port, hostname, () =>
      console.log(`Server listening on port ${port}`)
    );
  }
}

module.exports = Server;
