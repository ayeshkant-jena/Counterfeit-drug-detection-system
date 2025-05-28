import './CSS/MedicineSupplyDetail.css'
import icon1 from '../assets/icon1.png'
import icon2 from '../assets/icon2.png'
import icon3 from '../assets/icon3.png'
import icon4 from '../assets/icon4.png'
import icon5 from '../assets/icon5.png'
import icon6 from '../assets/icon6.png'
import icon7 from '../assets/icon7.png'
import cargo from '../assets/cargo.png'
import factory from '../assets/factory.png'
import human from '../assets/human.png'
import pharmacy from '../assets/pharmacy.png'
import warehouse from '../assets/warehouse.png'
const MedicineSupplyDetail = () => {
    return (  
        <div className="medicine-container">
            <h1>Medicine Details</h1>
            <div className='medicine-detail-container'>
                <div className='medicine-detail-container-grid'>
                    <div className='medicine-detail-container-grids'>
                        <div className='div1'>
                            <img src={icon6} alt="" />
                        </div>
                        <div className='div2'>
                            <h3>Manufacturer Name</h3>
                            <p>Pfizer Inc. - USA</p>
                        </div>
                    </div>
                    <div className='medicine-detail-container-grids'>
                        <div className='div1'>
                            <img src={icon7} alt="" />
                        </div>
                        <div className='div2'>
                            <h3>Medicine Name</h3>
                            <p>Paracetamol 650</p>
                        </div>
                    </div>
                    <div className='medicine-detail-container-grids'>
                        <div className='div1'>
                            <img src={icon4} alt="" />
                        </div>
                        <div className='div2'>
                            <h3>Batch Number</h3>
                            <p>F25V4265DF</p>
                        </div>
                    </div>
                    <div className='medicine-detail-container-grids'>
                        <div className='div1'>
                            <img src={icon3} alt="" />
                        </div>
                        <div className="div2">
                            <h3>Expiration Date</h3>
                            <p>21/05/2026</p>
                        </div>
                    </div>
                </div>
            </div>
            <span style={{width:'100%', height:'50px'}}></span>
            <h2>Supply Chain History</h2>
            <div className='supply-chain'>
                <div className='supply-chain-grid'>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={factory} alt="" />
                            <h3>Manufactured</h3>
                        </div>
                        <div className='scg2'>
                            May 21, 2025
                        </div>
                    </div>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={cargo} alt="" />
                            <h3>Shipped to Distributor</h3>
                        </div>
                        <div className='scg2'>
                            May 22, 2025
                        </div>
                    </div>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={warehouse} alt="" />
                            <h3>Received by Distributor</h3>
                        </div>
                        <div className='scg2'>
                            May 25, 2025
                        </div>
                    </div>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={cargo} alt="" />
                            <h3>Shipped to Pharmacist</h3>
                        </div>
                        <div className='scg2'>
                            May 27, 2025
                        </div>
                    </div>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={pharmacy} alt="" />
                            <h3>Received by Pharmacist</h3>
                        </div>
                        <div className='scg2'>
                            May 27, 2025
                        </div>
                    </div>
                    <div className='supply-chain-grids'>
                        <div className='scg1'>
                            <img src={human} alt="" />
                            <h3>Picked up by Patient</h3>
                        </div>
                        <div className='scg2'>
                            May 28, 2025
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MedicineSupplyDetail;