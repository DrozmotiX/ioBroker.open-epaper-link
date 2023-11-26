"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var objectDefinitions_exports = {};
__export(objectDefinitions_exports, {
  BasicStates: () => BasicStates,
  buildCommon: () => buildCommon,
  stateAttrb: () => stateAttrb
});
module.exports = __toCommonJS(objectDefinitions_exports);
const stateAttrb = {
  currtime: {
    name: "Current Time",
    role: "indicator.alarm",
    type: "number",
    write: true,
    def: 0
  },
  wifissid: {
    type: "string",
    role: "info",
    write: false
  }
};
const BasicStates = {
  Configuration: {
    type: "channel",
    common: {
      name: "Configuration"
    },
    native: {}
  },
  Features: {
    type: "channel",
    common: {
      name: "Available features"
    },
    native: {}
  },
  Info: {
    type: "channel",
    common: {
      name: "Information"
    },
    native: {}
  },
  Sensors: {
    type: "channel",
    common: {
      name: "Information"
    },
    native: {}
  },
  "Configuration.checkupdate": {
    type: "state",
    common: {
      name: "Check for updates",
      type: "boolean",
      read: true,
      write: true,
      role: "button",
      def: false
    },
    native: {}
  },
  "Configuration.restart": {
    type: "state",
    common: {
      name: "Restart Device",
      type: "boolean",
      read: true,
      write: true,
      role: "button",
      def: false
    },
    native: {}
  },
  "Configuration.update": {
    type: "state",
    common: {
      name: "Execute update",
      type: "boolean",
      read: true,
      write: true,
      role: "button",
      def: false
    },
    native: {}
  },
  "Info.connected": {
    type: "state",
    common: {
      name: "Device connected",
      type: "boolean",
      read: true,
      write: false,
      role: "info.connected",
      def: false
    },
    native: {}
  }
};
function buildCommon(stateName) {
  const obj = {
    type: "state",
    common: {
      name: stateName,
      type: "mixed",
      read: true,
      write: false,
      role: "state"
    },
    native: {}
  };
  if (stateAttrb[stateName] != null) {
    if (stateAttrb[stateName].def != null) {
      obj.common.def = stateAttrb[stateName].def;
    }
    if (stateAttrb[stateName].name != null) {
      obj.common.name = stateAttrb[stateName].name;
    }
    if (stateAttrb[stateName].unit != null) {
      obj.common.unit = stateAttrb[stateName].unit;
    }
    obj.common.role = stateAttrb[stateName].role;
    obj.common.type = stateAttrb[stateName].type;
    if (stateAttrb[stateName].write != null) {
      obj.common.write = stateAttrb[stateName].write;
    }
    if (stateAttrb[stateName].states != null) {
      obj.common.states = stateAttrb[stateName].states;
    }
  }
  return obj;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BasicStates,
  buildCommon,
  stateAttrb
});
//# sourceMappingURL=objectDefinitions.js.map
