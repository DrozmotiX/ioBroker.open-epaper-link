type MyObjects = Record<string, MyObjectsDefinitions>;
type StateAttr = {
	[key: string]: {
		def?: boolean | string | number | null;
		name?: string;
		states?: string | Record<string, string> | string[];
		type: ioBroker.CommonType;
		role?: string;
		/** Unit of the state */
		unit?: string;
		/** if this state is writable */
		write?: boolean;
	};
};

interface MyObjectsDefinitions extends Omit<ioBroker.BaseObject, '_id'> {
	common: MyStateCommon;
}

interface MyStateCommon extends Partial<ioBroker.StateCommon> {
	name?: string;
}

const stateAttrb: StateAttr = {
	currtime: {
		name: 'Current Time',
		role: 'indicator.alarm',
		type: 'number',
		write: true,
		def: 0,
	},
	wifissid: {
		type: 'string',
		role: 'info',
		write: false,
	},
	mac: {
		type: 'string',
		name: 'MAC Address',
		role: 'state',
		write: false,
	},
	hash: {
		type: 'string',
		name: 'Hash',
		role: 'state',
		write: false,
	},
	lastseen: {
		type: 'number',
		name: 'Last Seen',
		role: 'state',
		write: false,
	},
	nextupdate: {
		type: 'number',
		name: 'Next Update',
		role: 'state',
		write: false,
	},
	nextcheckin: {
		type: 'number',
		name: 'Next Check-in',
		role: 'state',
		write: false,
	},
	pending: {
		type: 'boolean',
		name: 'Pending',
		role: 'state',
		write: false,
	},
	alias: {
		type: 'string',
		name: 'Alias',
		role: 'state',
		write: false,
	},
	contentMode: {
		type: 'number',
		name: 'Content Mode',
		role: 'state',
		write: false,
	},
	LQI: {
		type: 'number',
		name: 'Link Quality Indicator (LQI)',

		role: 'state',
		write: false,
	},
	RSSI: {
		type: 'number',
		name: 'Received Signal Strength Indicator (RSSI)',
		role: 'state',
		write: false,
	},
	temperature: {
		type: 'number',
		name: 'Temperature',
		role: 'state',
		write: false,
	},
	batteryMv: {
		type: 'number',
		name: 'Battery Voltage',
		role: 'state',
		write: false,
	},
	hwType: {
		type: 'number',
		name: 'Hardware Type',
		role: 'state',
		write: false,
	},
	wakeupReason: {
		type: 'number',
		name: 'Wakeup Reason',
		role: 'state',
		write: false,
	},
	capabilities: {
		type: 'number',
		name: 'Capabilities',
		role: 'state',
		write: false,
	},
	modecfgjson: {
		type: 'string',
		name: 'Mode Configuration JSON',
		role: 'state',
		write: false,
	},
	isexternal: {
		type: 'boolean',
		name: 'Is External',
		role: 'state',
		write: false,
	},
	apip: {
		type: 'string',
		name: 'API IP',
		role: 'state',
		write: false,
	},
	rotate: {
		type: 'number',
		name: 'Rotate',
		role: 'state',
		write: false,
	},
	lut: {
		type: 'number',
		name: 'Lookup Table (LUT)',
		role: 'state',
		write: false,
	},
	invert: {
		type: 'number',
		name: 'Invert',
		role: 'state',
		write: false,
	},
	ch: {
		type: 'number',
		name: 'Channel',
		role: 'state',
		write: false,
	},
	ver: {
		type: 'number',
		name: 'Version',
		role: 'state',
		write: false,
	},
};

const BasicStates: MyObjects = {
	Configuration: {
		type: 'channel',
		common: {
			name: 'Configuration',
		},
		native: {},
	},
	Features: {
		type: 'channel',
		common: {
			name: 'Available features',
		},
		native: {},
	},
	Info: {
		type: 'channel',
		common: {
			name: 'Information',
		},
		native: {},
	},
	Sensors: {
		type: 'channel',
		common: {
			name: 'Information',
		},
		native: {},
	},
	'Configuration.checkupdate': {
		type: 'state',
		common: {
			name: 'Check for updates',
			type: 'boolean',
			read: true,
			write: true,
			role: 'button',
			def: false,
		},
		native: {},
	},
	'Configuration.restart': {
		type: 'state',
		common: {
			name: 'Restart Device',
			type: 'boolean',
			read: true,
			write: true,
			role: 'button',
			def: false,
		},
		native: {},
	},
	'Configuration.update': {
		type: 'state',
		common: {
			name: 'Execute update',
			type: 'boolean',
			read: true,
			write: true,
			role: 'button',
			def: false,
		},
		native: {},
	},
	'Info.connected': {
		type: 'state',
		common: {
			name: 'Device connected',
			type: 'boolean',
			read: true,
			write: false,
			role: 'info.connected',
			def: false,
		},
		native: {},
	},
};

function buildCommon(stateName: string): MyObjectsDefinitions {
	const obj: MyObjectsDefinitions = {
		type: 'state',
		common: {
			name: stateName,
			type: 'mixed',
			read: true,
			write: false,
			role: 'state',
		},
		native: {},
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

export { stateAttrb, BasicStates, MyObjectsDefinitions, buildCommon, MyObjects };
