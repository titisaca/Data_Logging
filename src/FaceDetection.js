import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

function FaceDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startFaceDetection = async () => {
      await loadModelsAndStartTracking();

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.addEventListener('play', async () => {
            video.addEventListener('loadedmetadata', () => {
              const displaySize = { width: video.videoWidth, height: video.videoHeight };
              faceapi.matchDimensions(canvas, displaySize);
          
              setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                  .withFaceLandmarks();
          
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          console.log("face")
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
              }, 10); // Adjust the interval time (in milliseconds) as needed
            });
          });          
      }
    };

    startFaceDetection();
  }, []);

  const loadModelsAndStartTracking = async () => {
    console.log('Loading models...');
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      console.log('TinyFaceDetector loaded');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      console.log('FaceLandmark68Net loaded');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      console.log('FaceRecognitionNet loaded');
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  return (
    <div>
      <h2>Face Detection</h2>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
}

export default FaceDetection;
