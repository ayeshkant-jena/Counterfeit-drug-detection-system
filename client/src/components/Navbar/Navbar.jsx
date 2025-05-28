import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Navbar.css"

const Navbar = () => {
    const navigate = useNavigate();

    // Check if the user is logged in
    const isLoggedIn = localStorage.getItem('token') !== null;

    const handleLogout = () => {
        // Clear the token from localStorage
        localStorage.removeItem('token');
        alert('Logged out successfully!');
        navigate('/'); // Redirect to login page
    };

    return (<div className='navbar'>
            <nav className='nav'>
                <Link to="/" style={{ textDecoration: 'none', color: 'rgb(0, 0, 0)', fontSize: '30px', fontWeight: '700' }}>
                    SafeRx
                </Link>
                <div>
                    {isLoggedIn ? (
                        <button onClick={handleLogout()} className='loginbtn'>
                            Logout
                        </button>
                    ) : (
                        <button onClick={() => navigate('/login')} className='loginbtn'>
                            Login
                        </button>
                    )}
                </div>
            </nav>
            <span className='line'></span>
        </div>
    );
};

export default Navbar;
