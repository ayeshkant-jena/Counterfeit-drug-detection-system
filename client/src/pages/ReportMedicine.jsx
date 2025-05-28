import './CSS/ReportMedicine.css'
const ReportMedicine = () => {
    return (  
        <div className="report-container">
            <h1>Report a Suspected Counterfeit or Substandard Medicine</h1>
            <p>Please fill out the form to report a suspected counterfeit or substandard medicine</p>
            <h2>Upload Images</h2>
            <label className="upload-box">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden-input"
                />
                <div className="upload-content">
                    <h3>Click anywhere to upload multiple images</h3>
                    <p>Please make sure the images of medicine product includes the barcode or QR code too</p>
                    <button type="button">Browse</button>
                </div>
            </label>
            <div className='report-grid'>
                <div className='reports'>
                    <h2>Product Information</h2>
                    <input type="text" placeholder='Manufacturer Name'/>
                    <input type="text" placeholder='Medicine/Brand Name'/>
                    <input type="text" placeholder='Product Name'/>
                    <input type="text" placeholder='Expiration Date'/>
                    <input type="text" placeholder='Batch Number'/>
                </div>
                <div className='reports'>
                    <h2>Describe the issue</h2>
                    <textarea name="" id=""></textarea>
                </div>
            </div>
            <div className='submit-btns'>
                <button className='cancel-report'>Cancel</button>
                <button className='submit-report'>Submit Report</button>
            </div>
        </div>
    );
}

export default ReportMedicine;