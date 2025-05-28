import { Link } from 'react-router-dom';
import '../pages/CSS/VerifyMedicine.css'
import icon1 from '../assets/icon1.png'
import icon2 from '../assets/icon2.png'
import icon3 from '../assets/icon3.png'
import icon4 from '../assets/icon4.png'
import icon5 from '../assets/icon5.png'
const VerifyMedicine = () => {
    return ( 
        <div className="verify-container">
            <div className='section'>
                <h1>Verify Medication</h1>
                <h3>Scan QR Code</h3>
                <p>Tap on Camera to scan a QR image or click on Upload to upload an image</p>
                <div className='btn-upload'>
                    <div className='upload-btn'>
                        <Link>Use Camera</Link>
                        <Link>Upload Image</Link>
                    </div>
                </div>
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
        </div>
    );
}

export default VerifyMedicine;