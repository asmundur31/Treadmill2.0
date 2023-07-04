import {
  getRequest
} from './utils.js';

export default class TreadmillDevice {
  async checkForTreadmill() {
    const result = await getRequest('/api/treadmill_check');
    return result.success;
  }
  async startTreadmill() {
    const result = await getRequest('/api/treadmill_start');
    this.startTime = Date.now();
    return result;
  }
  async stopTreadmill() {
    const result = await getRequest('/api/treadmill_stop');
    return result;
  }
  async setSpeed(speed) {
    const result = await getRequest(`/api/treadmill_speed/${speed}`);
    return result;
  }
  async getSpeed() {
    const result = await getRequest('/api/treadmill_speed');
    //const result = await getRequest('/api/treadmill_speed_dummy');
    return result.speed;
  }
  async setIncline(incline) {
    const result = await getRequest(`/api/treadmill_incline/${incline}`);
    return result;
  }
  async getIncline() {
    const result = await getRequest('/api/treadmill_incline');
    //const result = await getRequest('/api/treadmill_incline_dummy');
    return result.incline;
  }
}