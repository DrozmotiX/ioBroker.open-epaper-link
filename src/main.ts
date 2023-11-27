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
const messageResponse: any = {};

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

		// Try to connect to known devices
		await this.tryKnownDevices();
		this.setState('info.connection', true, true);
	}

	// Try to contact and read data of already known devices
	private async tryKnownDevices(): Promise<void> {
		try {
			// Get all current devices from adapter tree
			this.log.info(`Try to connect to know devices`);
			const knownDevices = await this.getDevicesAsync();

			// Cancel operation if no devices are found
			if (!knownDevices) return;

			// Get connection data of known devices and to connect
			for (const i in knownDevices) {
				const deviceDetails = knownDevices[i];
				// Cancell operation if object does not contain IP address
				if (!deviceDetails.native.ip) continue;
				// Start connection to this device
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				this.wsConnectionHandler(deviceDetails.native.ip, deviceDetails.common.name);
			}
		} catch (error) {
			// this.errorHandler(`[tryKnownDevices]`, error);
		}
	}

	private wsConnectionHandler(deviceIP: string, deviceName: string): void {
		this.log.info(`Starting connection to ${deviceName} on IP ${deviceIP}`);
		apConnection[deviceIP] = {
			connection: new WebSocket(`ws://${deviceIP}/ws`),
			connectionStatus: 'Connecting',
			deviceName: deviceName,
			ip: deviceIP,
		};

		apConnection[deviceIP].connection.on('open', () => {
			this.log.info(
				`Connected to AccessPoint ${apConnection[deviceIP].deviceName} on ${apConnection[deviceIP].ip}`,
			);
			apConnection[deviceIP].connectionStatus = 'Connected';

			// Check if device connection is caused by adding  device from admin, if yes send OK message
			if (messageResponse[deviceIP]) {
				this.sendTo(
					messageResponse[deviceIP].from,
					messageResponse[deviceIP].command,
					{
						result: 'OK - Access Point successfully connected, initializing configuration. Refresh table to show all known devices',
					},
					messageResponse[deviceIP].callback,
				);
				delete messageResponse[deviceIP];
			}

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
			this.extendObject(`${apConnection[deviceIP].deviceName}._info`, {
				type: 'channel',
				common: {
					name: 'Connection detail',
				},
			});

			jsonExplorer.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, 'connected', true);
			jsonExplorer.stateSetCreate(
				`${apConnection[deviceIP].deviceName}._info.ip`,
				'Access Point IP-Address',
				apConnection[deviceIP].ip,
			);
		});

		apConnection[deviceIP].connection.on('message', (message: string) => {
			//ToDo: Design messageHandler to write values to states
			this.log.debug(`Received message from server: ${message}`);
			message = JSON.parse(message);
			let modifiedMessage;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (message && message['sys']) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				modifiedMessage = message['sys'];
				jsonExplorer.traverseJson(modifiedMessage, `${apConnection[deviceIP].deviceName}._info`);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
			} else if (message && message['tags']) {
				//ToDO: Improvement required, channel creation for Tag ID should only be executed once
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				modifiedMessage = message['tags'];
				this.extendObject(`${apConnection[deviceIP].deviceName}.tags`, {
					type: 'channel',
					common: {
						name: 'Tags',
					},
				});
				//ToDO: Improvement required, channel creation for Tag ID should only be executed once
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				this.extendObject(`${apConnection[deviceIP].deviceName}.tags.${message && message['tags'][0].mac}`, {
					type: 'channel',
					common: {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						name: message['tags'][0].alias,
					},
				});
				jsonExplorer.traverseJson(
					modifiedMessage,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					`${apConnection[deviceIP].deviceName}.tags.${message && message['tags'][0].mac}`,
				);
			} else {
				modifiedMessage = message;
				jsonExplorer.traverseJson(modifiedMessage, apConnection[deviceIP].deviceName);
			}
			apConnection[deviceIP].connectionStatus = 'Connected';
			jsonExplorer.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, 'connected', true);
		});

		apConnection[deviceIP].connection.on('close', () => {
			this.log.info('Disconnected from server');
			if (apConnection[deviceIP]) {
				apConnection[deviceIP].connectionStatus = 'Disconnected';
				jsonExplorer.stateSetCreate(`${apConnection[deviceIP].deviceName}._info.connected`, 'connected', false);
			}
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
			this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.debug(`state ${id} deleted`);
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
							messageResponse[obj.message['apIP']] = obj;
							this.wsConnectionHandler(obj.message['apIP'], obj.message['apName']);
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
					case 'deleteAP':
						messageResponse[obj.message['apIP']] = obj;
						if (apConnection[obj.message['apIP']]) {
							// Ensure all existing connections are closed, will trigger disconnect event to clean-up memory attributes
							try {
								if (apConnection[obj.message['apIP']].connection)
									apConnection[obj.message['apIP']].connection.close();
							} catch (e) {
								// Add error handler
							}
							// Try to delete Device Object including all underlying states
							try {
								this.delObject(apConnection[obj.message['apIP']].deviceName, { recursive: true });
							} catch (e) {
								// Deleting device channel failed
							}

							// Clean memory data
							delete apConnection[obj.message['apIP']];

							// Send confirmation to frontend
							this.sendTo(
								messageResponse[obj.message['apIP']].from,
								messageResponse[obj.message['apIP']].command,
								{ result: 'OK - Device successfully removed' },
								messageResponse[obj.message['apIP']].callback,
							);
							delete messageResponse[obj.message['apIP']];
						} else {
							this.sendTo(
								obj.from,
								obj.command,
								{
									error: `Provided IP-Address ${JSON.stringify(
										obj.message,
									)} unknown, please refresh table and enter an valid IP-Address`,
								},
								obj.callback,
							);
							return;
						}

						// this.sendTo(obj.from, obj.command, 1, obj.callback);
						break;
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
