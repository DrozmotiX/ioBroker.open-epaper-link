"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_ws = __toESM(require("ws"));
var import_iobroker_jsonexplorer = __toESM(require("iobroker-jsonexplorer"));
var import_objectDefinitions = require("./lib/objectDefinitions");
const apConnection = [];
const messageResponse = {};
class OpenEpaperLink extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "open-epaper-link"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
    import_iobroker_jsonexplorer.default.init(this, import_objectDefinitions.stateAttrb);
  }
  async onReady() {
    this.setState("info.connection", false, true);
    await this.tryKnownDevices();
    this.setState("info.connection", true, true);
  }
  async tryKnownDevices() {
    try {
      this.log.info(`Try to connect to know devices`);
      const knownDevices = await this.getDevicesAsync();
      if (!knownDevices)
        return;
      for (const i in knownDevices) {
        const deviceDetails = knownDevices[i];
        if (!deviceDetails.native.ip)
          continue;
        this.wsConnectionHandler(deviceDetails.native.ip, deviceDetails.common.name);
      }
    } catch (error) {
    }
  }
  wsConnectionHandler(deviceIP, deviceName) {
    this.log.info(`Starting connection to ${deviceName} on IP ${deviceIP}`);
    apConnection[deviceIP] = {
      connection: new import_ws.default(`ws://${deviceIP}/ws`),
      connectionStatus: "Connecting",
      deviceName,
      ip: deviceIP
    };
    apConnection[deviceIP].connection.on("open", () => {
      this.log.info(`Connected to AccessPoint ${apConnection[deviceIP].deviceName} on ${apConnection[deviceIP].ip}`);
      apConnection[deviceIP].connectionStatus = "Connected";
      if (messageResponse[deviceIP]) {
        this.sendTo(
          messageResponse[deviceIP].from,
          messageResponse[deviceIP].command,
          {
            result: "OK - Access Point successfully connected, initializing configuration. Refresh table to show all known devices"
          },
          messageResponse[deviceIP].callback
        );
        delete messageResponse[deviceIP];
      }
      this.extendObject(apConnection[deviceIP].deviceName, {
        type: "device",
        common: {
          name: apConnection[deviceIP].deviceName
        },
        native: {
          ip: apConnection[deviceIP].ip
        }
      });
      this.extendObject(`${apConnection[deviceIP].deviceName}._info`, {
        type: "channel",
        common: {
          name: "Connection detail"
        }
      });
      import_iobroker_jsonexplorer.default.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, "connected", true);
      import_iobroker_jsonexplorer.default.stateSetCreate(
        `${apConnection[deviceIP].deviceName}._info.ip`,
        "Access Point IP-Address",
        apConnection[deviceIP].ip
      );
    });
    apConnection[deviceIP].connection.on("message", (message) => {
      this.log.debug(`Received message from server: ${message}`);
      message = JSON.parse(message);
      let modifiedMessage;
      if (message && message["sys"]) {
        modifiedMessage = message["sys"];
        import_iobroker_jsonexplorer.default.traverseJson(modifiedMessage, `${apConnection[deviceIP].deviceName}._info`);
      } else if (message && message["tags"]) {
        modifiedMessage = message["tags"];
        this.extendObject(`${apConnection[deviceIP].deviceName}.tags`, {
          type: "channel",
          common: {
            name: "Tags"
          }
        });
        this.extendObject(`${apConnection[deviceIP].deviceName}.tags.${message && message["tags"][0].mac}`, {
          type: "channel",
          common: {
            name: message["tags"][0].alias
          }
        });
        import_iobroker_jsonexplorer.default.traverseJson(
          modifiedMessage,
          `${apConnection[deviceIP].deviceName}.tags.${message && message["tags"][0].mac}`
        );
      } else {
        modifiedMessage = message;
        import_iobroker_jsonexplorer.default.traverseJson(modifiedMessage, apConnection[deviceIP].deviceName);
      }
      apConnection[deviceIP].connectionStatus = "Connected";
      import_iobroker_jsonexplorer.default.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, "connected", true);
    });
    apConnection[deviceIP].connection.on("close", () => {
      this.log.info("Disconnected from server");
      if (apConnection[deviceIP]) {
        apConnection[deviceIP].connectionStatus = "Disconnected";
        import_iobroker_jsonexplorer.default.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, "connected", false);
      }
    });
  }
  onUnload(callback) {
    try {
      for (const ap in apConnection) {
        try {
          apConnection[ap].connection.close();
        } catch (e) {
        }
      }
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.debug(`state ${id} deleted`);
    }
  }
  onMessage(obj) {
    this.log.debug("Data from configuration received : " + JSON.stringify(obj));
    if (typeof obj === "object" && obj.message) {
      this.log.debug("Data from configuration received : " + JSON.stringify(obj));
      try {
        switch (obj.command) {
          case "_addUpdateAP":
            const ipValid = this.validateIPAddress(obj.message["apIP"]);
            if (!ipValid) {
              this.log.warn(`You entered an incorrect IP-Address, cannot add device !`);
              this.sendTo(
                obj.from,
                obj.command,
                {
                  type: "error",
                  message: "connection failed"
                },
                obj.callback
              );
            } else {
              this.log.info(`Valid IP address received`);
              messageResponse[obj.message["apIP"]] = obj;
              this.wsConnectionHandler(obj.message["apIP"], obj.message["apName"]);
            }
            break;
          case "loadAccessPoints":
            {
              let data = {};
              const tableEntry = [];
              for (const device in apConnection) {
                tableEntry.push({
                  apName: apConnection[device].deviceName,
                  ip: apConnection[device].ip,
                  connectState: apConnection[device].connectionStatus
                });
              }
              data = {
                native: {
                  accessPointTable: tableEntry
                }
              };
              this.sendTo(obj.from, obj.command, data, obj.callback);
            }
            break;
          case "getApName":
            {
              const dropDownEntry = [];
              for (const device in apConnection) {
                dropDownEntry.push({
                  label: apConnection[device].deviceName,
                  value: apConnection[device].deviceName
                });
              }
              this.sendTo(obj.from, obj.command, dropDownEntry, obj.callback);
            }
            break;
          case "getApIP":
            {
              const dropDownEntry = [];
              for (const device in apConnection) {
                dropDownEntry.push({
                  label: apConnection[device].ip,
                  value: apConnection[device].ip
                });
              }
              this.sendTo(obj.from, obj.command, dropDownEntry, obj.callback);
            }
            break;
          case "deleteAP":
            messageResponse[obj.message["apIP"]] = obj;
            if (apConnection[obj.message["apIP"]]) {
              try {
                if (apConnection[obj.message["apIP"]].connection)
                  apConnection[obj.message["apIP"]].connection.close();
              } catch (e) {
              }
              try {
                this.delObject(apConnection[obj.message["apIP"]].deviceName, { recursive: true });
              } catch (e) {
              }
              delete apConnection[obj.message["apIP"]];
              this.sendTo(
                messageResponse[obj.message["apIP"]].from,
                messageResponse[obj.message["apIP"]].command,
                { result: "OK - Device successfully removed" },
                messageResponse[obj.message["apIP"]].callback
              );
              delete messageResponse[obj.message["apIP"]];
            } else {
              this.sendTo(
                obj.from,
                obj.command,
                {
                  error: `Provided IP-Address ${JSON.stringify(
                    obj.message
                  )} unknown, please refresh table and enter an valid IP-Address`
                },
                obj.callback
              );
              return;
            }
            break;
        }
      } catch (error) {
      }
    }
  }
  validateIPAddress(ipAddress) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ipAddress
    );
  }
}
if (require.main !== module) {
  module.exports = (options) => new OpenEpaperLink(options);
} else {
  (() => new OpenEpaperLink())();
}
//# sourceMappingURL=main.js.map
