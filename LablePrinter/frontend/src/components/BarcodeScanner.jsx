/**
 * BarcodeScanner Component
 * Uses ZXing library to scan PDF417 barcodes from driver's licenses
 * via image capture (camera or file upload) for better accuracy
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Button } from 'primereact/button';

// Configure hints for PDF417 + QR (optimized for accuracy)
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.PDF_417,  // Focus on PDF417 for driver licenses
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E
]);
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, false);
hints.set(DecodeHintType.ASSUME_GS1, false);
hints.set(DecodeHintType.RETURN_CODABAR_START_END, false);
hints.set(DecodeHintType.ALLOWED_LENGTHS, null);
hints.set(DecodeHintType.ALLOWED_EAN_EXTENSIONS, null);
hints.set(DecodeHintType.PURE_BARCODE, false);
hints.set(DecodeHintType.ALSO_INVERTED, true);  // Try inverted barcodes

export default function BarcodeScanner({ onScan, onError, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanRef = useRef(null);

  const [status, setStatus] = useState('initializing'); // initializing | ready | capturing | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);

  // ── Initialize scanner ──────────────────────────────────────────────────────
  const initScanner = useCallback(async () => {
    try {
      setStatus('initializing');

      readerRef.current = new BrowserMultiFormatReader(hints);

      // Get available cameras
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(videoInputDevices);

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      setStatus('ready');

    } catch (err) {
      console.error('Scanner init error:', err);
      let msg;
      
      if (err.name === 'NotAllowedError') {
        msg = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found. Please use a device with a camera.';
      } else if (err.name === 'AbortError' || err.message.includes('aborted')) {
        msg = 'Camera access was interrupted. Please try again.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is already in use by another application.';
      } else {
        msg = `Camera error: ${err.message}`;
      }

      setErrorMsg(msg);
      setStatus('error');
      onError?.(new Error(msg));
    }
  }, []); // eslint-disable-line

  // ── Start camera for capture ──────────────────────────────────────────────────
  const startCamera = useCallback(async (cameraIndex = 0) => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      console.log('Available cameras:', videoInputDevices);
      
      let selectedDevice = videoInputDevices[cameraIndex] || videoInputDevices[0];
      
      // Aggressively prefer rear camera on mobile
      const rearCamera = videoInputDevices.find(d =>
        /back|rear|environment/i.test(d.label)
      );
      const environmentCamera = videoInputDevices.find(d =>
        /environment/i.test(d.label)
      );
      const camera0 = videoInputDevices.find(d => d.deviceId === 'camera0');
      
      // Priority order: rear camera > environment camera > camera0 > first camera
      if (rearCamera) {
        selectedDevice = rearCamera;
        console.log('Using rear camera:', rearCamera);
      } else if (environmentCamera) {
        selectedDevice = environmentCamera;
        console.log('Using environment camera:', environmentCamera);
      } else if (camera0 && videoInputDevices.length > 1) {
        selectedDevice = camera0;
        console.log('Using camera0:', camera0);
      } else {
        console.log('Using first available camera:', selectedDevice);
      }

      console.log('Starting camera with device:', selectedDevice);

      // Try with device-specific constraints first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedDevice.deviceId ? { exact: selectedDevice.deviceId } : undefined,
            facingMode: 'environment', // Force back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (mediaError) {
        console.warn('Device-specific constraints failed, trying environment facing mode:', mediaError);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment' // Try to force back camera
            }
          });
        } catch (facingModeError) {
          console.warn('Environment facing mode failed, trying basic camera:', facingModeError);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      streamRef.current = stream;
      console.log('Camera stream obtained:', stream);

      // Set status to capturing first to ensure video element is rendered
      setStatus('capturing');
      
      // Wait a moment for the video element to be mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            resolve();
          };
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
            reject(e);
          };
          setTimeout(() => reject(new Error('Video load timeout')), 5000);
        });
        
        try {
          await videoRef.current.play();
          console.log('Video playing successfully');
        } catch (playError) {
          console.error('Video play error:', playError);
          throw new Error('Failed to start video playback');
        }
      } else {
        throw new Error('Video element not found');
      }

    } catch (err) {
      console.error('Camera start error:', err);
      const msg = `Camera error: ${err.message}`;
      setErrorMsg(msg);
      setStatus('error');
      onError?.(new Error(msg));
    }
  }, []);

  // ── Capture photo from video stream ────────────────────────────────────────────
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      console.error('Video, canvas, or stream not available for capture.');
      return;
    }

    setStatus('processing');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      console.error('Could not get 2D context from canvas.');
      setErrorMsg('Camera error: Could not process image.');
      setStatus('error');
      return;
    }

    // Set canvas dimensions to match video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data and convert to grayscale for better barcode detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const grayImageData = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      // Luminance method for grayscale
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      grayImageData.data[i] = gray;
      grayImageData.data[i + 1] = gray;
      grayImageData.data[i + 2] = gray;
      grayImageData.data[i + 3] = imageData.data[i + 3]; // Alpha
    }
    context.putImageData(grayImageData, 0, 0);

    const imageSrc = canvas.toDataURL('image/png');
    setCapturedImage(imageSrc);

    try {
      console.log('Attempting to decode barcode...');
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromCanvas(canvas);
      console.log('Barcode scan result:', result);
      if (result && result.getText()) {
        onScan(result.getText());
        setStatus('success');
      } else {
        setErrorMsg('No barcode detected. Please retake the photo with better lighting and focus.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Barcode decoding error:', err);
      setErrorMsg('Camera error: No barcode detected. Please retake the photo with better lighting and focus.');
      setStatus('error');
    }

    // Stop camera stream after capture
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, [onScan]);

  // ── Enhanced image processing for better barcode detection ───────────────────────
  const enhanceImageForBarcode = useCallback((imageData, width, height) => {
    const data = imageData.data;
    const enhancedData = new ImageData(width, height);
    
    // Apply multiple enhancement techniques
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 1. Convert to grayscale using luminance
      let gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // 2. Apply contrast enhancement
      gray = ((gray - 128) * 1.5) + 128;
      
      // 3. Apply threshold to make it more binary
      if (gray > 180) gray = 255;
      else if (gray < 80) gray = 0;
      else gray = (gray - 80) * (255 / 100);
      
      // 4. Clamp values
      gray = Math.max(0, Math.min(255, gray));
      
      enhancedData.data[i] = gray;
      enhancedData.data[i + 1] = gray;
      enhancedData.data[i + 2] = gray;
      enhancedData.data[i + 3] = 255; // Alpha
    }
    
    return enhancedData;
  }, []);

  // ── Try multiple decoding approaches ─────────────────────────────────────────────
  const tryDecodeWithMultipleMethods = useCallback(async (canvas) => {
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Method 1: Original image
    console.log('Trying original image...');
    try {
      const reader1 = new BrowserMultiFormatReader(hints);
      const result1 = await reader1.decodeFromCanvas(canvas);
      if (result1 && result1.getText()) {
        console.log('Success with original image');
        return result1.getText();
      }
    } catch (err) {
      console.log('Original image failed:', err.message);
    }
    
    // Method 2: Enhanced grayscale
    console.log('Trying enhanced grayscale...');
    try {
      const imageData = context.getImageData(0, 0, width, height);
      const enhancedData = enhanceImageForBarcode(imageData, width, height);
      context.putImageData(enhancedData, 0, 0);
      
      const reader2 = new BrowserMultiFormatReader(hints);
      const result2 = await reader2.decodeFromCanvas(canvas);
      if (result2 && result2.getText()) {
        console.log('Success with enhanced grayscale');
        return result2.getText();
      }
    } catch (err) {
      console.log('Enhanced grayscale failed:', err.message);
    }
    
    // Method 3: Inverted image
    console.log('Trying inverted image...');
    try {
      const imageData = context.getImageData(0, 0, width, height);
      const invertedData = new ImageData(width, height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        invertedData.data[i] = 255 - imageData.data[i];
        invertedData.data[i + 1] = 255 - imageData.data[i + 1];
        invertedData.data[i + 2] = 255 - imageData.data[i + 2];
        invertedData.data[i + 3] = imageData.data[i + 3];
      }
      context.putImageData(invertedData, 0, 0);
      
      const reader3 = new BrowserMultiFormatReader(hints);
      const result3 = await reader3.decodeFromCanvas(canvas);
      if (result3 && result3.getText()) {
        console.log('Success with inverted image');
        return result3.getText();
      }
    } catch (err) {
      console.log('Inverted image failed:', err.message);
    }
    
    // Method 4: Resized image (smaller for better detection)
    console.log('Trying resized image...');
    try {
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = width * 0.5;
      tempCanvas.height = height * 0.5;
      tempContext.drawImage(canvas, 0, 0, width, height, 0, 0, tempCanvas.width, tempCanvas.height);
      
      const reader4 = new BrowserMultiFormatReader(hints);
      const result4 = await reader4.decodeFromCanvas(tempCanvas);
      if (result4 && result4.getText()) {
        console.log('Success with resized image');
        return result4.getText();
      }
    } catch (err) {
      console.log('Resized image failed:', err.message);
    }
    
    return null;
  }, [enhanceImageForBarcode]);
  const processImage = useCallback(async (imageData) => {
    try {
      setStatus('processing');
      console.log('Processing image for barcode...');

      // Convert data URL to Image element
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Use ZXing to decode from image
      const result = await readerRef.current.decodeFromImage(img);
      
      if (result && result.getText()) {
        handleScanResult(result.getText());
      } else {
        throw new Error('No barcode found in image');
      }

    } catch (err) {
      console.error('Image processing error:', err);
      const msg = `No barcode detected. Please retake the photo with better lighting and focus.`;
      setErrorMsg(msg);
      setStatus('capturing');
      onError?.(new Error(msg));
    }
  }, []);

  // ── Handle file upload ─────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('processing');
    console.log('Processing uploaded file:', file.name);

    try {
      // Create image element from file
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Set canvas dimensions
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      context.drawImage(img, 0, 0);

      const imageSrc = canvas.toDataURL('image/png');
      setCapturedImage(imageSrc);

      // Try multiple decoding methods for maximum accuracy
      console.log('Starting multi-method barcode detection...');
      const result = await tryDecodeWithMultipleMethods(canvas);
      
      if (result) {
        console.log('Barcode detected successfully:', result.substring(0, 50) + '...');
        onScan(result);
        setStatus('success');
      } else {
        setErrorMsg('No barcode detected. Try uploading a clearer image with better lighting and focus on the barcode.');
        setStatus('error');
      }

      // Clean up object URL
      URL.revokeObjectURL(imageUrl);

    } catch (err) {
      console.error('File processing error:', err);
      setErrorMsg('Failed to process image. Please try a different image format.');
      setStatus('error');
    }
  }, [onScan, tryDecodeWithMultipleMethods]);

  // ── Handle successful scan ─────────────────────────────────────────────────────
  const handleScanResult = useCallback((text) => {
    console.log('Scan result:', text);
    
    if (!text) return;
    
    // Less restrictive length check
    if (text.length < 10) {
      console.log('Text too short:', text.length, 'characters');
      return;
    }

    // Debounce: avoid duplicate scans
    const now = Date.now();
    if (lastScanRef.current && now - lastScanRef.current < 2000) {
      console.log('Debounced scan');
      return;
    }

    console.log('Valid scan accepted:', text.substring(0, 50) + '...');
    lastScanRef.current = now;

    setStatus('success');

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Audio feedback
    playSuccessSound();

    // Delay to show success state before calling callback
    setTimeout(() => {
      onScan?.(text);
    }, 600);
  }, [onScan]); // eslint-disable-line

  // ── Retake photo ─────────────────────────────────────────────────────────────
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setErrorMsg('');
    startCamera(activeCameraIdx);
  }, [activeCameraIdx, startCamera]);

  // ── Switch camera ───────────────────────────────────────────────────────────────
  const switchCamera = useCallback(() => {
    const nextIdx = (activeCameraIdx + 1) % Math.max(cameras.length, 1);
    setActiveCameraIdx(nextIdx);
    startCamera(nextIdx);
  }, [activeCameraIdx, cameras.length, startCamera]);

  // ── Lifecycle ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    initScanner();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [initScanner]); // eslint-disable-line

  // ── Play success sound ──────────────────────────────────────────────────────────
  function playSuccessSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  // ── Render ─────────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="scanner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <i className="pi pi-exclamation-triangle" style={{ fontSize: '3rem', color: '#ef5350' }} />
        <p style={{ color: 'white', textAlign: 'center', maxWidth: 280 }}>{errorMsg}</p>
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          className="p-button-warning"
          onClick={() => initScanner()}
        />
        <Button
          label="Cancel"
          icon="pi pi-times"
          className="p-button-text"
          style={{ color: 'white' }}
          onClick={() => onCancel?.()}
        />
      </div>
    );
  }

  if (status === 'initializing') {
    return (
      <div className="scanner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
        <span style={{ color: 'white' }}>Initializing scanner...</span>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="scanner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="pi pi-camera" style={{ fontSize: '3rem', color: '#1a237e', marginBottom: '1rem' }} />
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Scan Driver License</h3>
          <p style={{ color: '#ccc', textAlign: 'center', maxWidth: 300 }}>
            Choose how you want to capture the PDF417 barcode from your driver license
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* <Button
            label="📷 Take Photo"
            icon="pi pi-camera"
            className="p-button-primary"
            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
            onClick={() => startCamera(0)}
          /> */}
          
          <div style={{ position: 'relative' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              label="📁 Upload Image"
              icon="pi pi-upload"
              className="p-button-secondary"
              style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
              onClick={() => {
                console.log('Upload button clicked');
                fileInputRef.current?.click();
              }}
            />
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            💡 Tip: For best results, use a clear photo with good lighting and focus on the barcode
          </p>
        </div>
        
        <Button
          label="Cancel"
          icon="pi pi-times"
          className="p-button-text"
          style={{ color: 'white' }}
          onClick={() => onCancel?.()}
        />
      </div>
    );
  }

  if (status === 'capturing') {
    return (
      <div className="scanner-container" style={{ position: 'relative', width: '100%', height: '100vh' }}>
        {/* Camera Feed - Full Screen */}
        <video
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
          autoPlay
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />

        {/* Capture Frame Overlay */}
        <div className="scanner-overlay" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)'
        }}>
          {/* Large Capture Frame */}
          <div style={{
            width: '90%',
            maxWidth: '400px',
            height: '200px',
            border: '3px solid #fff',
            borderRadius: '12px',
            position: 'relative',
            marginBottom: '2rem'
          }}>
            {/* Corner markers */}
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: '20px',
              height: '20px',
              borderTop: '4px solid #4caf50',
              borderLeft: '4px solid #4caf50'
            }} />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderTop: '4px solid #4caf50',
              borderRight: '4px solid #4caf50'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              left: '-2px',
              width: '20px',
              height: '20px',
              borderBottom: '4px solid #4caf50',
              borderLeft: '4px solid #4caf50'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderBottom: '4px solid #4caf50',
              borderRight: '4px solid #4caf50'
            }} />
          </div>

          <div style={{ color: 'white', textAlign: 'center', marginBottom: '3rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
              📋 Position PDF417 Barcode in Frame
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Ensure good lighting and focus, then tap capture
            </p>
          </div>
        </div>

        {/* Camera Controls */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-danger p-button-outlined"
            style={{ 
              flex: 0.3,
              background: 'rgba(244,67,54,0.9)', 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.4)',
              padding: '0.75rem'
            }}
            onClick={() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
              }
              if (videoRef.current) {
                videoRef.current.srcObject = null;
              }
              setStatus('ready');
            }}
          />
          
          <Button
            label="📷 CAPTURE"
            icon="pi pi-camera"
            className="p-button-success"
            style={{ 
              flex: 1,
              background: 'rgba(76,175,80,0.9)', 
              color: 'white',
              padding: '1rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: '50px'
            }}
            onClick={capturePhoto}
          />
          
          {cameras.length > 1 && (
            <Button
              icon="pi pi-sync"
              tooltip="Switch Camera"
              className="p-button-outlined"
              style={{ 
                flex: 0.3,
                background: 'rgba(33,150,243,0.9)', 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.4)',
                padding: '0.75rem'
              }}
              onClick={switchCamera}
              aria-label="Switch camera"
            />
          )}
        </div>
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="scanner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured" 
            style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', border: '2px solid #1a237e' }}
          />
        )}
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
        <span style={{ color: 'white' }}>Scanning for barcode...</span>
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="scanner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Scanned" 
            style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', border: '2px solid #4caf50' }}
          />
        )}
        <div className="scanner-success-msg">
          <i className="pi pi-check" />
          Barcode scanned successfully!
        </div>
      </div>
    );
  }
}
