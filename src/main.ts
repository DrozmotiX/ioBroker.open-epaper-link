/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';

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
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info('config option1: ' + this.config.option1);
		this.log.info('config option2: ' + this.config.option2);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync('testVariable', {
			type: 'state',
			common: {
				name: 'testVariable',
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates('testVariable');
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates('lights.*');
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates('*');

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync('testVariable', true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync('testVariable', { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync('admin', 'iobroker');
		this.log.info('check user admin pw iobroker: ' + result);

		result = await this.checkGroupAsync('admin', 'admin');
		this.log.info('check group user admin group admin: ' + result);
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

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

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

	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new OpenEpaperLink(options);
} else {
	// otherwise start the instance directly
	(() => new OpenEpaperLink())();
}
