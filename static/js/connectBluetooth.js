/**
 * This module handles all connections via bluetooth to all devices.
 */
import { showToast } from './utils.js';
import TreadmillDevice from './treadmillDeviceUSB.js';
import HeartRateDevice from './hrDevice.js';
import { 
  updateInterfaceTreadmillConnected,
  updateInterfaceTreadmillDisconnected,
  updateInterfaceHRConnected,
  updateInterfaceHRDisconnected,
  updateInterfaceTreadmillSpeedText,
  updateInterfaceTreadmillInclineText,
  updateInterfaceHRText,
  updateInterfaceVideoSpeed
} from './routeInterface.js';
import { getVideoSpeedUnit } from './routeCalculations.js';
import { saveRecording } from './dataFetch.js';

// Devices
let treadmillDevice = new TreadmillDevice();
let heartRateDevice = new HeartRateDevice();

// Measurments
var treadmillMeasurements = {};
var heartRateMeasurements = {};
var routeData = {
  dataPoints: []
};
var recordingName;
var recordingType;
var recordingStartTime;
var recordingEndTime;
var recordingDuration;

// Elements
var connectTreadmillButton = document.getElementById('connect_treadmill_button');
var disconnectTreadmillButton = document.getElementById('disconnect_treadmill_button');
var connectHRButton = document.getElementById('connect_hr_button');
var disconnectHRButton = document.getElementById('disconnect_hr_button');

// Set listeners
connectTreadmillButton.addEventListener('click', connectTreadmill);
disconnectTreadmillButton.addEventListener('click', disconnectTreadmill);
connectHRButton.addEventListener('click', connectHR);
disconnectHRButton.addEventListener('click', disconnectHR);

// Listeners
async function connectTreadmill() {
  // Check if treadmill is connected
  const success = await treadmillDevice.checkForTreadmill();
  if(success) {
    // Update interface after treadmill connected
    updateInterfaceTreadmillConnected();
  } else {
    showToast('Treadmill', 'Treadmill was not found at the port given.', 'fail');
  }
}

function disconnectTreadmill() {
  updateInterfaceTreadmillDisconnected();
}

async function connectHR() {
  try {
    await heartRateDevice.connect();
    updateInterfaceHRConnected();
  } catch (error) {
    console.error(error);
  }
}

function disconnectHR() {
  heartRateDevice.disconnect();
  updateInterfaceHRDisconnected();
}

// Functions
export function updateDisconnectedTreadmill(reason) {
  treadmillDevice = new TreadmillDevice();
  switch (reason) {
    case 'failed_connection':
      console.log("Connection to Treadmill failed. Try again.", "Treadmill device");
      break;
    case 'lost_connection':
      console.log("Connection to Treadmill lost. Try again.", "Treadmill device");
      break;
    case 'disconnected':
      console.log("Disconnected from Treadmill.", "Treadmill device");
      break;
    default:
      return;
  }
}
export function updateConnectedTreadmill() {
  treadmillMeasurements = {};
}
export function updateTreadmillData(treadmillData) {
  updateInterfaceTreadmillSpeedText(treadmillData.speed);
  updateInterfaceTreadmillInclineText(treadmillData.inclination);
  if(treadmillMeasurements[treadmillData.measurementType] == undefined) {
    treadmillMeasurements[treadmillData.measurementType] = [];
  }
  treadmillMeasurements[treadmillData.measurementType].push(treadmillData);
}

export function updateDisconnectedHR(reason) {
  heartRateDevice = new HeartRateDevice();
  switch (reason) {
    case 'failed_connection':
      console.log("Connection to HR sensor failed. Try again.", "Heart rate sensor");
      break;
    case 'lost_connection':
      console.log("Connection to HR sensor lost. Try again.", "Heart rate sensor");
      break;
    case 'disconnected':
      console.log("Disconnected from HR sensor.", "Heart rate sensor");
      break;
    default:
      return;
  }
}
export function updateConnectedHR() {
  heartRateMeasurements = {};
}
export function updateDataHR(measurementType, heartRateMeasurement) {
  updateInterfaceHRText(heartRateMeasurement.heartRate);
  if (heartRateMeasurements[measurementType] == undefined) {
    heartRateMeasurements[measurementType] = [];
  }
  heartRateMeasurements[measurementType].push(heartRateMeasurement);
}

