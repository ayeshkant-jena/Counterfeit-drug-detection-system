import { Link } from 'react-router-dom';
import './CSS/LandingPage.css'
import image from '../assets/img1.png'
import feat1 from '../assets/img2.png'
import feat2 from '../assets/img3.png'
import feat3 from '../assets/img4.png'
const LandingPage = () => {
    return (
        <div className='landing-container'>
            <div className="hero-section">
                <img src={image} alt="" />
                <div className='text-over-img'>
                    <h1 className='hero-text'>Is your medicine real?</h1>
                    <p className='hero-text'>Counterfeit medicines are a growing problem. SafeRx uses AI to help you verify the authenticity of your medications.</p>
                    {/* <button className='btn-scan-now'>Scan Now</button> */}
                    <Link to='/verifymedicine' className='btn-scan-now'>Scan Now</Link>
                </div>
            </div>
            <h1>Why use SafeRx?</h1>
            <p>Counterfeit medicines can be dangerous and ineffective. By scanning the barcode with SafeRx,
            you can quickly verify the authenticity of your medication and avoid potential risks.</p>
            <button className='btn-hiw'>How it works</button>
            <div className='features-grid'>
                <div className='features'>
                    <img src={feat1} alt="" />
                    <h4>Verify medication</h4>
                    <p>Scan the QR/barcode to verify the authenticity of your medication.</p>
                </div>
                <div className='features'>
                    <img src={feat2} alt="" />
                    <h4>Check expiration</h4>
                    <p>Check theexpiration date of yout medication.</p>
                </div>
                <div className='features'>
                    <img src={feat3} alt="" />
                    <h4>Get drug information</h4>
                    <p>Find detailed drug information and usage instructions.</p>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;