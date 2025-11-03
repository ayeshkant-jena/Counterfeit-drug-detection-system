import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import '../pages/CSS/VerifyMedicine.css'
import icon1 from '../assets/icon1.png'
import icon2 from '../assets/icon2.png'
import icon3 from '../assets/icon3.png'
import icon4 from '../assets/icon4.png'
import icon5 from '../assets/icon5.png'
import MedicineSupplyDetail from './MedicineSupplyDetail';

const VerifyMedicine = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [cameraOn, setCameraOn] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            stopCamera();
        }
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraOn(true);
        } catch (err) {
            console.error('Camera error', err);
            alert('Cannot access camera. Check permissions.');
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            try { videoRef.current.pause(); videoRef.current.srcObject = null; } catch {}
        }
        setCameraOn(false);
    }

    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
        // process QR from captured image
        processImageFromDataUrl(dataUrl);
        // stop camera after capture if you want:
        stopCamera();
    }

    const openFileDialog = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImageSrc(reader.result);
        reader.onloadend = () => {
            setImageSrc(reader.result);
            processImageFromDataUrl(reader.result);
        };
        reader.readAsDataURL(file);
        // clear input so same file can be re-selected later
        e.target.value = null;
    }

    const processImageFromDataUrl = async (dataUrl) => {
        try {
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (!code) {
                alert('QR code not found in image');
                return;
            }

            // Try parse QR payload
            let parsed = null;
            try {
                parsed = JSON.parse(code.data);
            } catch (err) {
                // If QR contains just batchId string, normalize it
                parsed = { batchId: code.data };
            }

            // send to server scan endpoint
            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('token');
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('http://localhost:5000/api/scan-qr', {
                method: 'POST',
                headers,
                body: JSON.stringify({ qr: parsed })
            });

            const result = await res.json();
            if (res.ok) {
                setVerifyResult(result);
            } else {
                setVerifyResult({ error: result.message || 'Not found' });
            }

        } catch (err) {
            console.error('Error processing image for QR:', err);
            alert('Error processing QR image');
        }
    }

    const clearImage = () => setImageSrc(null);

    return ( 
        <div className="verify-container">
            <div className='section'>
                <h1>Verify Medication</h1>
                <h3>Scan QR Code</h3>
                <p>Tap on Camera to scan a QR image or click on Upload to upload an image</p>
                <div className='btn-upload'>
                    <div className='upload-btn'>
                        <button type="button" onClick={startCamera}>Use Camera</button>
                        <button type="button" onClick={openFileDialog}>Upload Image</button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {cameraOn && (
                    <div className="camera-area">
                        <video ref={videoRef} style={{ width: '100%', maxHeight: 360 }} playsInline />
                        <div style={{ marginTop: 8 }}>
                            <button type="button" onClick={captureImage}>Capture</button>
                            <button type="button" onClick={stopCamera} style={{ marginLeft: 8 }}>Close Camera</button>
                        </div>
                    </div>
                )}

                {imageSrc && (
                    <div className="preview-area" style={{ marginTop: 12 }}>
                        <h4>Preview</h4>
                        <img src={imageSrc} alt="preview" style={{ maxWidth: '100%', maxHeight: 300 }} />
                        <div style={{ marginTop: 8 }}>
                            <button type="button" onClick={clearImage}>Remove</button>
                        </div>
                    </div>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <h3>Enter Serial/Batch Number</h3>
                <input className='srno-input' type="text" placeholder='Enter Serial Number Here'/>
                <div className='verify-btn'>
                    <button>Verify</button>
                    {/* <button className='verify-btn' onClick={handleSubmit}>Submit</button> */}
                </div>
            </div>
            <div className='result'>
                <h1>Result</h1>
                {!verifyResult && (
                    <p>No verification performed yet.</p>
                )}
                {verifyResult && verifyResult.error && (
                    <div className='result-grid'>
                        <div className='results'>
                            <h4>Error</h4>
                            <p>{verifyResult.error}</p>
                        </div>
                    </div>
                )}
                {verifyResult && !verifyResult.error && (
                    <div className='result-grid'>
                        <div className='results'>
                            <img src={icon1} alt="" />
                            <div className='results-text'>
                                <h4>{verifyResult.batch?.medicineName || 'Unknown'}</h4>
                                <p>Medicine</p>
                            </div>
                        </div>
                        <div className='results'>
                            <img src={icon4} alt="" />
                            <div className='results-text'>
                                <h4>Batch ID</h4>
                                <p>{verifyResult.batch?.batchId || 'N/A'}</p>
                            </div>
                        </div>
                        <div className='results'>
                            <img src={icon5} alt="" />
                            <div className='results-text'>
                                <h4>Status</h4>
                                <p>{verifyResult.authentic ? 'Authentic' : 'Suspected Fake'}</p>
                            </div>
                        </div>
                        <div className='results'>
                            <img src={icon3} alt="" />
                            <div className='results-text'>
                                <h4>Expiry</h4>
                                <p>{verifyResult.batch?.expiryDate ? new Date(verifyResult.batch.expiryDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <MedicineSupplyDetail/>
        </div>
    );
}

export default VerifyMedicine;