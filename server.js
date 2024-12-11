const express = require("express");
const path = require("path");
const { exec } = require('child_process'); 
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const db = new sqlite3.Database('./targets.db');

db.run(`CREATE TABLE IF NOT EXISTS targets (
  id TEXT PRIMARY KEY,
  color TEXT,
  left TEXT,
  top TEXT
)`);


const PORT = 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Fallback route for other requests
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "text.html"));
});

app.post('/save_color', (req, res) => {
  const { r, g, b } = req.body;

  // Path to the Python script
  const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter.py');

  // Run the Python script with RGB values as arguments
  exec(`sudo python3 ${scriptPath} ${r} ${g} ${b}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send('Error executing Python script');
    }

    // Send success response with script output
    console.log(`Script Output: ${stdout}`);
    res.status(200).json({
      status: 'success',
      message: `Color RGB(${r}, ${g}, ${b}) saved successfully`,
    });
  });
});

// Load data
app.get('/load_all', (req, res) => {
  db.all(`SELECT * FROM targets`, [], (err, rows) => {
      if (err) {
          console.error(err.message);
          return res.status(500).send('Error retrieving data');
      }
      res.json(rows);
  });
});


app.post('/save_all', (req, res) => {
  const items = req.body;

  items.forEach(item => {
      db.run(
          `INSERT INTO targets (id, color, left, top) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET color = ?, left = ?, top = ?`,
          [item.id, item.color, item.left, item.top, item.color, item.left, item.top]
      );


      
  const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter_set_color.py');

  var l = item.color;
  l = l.substring(l.indexOf("(")+1, l.lastIndexOf(")"))
  // Run the Python script with RGB values as arguments
  exec(`sudo python3 ${scriptPath} ${l}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`);
     // return res.status(500).send('Error executing Python script');
    }

    // Send success response with script output
    console.log(`Script Output: ${stdout}`);
    // res.status(200).json({
    //   status: 'success',
    //   message: `Color RGB(${item.color}) saved successfully`,
    // });
  });

  


  });



  res.status(200).send('Data saved successfully');
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
