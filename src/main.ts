/*
 * Created with @iobroker/create-adapter v2.5.0
 */

type ApConnection = {
	[key: string]: {
		ip: string;
		connection: WebSocket;
		connectionStatus: string;
		deviceName: string;
	};
};

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const apConnection: ApConnection = [];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import jsonExplorer from 'iobroker-jsonexplorer'; // Use jsonExplorer library
import { stateAttrb } from './lib/objectDefinitions';

// Load your modules here, e.g.:
// import * as fs from "fs";

class OpenEpaperLink extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'open-epaper-link',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
		jsonExplorer.init(this, stateAttrb); // Initiate library to handle JSOn data & state creation
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);

		// Connect to test-device
		this.wsConnectionHandler('192.168.10.150');

		// ToDo: Establish connection to all already known devices
		this.setState('info.connection', true, true);
	}

	private wsConnectionHandler(deviceIP: string): void {
		apConnection[deviceIP] = {
			connection: new WebSocket(`ws://${deviceIP}/ws`),
			connectionStatus: 'Connecting',
			deviceName: 'testDevice',
			ip: deviceIP,
		};

		apConnection[deviceIP].connection.on('open', () => {
			this.log.info('Connected to server');
			apConnection[deviceIP].connectionStatus = 'Connected';
			//ToDo: Create Device on connection state and store decide details
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			this.extendObject(apConnection[deviceIP].deviceName, {
				type: 'device',
				common: {
					name: apConnection[deviceIP].deviceName,
					// ToDo: @ticaki please assit with TS, value is correct but error shown
					// statusStates: {
					// 	onlineId: `${this.namespace}.${apConnection[deviceIP].deviceName}._info._online`,
					// },
				},
				native: {
					ip: apConnection[deviceIP].ip,
				},
			});
		});

		apConnection[deviceIP].connection.on('message', (message: string) => {
			//ToDo: Design messageHandler to write values to states
			this.log.info(`Received message from server: ${message}`);
			message = JSON.parse(message);

			//ToDo: modify JSON data to store states into correct channel
			jsonExplorer.traverseJson(message, apConnection[deviceIP].deviceName);
			apConnection[deviceIP].connectionStatus = 'Connected';
		});

		apConnection[deviceIP].connection.on('close', () => {
			this.log.info('Disconnected from server');
			apConnection[deviceIP].connectionStatus = 'Disconnected';
		});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			// loop truth all connection and close if present
			for (const ap in apConnection) {
				//ToDo: needs to be optimized, just quick & dirty for testing now
				try {
					apConnection[ap].connection.close();
				} catch (e) {
					// no connection present
				}
			}

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	/**
	 * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	 * Using this method requires "common.messagebox" property to be set to true in io-package.json
	 */
	private onMessage(obj: ioBroker.Message): void {
		this.log.debug('Data from configuration received : ' + JSON.stringify(obj));
		if (typeof obj === 'object' && obj.message) {
			this.log.debug('Data from configuration received : ' + JSON.stringify(obj));
			// if (obj.command === 'send') {
			// e.g. send email or pushover or whatever

			try {
				switch (obj.command) {
					//ToDo previous add function to be removed
					case '_addUpdateAP':
						// eslint-disable-next-line no-case-declarations
						const ipValid = this.validateIPAddress(obj.message['apIP']);
						if (!ipValid) {
							this.log.warn(`You entered an incorrect IP-Address, cannot add device !`);

							this.sendTo(
								obj.from,
								obj.command,
								{
									type: 'error',
									message: 'connection failed',
								},
								obj.callback,
							);
						} else {
							this.log.info(`Valid IP address received`);
							this.wsConnectionHandler(obj.message['apIP']);
						}
						break;
					//
					case 'loadAccessPoints':
						{
							let data = {};

							const tableEntry = [];

							for (const device in apConnection) {
								tableEntry.push({
									apName: apConnection[device].deviceName,
									ip: apConnection[device].ip,
									connectState: apConnection[device].connectionStatus,
								});
							}

							data = {
								native: {
									accessPointTable: tableEntry,
								},
							};
							this.sendTo(obj.from, obj.command, data, obj.callback);
						}
						break;
					//
					// Front End message handler to load IP-Address dropDown with all current known devices
					case 'getApName':
						{
							const dropDownEntry = [];
							for (const device in apConnection) {
								dropDownEntry.push({
									label: apConnection[device].deviceName,
									value: apConnection[device].deviceName,
								});
							}
							this.sendTo(obj.from, obj.command, dropDownEntry, obj.callback);
						}
						break;

					case 'getApIP':
						{
							const dropDownEntry = [];
							for (const device in apConnection) {
								dropDownEntry.push({
									label: apConnection[device].ip,
									value: apConnection[device].ip,
								});
							}
							this.sendTo(obj.from, obj.command, dropDownEntry, obj.callback);
						}
						break;

					// Handle front-end messages to delete devices
					// case 'deleteDevice':
					// 	this.messageResponse[obj.message.ip] = obj;
					// 	if (clientDetails[obj.message.ip]) {
					// 		// Ensure all existing connections are closed, will trigger disconnect event to clean-up memory attributes
					// 		clientDetails[obj.message.ip].client.disconnect();
					// 		// Try to delete Device Object including all underlying states
					// 		try {
					// 			await this.delObjectAsync(clientDetails[obj.message.ip].deviceName, { recursive: true });
					// 		} catch (e) {
					// 			// Deleting device channel failed
					// 		}
					//
					// 		// Clean memory data
					// 		delete clientDetails[obj.message.ip];
					//
					// 		// Send confirmation to frontend
					// 		this.sendTo(
					// 			this.messageResponse[obj.message.ip].from,
					// 			this.messageResponse[obj.message.ip].command,
					// 			{ result: 'OK - Device successfully removed' },
					// 			this.messageResponse[obj.message.ip].callback,
					// 		);
					// 		delete this.messageResponse[obj.message.ip];
					// 	} else {
					// 		this.sendTo(
					// 			obj.from,
					// 			obj.command,
					// 			{
					// 				error: 'Provided IP-Address unknown, please refresh table and enter an valid IP-Address',
					// 			},
					// 			obj.callback,
					// 		);
					// 		return;
					// 	}
					//
					// 	// this.sendTo(obj.from, obj.command, 1, obj.callback);
					// 	break;
				}
			} catch (error) {
				// this.errorHandler(`[onMessage]`, error);
			}

			// Send response in callback if required
			// if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
			// }
		}
	}

	private validateIPAddress(ipAddress: string): boolean {
		return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
			ipAddress,
		);
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new OpenEpaperLink(options);
} else {
	// otherwise start the instance directly
	(() => new OpenEpaperLink())();
}
