/**
 * Module that handles all the interface for the route
 */
import { showToast } from './utils.js';
import { 
  startRouteInterval,
  stopRouteInterval
} from './routeCalculations.js';
import {
  startTreadmill,
  stopTreadmill,
  setTreadmillSpeed,
  setTreadmillIncline,
  startRecording,
  endRecording,
  setRouteData
} from './connectBluetooth.js';

// Elements
var connectTreadmillButton = document.getElementById('connect_treadmill_button');
var disconnectTreadmillButton = document.getElementById('disconnect_treadmill_button');
var connectHRButton = document.getElementById('connect_hr_button');
var disconnectHRButton = document.getElementById('disconnect_hr_button');

var routeControlsOverlay = document.getElementsByClassName('video_overlay_controls')[0];
var startRouteButton = document.getElementById('start_route_button');
var pauseRouteButton = document.getElementById('pause_route_button');
var endRouteButton = document.getElementById('end_route_button');
var fullscreenButton = document.getElementById('fullscreen_button');

var cooldownCountdownOverlay = document.getElementsByClassName('video_overlay_countdown')[0];
var cooldownCountdownText = document.getElementById('countdown_text');

var videoContainer = document.getElementsByClassName('video_container')[0];
var videoElement = document.getElementById('video');

var videoSpeedText = document.getElementById('video_speed_text');
var treadmillSpeedText = document.getElementById('treadmill_speed_text');
var treadmillInclineText = document.getElementById('treadmill_incline_text');
var treadmillTotalDistanceText = document.getElementById('treadmill_total_distance_text');
var treadmillDistanceText = document.getElementById('treadmill_distance_text');
var heartRateText = document.getElementById('hr_text');
var elevationText = document.getElementById('elevation_text');
var inclineText = document.getElementById('incline_text');

// Listeners
startRouteButton.addEventListener('click', async () => {
  startRouteButton.classList.add('d-none');
  // Go to fullscreen and make sure we are at the top
  videoContainer.classList.add('fullscreen');
  $('html,body').scrollTop(0);
  // Get the id of the route from the pathname
  var routeId = window.location.pathname;
  routeId = parseInt(routeId[routeId.length-1]);
  startTreadmill()
  .then(() => {
    startRecording();
    startRouteInterval(routeId);
    videoElement.play();
  });
});

pauseRouteButton.addEventListener('click', async () => {
  if (!video.paused) {
    videoElement.pause();
    pauseRouteButton.innerText = 'Resume';
  } else {
    videoElement.play();
    pauseRouteButton.innerText = 'Pause';
  }
});

endRouteButton.addEventListener('click', async () => {
  await endRecording();
  stopRouteInterval();
  setTimeout(async () => {
    await startCooldown(10);
  }, 1000);
});

fullscreenButton.addEventListener('click', () => {
  videoContainer.classList.toggle('fullscreen');
});

videoElement.addEventListener('ended', async () => {
  await endRecording();
  stopRouteInterval();
  setTimeout(async () => {
    await startCooldown(10);
  }, 1000);
});

/**
 * Function that updates the interface when treadmill connects with
 * bluetooth.
 */
export function updateInterfaceTreadmillConnected() {
  showToast('Successful connection', 'Treadmill device is connected via USB.', 'success');
  connectTreadmillButton.classList.add('d-none');
  disconnectTreadmillButton.classList.remove('d-none');
  routeControlsOverlay.classList.remove('d-none');
}

/**
 * Function that updates the interface when treadmill disconnects from
 * bluetooth.
 */
 export function updateInterfaceTreadmillDisconnected() {
  showToast('Successful disconnection', 'Treadmill device has disconnected.', 'success');
  connectTreadmillButton.classList.remove('d-none');
  disconnectTreadmillButton.classList.add('d-none');
  routeControlsOverlay.classList.add('d-none');
}

/**
 * Function that updates the interface when treadmill connects with
 * bluetooth.
 */
 export function updateInterfaceHRConnected() {
  showToast('Successful connection', 'Heart rate device is connected via bluetooth.', 'success');
  connectHRButton.classList.add('d-none');
  disconnectHRButton.classList.remove('d-none');
}

/**
 * Function that updates the interface when treadmill disconnects from
 * bluetooth.
 */
 export function updateInterfaceHRDisconnected() {
  showToast('Successful disconnection', 'Heart rate device has disconnected from bluetooth.', 'success');
  connectHRButton.classList.remove('d-none');
  disconnectHRButton.classList.add('d-none');
}

/**
 * Function that updates the text of the treadmill speed
 */
 export function updateInterfaceTreadmillSpeedText(treadmillSpeed) {
  treadmillSpeedText.innerHTML = parseFloat(treadmillSpeed).toFixed(1) + ' km/h';
}

/**
 * Function that updates the text of the treadmill inclination
 */
 export function updateInterfaceTreadmillInclineText(treadmillIncline) {
  treadmillInclineText.innerHTML = parseFloat(treadmillIncline).toFixed(0) + ' %';
}

/**
 * Function that updates the text of the heart rate
 */
export function updateInterfaceHRText(heartRate) {
  heartRateText.innerHTML = heartRate.toFixed(0) + ' bpm';
}

/**
 * Function that updates interface from progress of video
 */
export function updateInterfaceByVideoProgress(data) {
  elevationText.innerHTML = data.elevation.toFixed(2) + ' m';
  inclineText.innerHTML = data.incline.toFixed(1) + ' %';
  treadmillTotalDistanceText.innerHTML = data.totalDistance.toFixed(0) + ' m';
  treadmillDistanceText.innerHTML = data.currentDistance.toFixed(0) + ' m';
  setRouteData(data);
}

/**
 * Function that updates interface of video play speed
 */
export function updateInterfaceVideoSpeed(newVideoSpeed) {
  if(newVideoSpeed < 0.0625) {
    newVideoSpeed = 0.0625;
  } else if(newVideoSpeed > 16) {
    newVideoSpeed = 16;
  }
  videoElement.playbackRate = parseFloat(newVideoSpeed);
  videoSpeedText.innerHTML = newVideoSpeed.toFixed(2) + 'x';
}

/**
 * Function that returns the current time on the video
 */
export function getVideoCurrentTime() {
  return videoElement.currentTime;
}

/**
 * Function that returns the total time on the video
 */
 export function getVideoTotalTime() {
  return videoElement.duration;
}

/**
 * Function that displays the cooldown for sec seconds
 */
async function startCooldown(sec) {
  await setTreadmillSpeed(3);
  await setTreadmillIncline(0);
  videoElement.pause();
  // Cooldown
  cooldownCountdownOverlay.classList.remove('d-none');
  cooldownCountdownText.innerHTML = sec;
  var timeleft = sec; // second cooldown
  var countdownInterval = setInterval(async () => {
    if(timeleft <= 0) {
      await stopTreadmill();
      cooldownCountdownOverlay.classList.add('d-none');
      videoContainer.classList.remove('fullscreen');
      startRouteButton.classList.remove('d-none');
      clearInterval(countdownInterval);
      videoElement.currentTime = 0;
    }
    cooldownCountdownText.innerHTML = timeleft;
    timeleft -= 1;
  }, 1000);
}
