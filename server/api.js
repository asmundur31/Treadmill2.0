/**
 * This module has api endpoints for frontend to get data
 */
import express from 'express';
import fs from 'fs';
import { getRoutes, getRouteById, getRecordings, getRecordingById, getTests, getTestById, saveRecording } from './db.js';
import { exec } from 'child_process';

export const router = express.Router();

const USBPort = '/dev/tty.usbserial-D30B78YP';

router.get('/routes', async (req, res) => {
  var routes = await getRoutes();
  return res.json(routes);
});

router.get('/routes/:id', async (req, res) => {
  var id = req.params.id;
  var route = await getRouteById(id);
  return res.json(route);
});

router.get('/tests', async (req, res) => {
  var tests = await getTests();
  return res.json(tests);
});

router.get('/tests/:id', async (req, res) => {
  var id = req.params.id;
  var test = await getTestById(id);
  return res.json(test);
});

router.get('/recordings', async (req, res) => {
  var recordings = await getRecordings();
  return res.json(recordings);
});

router.get('/recordings/:id', async (req, res) => {
  var id = req.params.id;
  var recording = await getRecordingById(id);
  return res.json(recording);
});

router.post('/recordings', async (req, res) => {
  var recording = req.body;
  try {
    var result = await saveRecording(recording);
    if(result) {
      // Also save to file system
      var data = JSON.stringify(recording);
      fs.writeFileSync('./static/recordings/'+recording.experiment.fileName+'.json', data);
      return res.json('Data saved successfully');
    }
  } catch(error) {
    return res.status(400).send('Database error');
  }
});

// Commands to treadmill
router.get('/treadmill_check', async (req, res) => {
  const pythonScript = './server/python/check_connection.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    var success = true;
    if (error || stderr) {
      success = false;
    }
    res.send({success: success});
  });
});

router.get('/treadmill_speed/:speed', async (req, res) => {
  const { speed } = req.params;
  const pythonScript = './server/python/speed.py';
  const scriptArguments = [speed];
  const argumentString = scriptArguments.join(' ');
  exec(`python3.7 ${pythonScript} ${USBPort} ${argumentString}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

router.get('/treadmill_incline/:incline', async (req, res) => {
  const { incline } = req.params;
  const pythonScript = './server/python/incline.py';
  const scriptArguments = [incline];
  const argumentString = scriptArguments.join(' ');
  exec(`python3.7 ${pythonScript} ${USBPort} ${argumentString}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

router.get('/treadmill_stop', async (req, res) => {
  const pythonScript = './server/python/stop.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

router.get('/treadmill_auto_stop', async (req, res) => {
  const pythonScript = './server/python/auto_stop.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

router.get('/treadmill_start', async (req, res) => {
  const pythonScript = './server/python/start.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

// Get on treadmill
router.get('/treadmill_speed', async (req, res) => {
  const pythonScript = './server/python/get_speed.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});

router.get('/treadmill_incline', async (req, res) => {
  const pythonScript = './server/python/get_incline.py';
  exec(`python3.7 ${pythonScript} ${USBPort}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).send('Error executing Python script');
    }
    if (stderr) {
      console.error(`Python script encountered an error: ${stderr}`);
      return res.status(500).send('Python script error');
    }
    console.log(`Python script output: ${stdout}`);
    res.send(stdout);
  });
});
