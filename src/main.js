const { app, BrowserWindow, utilityProcess } = require("electron");
const SmwsApi = require("./services/smwsApi");
const fs = require("fs");
const path = require("node:path");
require("dotenv").config();
let { fork, spawn } = require("child_process");
let quitAttempt = 0;
const Server = require(path.join(__dirname, "server/server"));
new Server();

let serverPath = path.join(__dirname, "server", "server.js");
let mongoPath = path.join(__dirname, "server", "mongo", "mongod");
let mongoDataPath = path.join(__dirname, "server", "mongo", "data");
let mongoProcess;
if (app.isPackaged) {
  serverPath = path.join(process.resourcesPath, "server", "server.js");
  mongoPath = path.join(process.resourcesPath, "mongo", "mongod");
  if (!fs.existsSync(path.join(process.env.HOME, "mongo"))) {
    fs.mkdirSync(path.join(process.env.HOME, "mongo"));
  }
  mongoDataPath = path.join(process.env.HOME, "mongo");
  console.log(`RESOURCE PATH: ${process.resourcesPath}`);
  console.log(`Mongo data PATH: ${path.join(process.env.HOME, "mongo")}`);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    // webPreferences: {
    //   preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    // },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.loadFile("src/index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  const mongoCmd = `${mongoPath}`;
  const mongoCmdArgs = ["--port", "27080", "--dbpath", `${mongoDataPath}`];
  console.log("MONGO CMD: " + mongoCmd);
  mongoProcess = spawn(mongoCmd, mongoCmdArgs);
  mongoProcess.on("error", (err) => {
    console.error("Failed to start subprocess.", err);
  });

  mongoProcess.on("close", (code) => {
    console.error(`Mongo process exited with code ${code}`);
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
app.on("before-quit", async (event) => {
  if (quitAttempt < 1) {
    event.preventDefault();
    await SmwsApi.stopEmitterStreaming();
    mongoProcess.kill();
    event.defaultPrevented = false;
    app.quit();
    quitAttempt++;
  }
});
