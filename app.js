// In intergrated terminal:
// npm init -y
// npm install express
// npm install ejs
// npm install mysql2
// npm install multer
// npm install express-session
// npm install connect-flash
// To run it:
// npx nodemon app.js
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

const session = require('express-session');
const flash = require('connect-flash');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Republic_C207',
    database: 'c237_petclinic'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// enable form processing
app.use(express.urlencoded({ extended: false }));
// enable static files
app.use(express.static('public'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

// Set up view engine
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success') });
});

//////////////////////////////////////// //IRFAH'S CODE START///////////////////////////////////////////////////////////////////////////////////////////////////
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};

const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/dashboard');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success') });
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});


const validateRegistration = (req, res, next) => {
    const { username, email, password, contact, role } = req.body;

    if (!username || !email || !password || !contact || !role) {
        return res.status(400).send('All fields are required.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};

app.post('/register', validateRegistration, (req, res) => {

    const { username, email, password, contact, role } = req.body;

    const sql = 'INSERT INTO users (username, email, password, contact, role) VALUES (?, ?, SHA1(?), ?, ? )';
    db.query(sql, [username, email, password, contact, role], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});


app.get('/login', (req, res) => {
    res.render('login', {
        messages: req.flash('success'),
        errors: req.flash('error')
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            // Successful login
            req.session.user = results[0]; // store user in session
            req.flash('success', 'Login successful!');
            // Redirect to home page instead of dashboard
            res.redirect('/dashboard');
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

app.get('/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('/admin', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('admin', { user: req.session.user });
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});
///////////////////////////////////////////////IRFAH'S CODE END///////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////// CHARLENE START /////////////////////////////////////////////
app.get('/booking', checkAuthenticated, (req, res) => {
    res.render('booking', { user: req.session.user, messages: req.flash('error') });
});

app.post('/booking', checkAuthenticated, (req, res) => {
    const { pet_name, species, breed, appointment_date } = req.body;
    const username = req.session.user.username;

    if (!pet_name || !species || !breed || !appointment_date) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/booking');
    }

    const sql = `INSERT INTO booking (username, pet_name, species, breed, appointment_date)
                 VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [username, pet_name, species, breed, appointment_date], (err, result) => {
        if (err) {
            console.error('Error inserting booking:', err);
            req.flash('error', 'Failed to book appointment.');
            return res.redirect('/booking');
        }

        req.flash('success', 'Appointment booked successfully!');
        res.redirect('/');
    });
});

app.get('/bookings_user', (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to view your bookings.');
        return res.redirect('/login');
    }

    const username = req.session.user.username;

    const sql = 'SELECT * FROM booking WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user bookings:', err);
            return res.status(500).send('Server error');
        }

        res.render('bookings_user', {
            bookings: results,
            user: req.session.user,
            messages: req.flash('success')
        });
    });
});
///////////////////////////// CHARLENE END ///////////////////////////////////////////////

/////////////////// RAVI START///////////////////////////////////////
app.get('/bookings_user', (req, res) => {
    const searchTerm = req.query.search;
    const statusFilter = req.query.status || 'all';

    const username = req.session.user.username;

    let sql = 'SELECT * FROM booking WHERE username = ?';
    const params = [username];

    // Add filter conditions based on appointment status
    if (statusFilter === 'past') {
        sql += ' AND appointment_date < NOW()';
    } else if (statusFilter === 'upcoming') {
        sql += ' AND appointment_date >= NOW()';
    }

    // Add filter conditions for pet name, species, breed if searchTerm exists
    if (searchTerm) {
        sql += ' AND (pet_name LIKE ? OR species LIKE ? OR breed LIKE ?)';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm, likeTerm);
    }

    sql += ' ORDER BY appointment_date ASC'; // Consistent ordering for display

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching user bookings:', err);
            return res.status(500).send('Server error');
        }

        res.render('bookings_user', {
            bookings: results,
            user: req.session.user,
            messages: req.flash('success'),
            search: searchTerm,
            status: statusFilter
        });
    });
});
///////////////////////RAVI END////////////////////////////////////////////////////

////////////// SHOBIKA START ////////////////////////////////////////
app.get('/delete/:booking_id/:appointment_date/', (req, res) => {
    const booking_id = req.params.id;
    const sql = 'DELETE FROM booking WHERE booking_id = ?';
    db.query(sql, [booking_id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting:", error);
            res.status(500).send('Error deleting');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});
app.post('/delete/:booking_id/:appointment_date', (req, res) => {
    const { booking_id, appointment_date } = req.params;

    // SQL query to delete the booking matching booking_id and appointment_date
    const query = 'DELETE FROM booking WHERE booking_id = ?';

    db.query(query, [booking_id, appointment_date], (err, result) => {
        if (err) {
            console.error('Error deleting booking:', err);
            return res.status(500).send('Error deleting booking.');
        }

        // Redirect user back to their bookings page after deletion
        res.redirect('/bookings_user');
    });
});
///////////////// SHOBIKA END ////////////////////////////////////////////////

/////////// MAHA START ////////////////////////////////////
app.get('/updateAppointment/:id', checkAuthenticated, checkAdmin, (req, res) => {
    const booking_id = req.params.id;
    const sql = 'SELECT * FROM booking WHERE booking_id = ?';

    db.query(sql, [booking_id], (error, results) => {
        if (error) {
            console.error('Error fetching appointment for update:', error);
            return res.status(500).send('Error retrieving appointment for update.');
        }

        if (results.length > 0) {
            res.render('updateAppointment', { booking: results[0], user: req.session.user });
        } else {
            res.status(404).send('Appointment not found');
        }
    });
});

app.post('/updateAppointment/:id', checkAuthenticated, checkAdmin, (req, res) => {
    const booking_id = req.params.id;
    const { username, pet_name, species, breed, appointment_date } = req.body;

    const sql = 'UPDATE booking SET username = ?, pet_name = ?, species = ?, breed = ?, appointment_date = ? WHERE booking_id = ?';

    db.query(sql, [username, pet_name, species, breed, appointment_date, booking_id], (error, results) => {
        if (error) {
            console.error("Error updating Appointment:", error);
            res.status(500).send('Error updating Appointment');
        } else {
            req.flash('success', 'Appointment updated successfully!');
            res.redirect('/admin');
        }
    });
});
/////////////// MAHA END ////////////////////////////

///////////////// Candy START ////////////////////////////////
app.get('/pets', (req, res) => {
    const query = 'SELECT * FROM pets';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pets:', err);
            return res.status(500).send('Database error');
        }
        res.render('list', { pets: results, user: req.session.user });
    });
});
///////////////// Candy END ////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log());
