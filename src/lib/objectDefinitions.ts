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
