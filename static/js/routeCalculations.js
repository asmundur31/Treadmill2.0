import { getRouteById } from './dataFetch.js';
import { 
  getVideoCurrentTime,
  getVideoTotalTime,
  updateInterfaceByVideoProgress } from './routeInterface.js';
import { 
  setTreadmillIncline,
  setRouteNameAndType,
  getTreadmillData,
  updateTreadmillData,
  setTreadmillSpeed,
  updateVideoSpeedByTreadmillSpeed
 } from './connectBluetooth.js';

// Route data
var videoInterval = {};
var totalDistance = {};
var incline = {};
var elevation = {};
var videoSpeedUnit = 7; // average speed in km/h that eaquals video speed 1x
var videoIntervalTime = 500;

// Real data
var distance = 0;

/**
 * Function that starts a interval for the route data
 */
export async function startRouteInterval(routeId) {
  var route = await getRouteById(routeId);
  setRouteNameAndType(route);
  // Get coordinates and elevation lists
  const { coordinates, elevationList } = await formatRouteData(route);
  // Perform calculations on data
  const { totDist, inclineList } = calcData(coordinates, elevationList);
  // Save calculations in global lists
  elevation = elevationList;
  totalDistance = totDist;
  incline = inclineList;
  videoSpeedUnit = (totDist[totDist.length-1]/getVideoTotalTime())*3.6;
  // Update real values
  distance = 0;
  // Start interval
  videoInterval = window.setInterval(async () => {
    // 1. Route calculations
    var newData = calcNewData();
    // 2. Get speed and incline from treadmill
    getTreadmillData()
    .then(async (treadmillData) => {
      // 3. update video speed by treadmill speed
      updateVideoSpeedByTreadmillSpeed(treadmillData.speed);
      // 4. Request incline change
      await setTreadmillIncline(newData.incline);
      var data = {
        speed: treadmillData.speed,
        inclination: treadmillData.incline,
        distance: distance,
        time: Date.now(),
        measurementType: 'FTMS'
      };
      distance += videoIntervalTime*(1/3600)*treadmillData.speed;
      // 5. Update interface
      updateTreadmillData(data);
      updateInterfaceByVideoProgress(newData);
    });
  }, videoIntervalTime);
}

/**
 * Function that stops the interval for the route data
 */
export function stopRouteInterval() {
  clearInterval(videoInterval);
}

/**
 * Function that returns the video speed unit for the video
 */
export function getVideoSpeedUnit() {
  return videoSpeedUnit;
}

/**
 * Function that gets json file and returns the data we need
 */
async function formatRouteData(jsonData) {
  const { route } = jsonData;
  var coordinates = [];
  var elevationList = [];
  route.forEach((dataPoint) => {
    coordinates.push(dataPoint.geometry.coordinates)
    elevationList.push(dataPoint.properties.ele);
  });
  return {coordinates, elevationList};
}

/**
 * Function that calculates the total distance between all the 
 * given points and incline between points. Returns an array with
 * collected distance and incline between every point.
 */
function calcData(coordinates, elevation) {
  var totDist = [0];
  var inclineList = [0];
  var previousPoint = coordinates[0];
  var previousElevation = elevation[0];
  for(var i=1; i<coordinates.length; i++) {
    const nextPoint = coordinates[i];
    const distance = pointDist(previousPoint, nextPoint);
    totDist.push(totDist[totDist.length-1]+distance);
    const nextElevation = elevation[i];
    const incl = calcIncline(previousElevation, nextElevation, distance);
    inclineList.push(incl);
    previousPoint = nextPoint;
    previousElevation = nextElevation;
  }
  return {totDist, inclineList};
}

/**
 * Function that calculates the distance between two Latitude/Longitude
 * points.
 * Reference: http://www.movable-type.co.uk/scripts/latlong.html
 * Points are on the form [Longitude, Latitude]
 */
function pointDist(pointA, pointB) {
  const R = 6371000;
  const latA = pointA[1]*Math.PI/180;
  const latB = pointB[1]*Math.PI/180;
  const latDif = (pointB[1]-pointA[1])*Math.PI/180;
  const lonDif = (pointB[0]-pointA[0])*Math.PI/180;
  const a = Math.sin(latDif/2)*Math.sin(latDif/2) + Math.cos(latA) * Math.cos(latB) * Math.sin(lonDif/2) * Math.sin(lonDif/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
}

/**
 * Function that calculates incline between two elevation samples.
 * Takes in two elevation samples and the distance between them.
 */
function calcIncline(elevationA, elevationB, distance) {
  const inclinePer = ((elevationB-elevationA)/distance)*100;
  return inclinePer;
}

/**
 * Function that calculates new incline for the treadmill
 */
function calcNewData() {
  // First we find progress of video
  var currentTime = getVideoCurrentTime();
  var totalTime = getVideoTotalTime();
  var progress = currentTime/totalTime;
  // Then we assume video speed is constant and find the current distance
  var totDistance = totalDistance[totalDistance.length-1];
  var currentDistance = totDistance*progress;
  // We find the index where we are
  var index = 0;
  while(totalDistance[index]<currentDistance) {
    index++;
  }
  // Then from the index we get the real elevation
  var alfa = (currentDistance-totalDistance[index-1])/(totalDistance[index]-totalDistance[index-1]);
  var ele = elevation[index]*alfa + elevation[index-1]*(1-alfa);
  // Calculate the incline and elevation
  var newIncline = incline[index];
  var newElevation = ele;
  var time = Date.now();
  return {
    'timestamp': time,
    'incline': newIncline,
    'elevation': newElevation,
    'totalDistance': totDistance,
    'currentDistance': currentDistance
  };
}
