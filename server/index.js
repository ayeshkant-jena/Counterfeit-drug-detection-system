// // index.js
// const express = require('express');
// const passport = require('passport');
// const session = require('cookie-session');
// const cors = require('cors');
// require('dotenv').config();
// require('./config/passport');

// const app = express();

// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true
// }));

// app.use(
//   session({
//     secret: 'your_super_secret_key', // Change this in production
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: false, // set true in production with HTTPS
//       maxAge: 1000 * 60 * 60 * 24, // 1 day
//     },
//   })
// );

// app.use(session({
//   name: 'session',
//   keys: [process.env.SESSION_SECRET],
//   maxAge: 24 * 60 * 60 * 1000
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// // ----------- ROUTES ------------

// // Auth: Login
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// // Auth: Callback
// app.get('/auth/google/callback',
//   passport.authenticate('google', {
//     failureRedirect: '/login',
//     successRedirect: `${process.env.FRONTEND_URL}/dashboard`,
//   })
// );

// // Logout
// app.get('/logout', (req, res) => {
//   req.logout(() => {
//     res.redirect(process.env.FRONTEND_URL);
//   });
// });

// // Get current user
// app.get('/user', (req, res) => {
//   res.send(req.user);
// });

// app.listen(5000, () => {
//   console.log('Backend running on http://localhost:5000');
// });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/medchain');

app.use('/api/auth', require('./routes/auth'));

app.listen(5000, () => console.log('Server running on port 5000'));
