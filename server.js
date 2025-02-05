const express = require("express");
const path = require("path");
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

const app = express();
const nid = "T_1000";

const WEBSOCKET_URL = 'ws://10.240.242.96:8765';
let ws;
let animInProgress = false;

let targetList = {}


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

db.all(`SELECT * FROM targets`, [], (err, rows) => {
  if (err) {
    console.error(err.message);
    return res.status(500).send('Error retrieving data');
  }
  console.log(rows)
});

// Fallback route for other requests
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "text.html"));
});


app.post('/save_target_color', (req, res) => {
  const item = req.body;

  console.log("__________________")
  console.log(item)
  console.log(item.id)
  console.log(item.color)


  console.log("__________________")

  db.run(
    `INSERT INTO targets (id, color) VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET color = ?`,
    [item.id, item.color, item.color]
  );


  item.nid = nid;

  var jsonString = JSON.stringify(item);

  jsonString = "'" + jsonString + "'";
  console.log(jsonString);

  const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter_set_color.py');

  // var l = item.color;
  // l = l.substring(l.indexOf("(")+1, l.lastIndexOf(")"))
  // Run the Python script with RGB values as arguments
  exec(`sudo python3 ${scriptPath} ${jsonString}`, (err, stdout, stderr) => {
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

  res.status(200).send('Data saved successfully');
});

// app.post('/save_color', (req, res) => {
//   const { r, g, b } = req.body;

//   // Path to the Python script
//   const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter.py');

//   // Run the Python script with RGB values as arguments
//   exec(`sudo python3 ${scriptPath} ${r} ${g} ${b}`, (err, stdout, stderr) => {
//     if (err) {
//       console.error(`Error: ${stderr}`);
//       return res.status(500).send('Error executing Python script');
//     }

//     // Send success response with script output
//     console.log(`Script Output: ${stdout}`);
//     res.status(200).json({
//       status: 'success',
//       message: `Color RGB(${r}, ${g}, ${b}) saved successfully`,
//     });
//   });
// });

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


app.post('/save_target_pos', (req, res) => {
  const items = req.body;

  items.forEach(item => {
    db.run(
      `INSERT INTO targets (id, color, left, top) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET color = ?, left = ?, top = ?`,
      [item.id, item.color, item.left, item.top, item.color, item.left, item.top]
    );


  });

  var jsonString = JSON.stringify(items);

  jsonString = "'" + jsonString + "'";
  console.log(jsonString);

  const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter_set_color.py');

  // var l = item.color;
  // l = l.substring(l.indexOf("(")+1, l.lastIndexOf(")"))
  // Run the Python script with RGB values as arguments
  exec(`sudo python3 ${scriptPath} ${jsonString}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`);
      animInProgress = false;
      // return res.status(500).send('Error executing Python script');
    }

    // Send success response with script output
    console.log(`Script Output: ${stdout}`);
    // res.status(200).json({
    //   status: 'success',
    //   message: `Color RGB(${item.color}) saved successfully`,
    // });
  });





  res.status(200).send('Data saved successfully');
});


app.post('/anim-test', (req, res) => {
  const items = req.body;

  items.nid = nid;
  var jsonString = JSON.stringify(items);

  jsonString = "'" + jsonString + "'";
  console.log(jsonString);

  animateTarget(jsonString, res);

  res.status(200).send('Ok');
});


function animateTarget(jsonString) {

  let animInProgress = true;

  const scriptPath = path.join('/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/', 'transmitter_set_color.py');

  // var l = item.color;
  // l = l.substring(l.indexOf("(")+1, l.lastIndexOf(")"))
  // Run the Python script with RGB values as arguments
  exec(`sudo python3 ${scriptPath} ${jsonString}`, (err, stdout, stderr) => {
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

}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



function connectWebSocket() {
  console.log(`Connecting to WebSocket server at ${WEBSOCKET_URL}...`);

  ws = new WebSocket(WEBSOCKET_URL);

  // Handle WebSocket open event
  ws.on('open', () => {
    console.log('Connected to WebSocket server');
//    ws.send('Hello from iTarget!');
  });

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received message from WebSocket server: ${message}`);
    // var targetHit = JSON.stringify(message);

    // var data = { id: targetHit.target, nid: nid, anim: 1 }
    // targetList.add(data);

    // if (!animInProgress) {

    //   animateTarget(data);

    //   targetList.remove(data);


    // }

//message.toString()    var targetH = message.toString();
//  var targetH_ = JSON.stringify(message.toString())
   var   target_ ; 
   var targetHit ;
 var total_leds=50;
    message  = message.toString();
 
  // targetHit = JSON.stringify(target_) // Try to parse the string

    const startIndex = message.indexOf('"distance"') + 11; // Position after "distance":
    const endIndex = message.indexOf(",", startIndex); // Find the next comma
    const value = message.substring(startIndex, endIndex !== -1 ? endIndex : message.length-1).trim();
    console.log("Distance:", value);


//   var tempName = String(targetHit.target);
//	targetHit.target = "T" + tempName.substring(7,8)
	console.log( value );
 // console.log( targetHit.bay );
   //     console.log( targetHit );;
   if (value < 15) {
  
var led_per = 100 - matchPercentage(15, value)
var num_leds = (led_per * (total_leds/100));
    console.log("close to target")
     var data = { id: "T1" , anim:"1",  nid: nid, leds:num_leds }

  var jsonString = JSON.stringify(data);

  jsonString = "'" + jsonString + "'";
	console.log(data)      
	animateTarget(jsonString);

    }


  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`);
  });

  // Handle connection close and attempt to reconnect
  ws.on('close', () => {
    console.log('Disconnected from WebSocket server. Reconnecting in 5 seconds...');
    setTimeout(connectWebSocket, 5000); // Retry after 5 seconds
  });
}

function matchPercentage(referenceNumber, randomNumber) {
    // Calculate the percentage and round up to the next integer
    const percentage = Math.ceil((randomNumber / referenceNumber) * 100);
    return percentage;
}
// Start the WebSocket connection
connectWebSocket();
