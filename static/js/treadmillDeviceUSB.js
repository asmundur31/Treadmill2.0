import {
  getRequest
} from './utils.js';
import {
  updateTreadmillData,
  updateVideoSpeedByTreadmillSpeed
} from './connectBluetooth.js';

export default class TreadmillDevice {
  
  constructor() {
    this.interval = {};
    this.intervalFrequency = 1000;
    this.distance = 0;
    this.startTime = 0;
  }

  async checkForTreadmill() {
    const result = {success: true};//await getRequest('/api/treadmill_check');
    return result.success;
  }
  async startTreadmill() {
    const result = true;//await getRequest('/api/treadmill_start');
    this.startTime = Date.now();
    return result;
  }
  async stopTreadmill() {
    const result = true;//await getRequest('/api/treadmill_stop');
    return result;
  }
  async setSpeed(speed) {
    const result = true;//await getRequest(`/api/treadmill_speed/${speed}`);
    return result;
  }
  async getSpeed() {
    const result = 5;//await getRequest('/api/treadmill_speed');
    return result;
  }
  async setIncline(incline) {
    const result = true;//await getRequest(`/api/treadmill_incline/${incline}`);
    return result;
  }
  async getIncline() {
    const result = 2;//await getRequest('/api/treadmill_incline');
    return result;
  }

  startCollectingData() {
    this.interval = window.setInterval(async () => {
      var data = await this.getDummyData();//this.getData();
      updateTreadmillData(data);
      updateVideoSpeedByTreadmillSpeed(data);
    }, this.intervalFrequency);
  }
  stopCollectingData() {
    clearInterval(this.interval);
  }

  getData = async () => {
    this.speed = await getRequest('/api/treadmill_speed');
    this.incline = await getRequest('/api/treadmill_incline');
    const data = {
      speed: this.speed,
      inclination: this.incline,
      distance: this.distance,
      time: Date.now(),
      measurementType: 'FTMS'
    };
    this.distance += this.intervalFrequency*(1/3600)*this.speed;
    return data;
  }
  getDummyData = async () => {
    this.speed = 5;
    this.incline = 10;
    const data = {
      speed: this.speed,
      inclination: this.incline,
      distance: this.distance,
      time: Date.now(),
      measurementType: 'FTMS'
    };
    this.distance += this.intervalFrequency*(1/3600)*this.speed;
    return data;
  }
}