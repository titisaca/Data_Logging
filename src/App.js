import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (
      'DeviceMotionEvent' in window &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      setPermissionStatus('pending');
    }
  }, []);

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

  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

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

  const exportToCSV = () => {
    if (logData.length === 0) {
      return;
    }

    const columnNames = 'Date, Time, Accelerometer_X, Accelerometer_Y, Accelerometer_Z, Gyroscope_Alpha, Gyroscope_Beta, Gyroscope_Gamma';
    const csvContent = `${columnNames}\n${logData.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensor_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Accelerometer and Gyroscope Demo</h1>
      <div>
        <button onClick={exportToCSV}>Export to CSV</button>
      </div>
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
        <p>
          Permission status: Denied. Enable motion and orientation access in your browser settings.
        </p>
      )}
      <ConsoleOutput logData={logData} />
    </div>
  );
}

export default App;
