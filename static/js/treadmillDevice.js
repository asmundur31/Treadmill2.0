/*
> Description:
This class constructs the bluetooth Treadmill device.
It was designed to read data following the FTMS protocol provided by treadmill rpi (see other references).
It has not been tested with other Treadmill devices.
> Documentation:
https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/
> Other references:
Treadmill rpi: https://github.com/gustimorth/Treadmill2.0App/
*/
import {
  updateDisconnectedTreadmill,
  updateConnectedTreadmill,
  updateDataTreadmill,
  updateVideoSpeedByTreadmillSpeed
} from './connectBluetooth.js';

export default class TreadmillDevice {

  constructor() {
    this.device = null;
    this.server = null;
    this.serviceUUID = '00001826-0000-1000-8000-00805f9b34fb';
    //characteristics
    this.dataChUUID = "00002acd-0000-1000-8000-00805f9b34fb";
    this.controlChUUID = "00002ad9-0000-1000-8000-00805f9b34fb";
  }

  /* FUNCTIONS TO HANDLE CONNECTION */

  async connect() {
    // Request the bluetooth device
    var device = await navigator.bluetooth.requestDevice({ filters: [{ services: [this.serviceUUID] }] })
    this.device = device;
    device.addEventListener('gattserverdisconnected', this.onDisconnected);
    // Lets try to connect to the device
    let tries = 0;
    var server = null;
    try {
      server = await device.gatt.connect();
    } catch (e) {
      tries++;
      if (tries <= 5) {
        console.log('> attempting to connect to', device.name);
        setTimeout(function () {
          connect();
        }, 1000);
      } else {
        console.log('> could not connect to ', device.name);
        updateDisconnectedTreadmill('failed_connection');
      }
    }
    console.log('> connection successfull to: ', this.device.name);
    this.server = server;
    // Connection was successfull and lets get the service
    var service = await server.getPrimaryService(this.serviceUUID);
    
    return Promise.all([
      this.findDataCharacteristic(service),
      this.findControlCharacteristic(service),
    ]);
  }

  async findDataCharacteristic(service) {
    var characteristics = await service.getCharacteristic(this.dataChUUID)
    console.log(`> ${this.device.name} characteristic found: `, characteristics);
    var characteristic = await characteristics.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', this.parseTreadmillData);
    console.log(`> request sent to ${this.device.name} start notifications ${characteristic.uuid}`);
  }

  async findControlCharacteristic(service) {
    var characteristic = await service.getCharacteristic(this.controlChUUID)
    console.log(`> ${this.device.name} characteristic found: `, characteristic);
    const val = Uint8Array.of(0);
    characteristic.writeValue(val);
    console.log(`> request sent to ${this.device.name} control device ${characteristic.uuid}`);
    updateConnectedTreadmill();
  }

  onDisconnected(event) {
    let device = event.target;
    console.log(`> ${device.name} bluetooth device connection lost`);
    updateDisconnectedTreadmill('lost_connection');
  }

  disconnect() {
    if (this.device == null) {
      console.log('The target device is null.');
      return;
    }
    this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.device.gatt.disconnect();
    console.log(`> ${this.device.name} bluetooth device disconnected`);
    updateDisconnectedTreadmill('disconnected');
  }

  /* FUNCTIONS TO SEND COMMANDS TO CONTROL CHARACTERISTIC*/

  async changeTreadmillStatus(action) {
    console.log(`> Sending request to ${action} treadmill`);
    let server = this.server;
    var service = await server.getPrimaryService(this.serviceUUID)
    if (action == 'start') {
      await this.startTreadmill(service);
    } else if (action == 'stop') {
      await this.stopTreadmill(service);
    }
  }

  async startTreadmill(service) {
    try {
      var characteristic = await service.getCharacteristic(this.controlChUUID)
      console.log(`> ${this.device.name} characteristic found: `, characteristic);
      let val = new Uint8Array(3);
      val[0] = 7;
      console.log('val', val);
      characteristic.writeValue(val);
    } catch(e) {
      console.error(e);
    }
  }

  async stopTreadmill(service) {
    try {
      var characteristic = await service.getCharacteristic(this.controlChUUID)
      console.log(`> ${this.device.name} characteristic found: `, characteristic);
      let val = new Uint8Array(3);
      val[0] = 8;
      console.log('val', val);
      characteristic.writeValue(val);
    } catch(e) {
      console.error(e);
    }
  }

