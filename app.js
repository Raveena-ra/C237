// In intergrated terminal:
// npm init -y
// npm install express
// npm install ejs
// npm install mysql2
// npm install multer
// To run it:
// npx nodemon app.js
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const express = require('express');
const db = require('./db'); // Assuming your db connection is in db.js



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

const connection = mysql.createConnection({
    host: 'c237-all.mysql.database.azure.com',
    user: 'c237admin',
    password: 'c2372025!',
    database: 'c237_016_24045392'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// enable form processing
app.use(express.urlencoded({
    extended: false
}));
// enable static files
app.use(express.static('public'));


// Delete a user by ID
app.get('/delete/:id', (req, res) => {
  const userId = req.params.id;

  const query = 'DELETE FROM users WHERE id = ?';

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send('Error deleting user.');
    }

    // Redirect or confirm deletion
    res.redirect('/'); // or res.send('User deleted.');
  });
});
