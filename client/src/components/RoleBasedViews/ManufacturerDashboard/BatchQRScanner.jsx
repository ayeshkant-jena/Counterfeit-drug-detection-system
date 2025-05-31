import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';

const BatchQRScanner = () => {
  const [mode, setMode] = useState(null); // 'camera' or 'upload'
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const canvasRef = useRef(null);
  const qrRegionId = "qr-reader";

  useEffect(() => {
    let html5QrCode;

    if (mode === 'camera') {
      html5QrCode = new Html5Qrcode(qrRegionId);

      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;
          html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: 250,
            },
            async (decodedText) => {
              setResult(decodedText);
              await handleSubmit(decodedText);
              html5QrCode.stop();
            },
            (errorMessage) => {
              console.warn("QR Scan error:", errorMessage);
            }
          ).catch(err => {
            console.error("Failed to start scanner:", err);
          });
        }
      });
    }

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        });
      }
    };
  }, [mode]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
          setResult(code.data);
          handleSubmit(code.data);
        } else {
          setStatus("❌ QR code not found.");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (qrData) => {
    try {
      const res = await fetch("http://localhost:5000/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: qrData }) // Assuming QR contains only the batchId string
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ ${data.message} - Hash: ${data.hash}`);
      } else {
        setStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      setStatus("⚠️ Server error.");
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Scan QR Code</h3>
      <button onClick={() => setMode('camera')}>📷 Scan with Camera</button>
      <button onClick={() => setMode('upload')}>📁 Upload QR Image</button>

      {mode === 'camera' && <div id={qrRegionId} style={{ width: "300px" }} />}
      
      {mode === 'upload' && (
        <>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </>
      )}

      {result && <p><b>QR Content:</b> {result}</p>}
      {status && <p><b>Status:</b> {status}</p>}
    </div>
  );
};

export default BatchQRScanner;