  increaseSpeedStep(currSpeed, speedIncrement) {
    console.log(`> Speed increase clicked. Sending request to ${currSpeed} + ${speedIncrement}.`);
    console.log(currSpeed);
    var newSpeed = (parseFloat(currSpeed) + parseFloat(speedIncrement));
    console.log(newSpeed);
    let server = this.server;
    return server.getPrimaryService(this.serviceUUID)
      .then(service => {
        this.setNewSpeed(service, newSpeed);
      });
  }

  decreaseSpeedStep(currSpeed, speedIncrement) {
    console.log(`> Speed decrease clicked. Sending request to ${currSpeed} - ${speedIncrement}.`);
    console.log(currSpeed);
    var newSpeed = (parseFloat(currSpeed) - parseFloat(speedIncrement));
    console.log(newSpeed);
    let server = this.server;
    return server.getPrimaryService(this.serviceUUID)
      .then(service => {
        this.setNewSpeed(service, newSpeed);
      });
  }

  increaseInclinationStep(currInclination, inclinationIncrement) {
    console.log(`> Inclination increase clicked. Sending request to ${currInclination} + ${inclinationIncrement}.`);
    var newInclination = (parseFloat(currInclination) + parseFloat(inclinationIncrement));
    console.log('new inclination is: ', newInclination);
    let server = this.server;
    return server.getPrimaryService(this.serviceUUID)
      .then(service => {
        this.setNewInclination(service, newInclination);
      });
  }

  decreaseInclinationStep(currInclination, inclinationIncrement) {
    console.log(`> Inclination decrease clicked. Sending request to ${currInclination} - ${inclinationIncrement}.`);
    console.log(currInclination);
    var newInclination = (parseFloat(currInclination) - parseFloat(inclinationIncrement));
    console.log(newInclination);
    let server = this.server;
    return server.getPrimaryService(this.serviceUUID)
      .then(service => {
        this.setNewInclination(service, newInclination);
      });
  }

  setNewSpeed(service, newSpeed) {
    service.getCharacteristic(this.controlChUUID)
      .then(characteristic => {
        console.log(`> ${this.device.name} characteristic found: `, characteristic);
        let b = new Uint8Array(2);
        let newSpeedInt = parseInt(newSpeed * 100);
        for (var i = 0; i < b.length; i++) {
          b[i] = newSpeedInt >> 8 * i;
        }
        let val = new Uint8Array(3);
        val[0] = 2;
        val[1] = b[0];
        val[2] = b[1];
        console.log('val', val);
        characteristic.writeValue(val);
      })
      .catch(error => {
        console.error(error);
      });
  }

  setNewInclination(service, newInclination) {
    service.getCharacteristic(this.controlChUUID)
      .then(characteristic => {
        console.log(`> ${this.device.name} characteristic found: `, characteristic);
        let b = new Uint8Array(2);
        let newInclinationInt = parseInt(newInclination * 10);
        for (var i = 0; i < b.length; i++) {
          b[i] = newInclinationInt >> 8 * i;
        }
        let val = new Uint8Array(3);
        val[0] = 3;
        val[1] = b[0];
        val[2] = b[1];
        console.log('val', val);
        characteristic.writeValue(val);
      })
      .catch(error => {
        console.error(error);
      });
  }

  /* FUNCTIONS TO READ RESPONSES FROM DATA CHARACTERISTIC */

  parseTreadmillData(event) {
    let value = event.target.value;
    value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
    let result = {};
    let index_speed = 2;
    result.speed = Number(value.getUint16(index_speed, /*littleEndian=*/true) / 100).toFixed(1);
    let index_inclination = 9;
    result.inclination = Number(value.getInt16(index_inclination, /*littleEndian=*/true) / 10).toFixed(1);
    let index_distance = 6;
    result.distance = ((value.getUint16(index_distance, true))) + value.getUint8(2 + index_distance, true);
    let index_time = 14;
    let seconds = value.getUint16(index_time, /*littleEndian=*/true);
    result.duration = seconds * 1000;
    result.prettyDuration = new Date(seconds * 1000).toISOString().slice(11, 19);
    result.time = Date.now();
    result.measurementType = 'FTMS';
    console.log(`timestamp: ${result.time} | Treadmill: ${result.speed}km/h | ${result.inclination}% | ${result.distance}m | ${result.prettyDuration}`)
    updateDataTreadmill(result.measurementType, result);
    updateVideoSpeedByTreadmillSpeed(result);
  }

  /* UTILS */

  getDeviceName() {
    return this.device.name;
  }
}