// Functions to control the treadmill
/**
 * Function that sets the incline on the treadmill
 */
export async function setTreadmillIncline(newIncline) {
  console.log('Update incline on treadmill to '+newIncline);
  await treadmillDevice.setIncline(10+newIncline);
}

/**
 * Function that sets the speed on the treadmill
 */
 export async function setTreadmillSpeed(newSpeed) {
  console.log('Update speed on treadmill to '+newSpeed);
  await treadmillDevice.setSpeed(newSpeed);
}

/**
 * Function that starts the treadmill
 */
export async function startTreadmill() {
  const result = await treadmillDevice.startTreadmill();
}

/**
 * Function that stops the treadmill
 */
 export async function stopTreadmill() {
  const result = await treadmillDevice.stopTreadmill();
}

/**
 * Function that updates the video speed by treadmill speed
 */
 export function updateVideoSpeedByTreadmillSpeed(treadmillMeasurement) {
  var treadmillSpeed = treadmillMeasurement.speed;
  var videoSpeedUnit = getVideoSpeedUnit();
  var newVideoSpeed = treadmillSpeed*1.2/videoSpeedUnit;
  updateInterfaceVideoSpeed(newVideoSpeed);
}

// Get mesurement data
/**
 * Function that starts the recording
 */
export function startRecording() {
  console.log('Start recording');
  recordingStartTime = Date.now();
  treadmillMeasurements = {};
  treadmillDevice.startCollectingData();
  heartRateMeasurements = {};
  routeData = {
    dataPoints: []
  };
}

/**
 * Function that ends the recording and saves the data to a file
 */
export async function endRecording() {
  console.log('End recording');
  treadmillDevice.stopCollectingData();
  recordingEndTime = Date.now();
  recordingDuration = recordingEndTime - recordingStartTime;

  // Creating the json file
  var fileName = `recording_${recordingName.replace(/\s/g, '')}_${recordingType}_${crypto.randomUUID()}`;
  var experiment = {
    fileName: fileName,
    name: recordingName,
    type: recordingType,
    duration: recordingDuration,
    startTime: recordingStartTime,
    endTime: recordingEndTime,
    devices: {
      treadmill: "Via USB",
      hr: heartRateDevice.device ? heartRateDevice.getDeviceName() : "Not connected"
    }
  };
  var treadmill = {
    device: experiment.devices.treadmill,
    measurements: treadmillMeasurements
  };
  var hr = {
    device: experiment.devices.hr,
    measurements: heartRateMeasurements
  };
  var recordingJSON = {experiment, treadmill, hr, routeData};

  // Send a post request to save the recording
  var result = await saveRecording(recordingJSON);
  if(result.status != 200) {
    showToast('Record data', 'Recorded data did not save successfully', 'fail');
  } else {
    showToast('Record data', 'Data has been recorded and saved.', 'success');
  }

  // Reset all variables
  recordingName = "";
  recordingType = "";
  recordingStartTime = null;
  recordingEndTime = null;
  recordingDuration = null;
  treadmillMeasurements = {};
  heartRateMeasurements = {};
  routeData = {
    dataPoints: []
  };
}

/**
 * Function that sets new data to the routeData
 */
export function setRouteData(data) {
  var dataPoint = {
    timestamp: data.timestamp,
    incline: data.incline,
    elevation: data.elevation,
    currentDistance: data.currentDistance
  };
  routeData['dataPoints'].push(dataPoint);
}

/**
 * Function that sets the route name and type
 */
export function setRouteNameAndType(route) {
  recordingName = route.name;
  recordingType = 'route';
}
