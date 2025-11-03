import { useEffect, useRef, useState } from 'react';
import '../pages/CSS/VerifyMedicine.css'
import icon1 from '../assets/icon1.png'
import icon2 from '../assets/icon2.png'
import icon3 from '../assets/icon3.png'
import icon4 from '../assets/icon4.png'
import icon5 from '../assets/icon5.png'
import MedicineSupplyDetail from './MedicineSupplyDetail';

const VerifyMedicine = () => {
    const [imageSrc, setImageSrc] = useState(null);
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
        reader.readAsDataURL(file);
        // clear input so same file can be re-selected later
        e.target.value = null;
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
                <div className='result-grid'>
                    <div className='results'>
                        <img src={icon1} alt="" />
                        <div className='results-text'>
                            <h4>Azithromycin 250</h4>
                            <p>Tablet</p>
                        </div>
                    </div>
                    <div className='results'>
                        <img src={icon4} alt="" />
                        <div className='results-text'>
                            <h4>Batch/Serial Number</h4>
                            <p>B24H5432AJ</p>
                        </div>
                    </div>
                    <div className='results'>
                        <img src={icon5} alt="" />
                        <div className='results-text'>
                            <h4>Status</h4>
                            <p>Authentic</p>
                        </div>
                    </div>
                    <div className='results'>
                        <img src={icon3} alt="" />
                        <div className='results-text'>
                            <h4>Expiration</h4>
                            <p>23/11/2026</p>
                        </div>
                    </div>
                </div>
            </div>
            <MedicineSupplyDetail/>
        </div>
    );
}

export default VerifyMedicine;