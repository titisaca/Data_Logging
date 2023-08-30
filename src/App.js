import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import * as faceapi from 'face-api.js';

function ConsoleOutput({ logData }) {
  return (
    <div>
      <h1>Console Output</h1>
      <ul>
        {logData.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [logData, setLogData] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('');
  const [faceExpressionData, setFaceExpressionData] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const loadModels = useCallback(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    ]).then(() => {
      faceMyDetect();
    });
  }, []);

  useEffect(() => {
    startVideo();
    loadModels();
  }, [loadModels]);

  const videoRef = useRef();
  const canvasRef = useRef();

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const logToConsole = (data) => {
    const timestamp = new Date().toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3 });
    const logEntry = `${timestamp},${data.acceleration.x},${data.acceleration.y},${data.acceleration.z},${data.rotationRate.alpha},${data.rotationRate.beta},${data.rotationRate.gamma}`;
    setLogData((prevLogData) => [...prevLogData, logEntry]);
    console.log(logEntry); // Log to browser console
  };

  const handleDeviceMotion = (event) => {
    const accelerometerData = event.accelerationIncludingGravity;
    const gyroscopeData = event.rotationRate;
    logToConsole({ acceleration: accelerometerData, rotationRate: gyroscopeData });
    setSensorData((prevSensorData) => [...prevSensorData, logToCSV(accelerometerData, gyroscopeData)]);
  };

  const requestDeviceMotionAccess = () => {
    if (
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      DeviceMotionEvent.requestPermission().then((permissionState) => {
        setPermissionStatus(permissionState);
        if (permissionState === 'granted') {
          console.log('Device motion access granted.');
        }
      });
    }
  };

  const toggleDemo = () => {
    if (isRunning) {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      setIsRunning(false);
      clearInterval(intervalId);
      console.log('Demo stopped.');
    } else {
      console.log('Demo started. Accelerometer and gyroscope data is being captured.');
      window.addEventListener('devicemotion', handleDeviceMotion);
      setIsRunning(true);
      const newIntervalId = setInterval(() => {
        if (isRunning) {
          clearInterval(newIntervalId);
          console.log('Interval stopped.');
        }
      }, 5000); // Adjust the interval time (in milliseconds) as needed
      setIntervalId(newIntervalId);
    }
  };

  const logToCSV = (accelerometerData, gyroscopeData) => {
    const timestamp = new Date().toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3 });
    return `${timestamp},${accelerometerData.x},${accelerometerData.y},${accelerometerData.z},${gyroscopeData.alpha},${gyroscopeData.beta},${gyroscopeData.gamma}`;
  };

  const exportSensorDataToCSV = () => {
    if (sensorData.length === 0) {
      return;
    }

    const columnNames = 'Date, Time, Accelerometer_X, Accelerometer_Y, Accelerometer_Z, Gyroscope_Alpha, Gyroscope_Beta, Gyroscope_Gamma';
    const csvContent = columnNames + '\n' + sensorData.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensor_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExpressionDataToCSV = () => {
    if (faceExpressionData.length === 0) {
      return;
    }

    const columnNames = 'Date, Time, Happy, Sad, Surprised, Neutral, Fearful, Disgusted, Angry';
    const csvRows = faceExpressionData.map((entry) => [
      entry.timestamp,
      entry.happy.toFixed(2),
      entry.sad.toFixed(2),
      entry.surprised.toFixed(2),
      entry.neutral.toFixed(2),
      entry.fearful.toFixed(2),
      entry.disgusted.toFixed(2),
      entry.angry.toFixed(2),
    ]);

    const updatedCsvContent = [columnNames, ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([updatedCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expression_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const faceMyDetect = () => {
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

      const expressionData = {
        timestamp: new Date().toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3 }),
        happy: detections[0]?.expressions.happy || 0,
        sad: detections[0]?.expressions.sad || 0,
        surprised: detections[0]?.expressions.surprised || 0,
        neutral: detections[0]?.expressions.neutral || 0,
        fearful: detections[0]?.expressions.fearful || 0,
        disgusted: detections[0]?.expressions.disgusted || 0,
        angry: detections[0]?.expressions.angry || 0,
      };
      console.log('Expression data:', expressionData);

      setFaceExpressionData((prevData) => [...prevData, expressionData]);

      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
      faceapi.matchDimensions(canvasRef.current, {
        width: 940,
        height: 650,
      });

      const resized = faceapi.resizeResults(detections, {
        width: 940,
        height: 650,
      });

      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
    }, 1000);
  };

  return (
    <div>
      <h1>Combined Demo: Face Detection, Accelerometer, and Gyroscope</h1>
      <div className="myapp">
        <h2>Face Detection</h2>
        <div className="appvideo">
          <video crossOrigin="anonymous" ref={videoRef} autoPlay></video>
        </div>
        <canvas ref={canvasRef} width="940" height="650" className="appcanvas" />
      </div>
      <div className="expression-data-demo">
        <h2>Expression Data Demo</h2>
        <button onClick={exportExpressionDataToCSV}>Export Expression Data to CSV</button>
        <ConsoleOutput logData={logData} />
      </div>
      <div className="accelerometer-gyroscope-demo">
        <h2>Accelerometer and Gyroscope Demo</h2>
        <button onClick={exportSensorDataToCSV}>Export Sensor Data to CSV</button>
        <button
          id="start_demo"
          className={`btn ${isRunning ? 'btn-danger' : 'btn-success'}`}
          onClick={toggleDemo}
        >
          {isRunning ? 'Stop demo' : 'Start demo'}
        </button>
        {permissionStatus === 'granted' ? (
          <p>Permission status: Granted</p>
        ) : permissionStatus === 'pending' ? (
          <button onClick={requestDeviceMotionAccess}>Request Device Motion Access</button>
        ) : (
          <p>Permission status: Denied. Enable motion and orientation access in your browser settings.</p>
        )}
        <ConsoleOutput logData={logData} />
      </div>
    </div>
  );
}

export default App;
