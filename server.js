const express = require("express");
const path = require("path");
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const amqp = require('amqplib');

const app = express();
const nid = "T_1000";

const WEBSOCKET_URL = 'ws://192.168.1.70:8080';
let ws;
let animInProgress = false;

const QUEUE = 'queue_itarget';
const EXCHANGE = 'awg.real_time_events';
const ROUTING_KEY = 'event.action_region_hit';

let targetInfo = [
  {
    "id": "1",
    "radius": 4
  },
  {
    "id": "2",
    "radius": 4
  },
  {
    "id": "3",
    "radius": 4
  },
  {
    "id": "4",
    "radius": 4
  },
  {
    "id": "5",
    "radius": 4
  },
  {
    "id": "6",
    "radius": 4.5
  },
  {
    "id": "7",
    "radius": 4.5
  },
  {
    "id": "8",
    "radius": 4.5
  },
  {
    "id": "9",
    "radius": 5.2
  },
  {
    "id": "10",
    "radius": 5.2
  },
  {
    "id": "11",
    "radius": 5.2
  },
  {
    "id": "12",
    "radius": 5
  },
  {
    "id": "13",
    "radius": 5.2
  }
]

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


async function connectRabbitMQ() {
  // RabbitMQ connection string
  var rabbit_link = 'amqps://iTarget:lights.@192.16.1.1:5673';

  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: '192.16.1.1',
      port: 5673,
      username: 'iTarget',
      password: 'lights.',
      vhost: '/',
      servername: false,
    }
    );
    const channel = await connection.createChannel();

    // Declare the exchange as a topic
    await channel.assertExchange(EXCHANGE, 'topic', { durable: false });

    // Create a queue that will receive messages
    const { queue } = await channel.assertQueue(QUEUE, { durable: false });


    // Bind the queue to the exchange with a routing key
    await channel.bindQueue(queue, EXCHANGE, ROUTING_KEY);

    // Consume messages from the queue
    console.log(`Waiting for messages in ${queue}.`);

    channel.consume(
      queue,
      (msg) => {
        if (msg) {
          // Convert message to string
          const message = msg.content.toString();
          console.log(`Received: ${message}`);

          // Process the received message
          processMessage(message);
        }
      },
      { noAck: true }
    );
  } catch (error) {

    console.error('Error:', error);

    setTimeout(connectRabbitMQ, 2000);
  }
}

function processMessage(message) {
  let js_message;
  try {
    // Parse incoming message as JSON
    js_message = JSON.parse(message);
  } catch (error) {
    console.error('Invalid JSON format:', error);
    return;
  }

  var tid_ = js_message.ActionRegion.Number
  const distance = parseFloat(js_message.DistanceToTarget);

  if (isNaN(distance)) {
    console.error('Invalid distance value:', value);
    return;
  }
  console.log('Distance:', distance);

  const searchId = tid_.toString();
  const result = targetInfo.find(target => target.id === searchId);

  let targetSize = 4;
  if (result) {
    console.log(`Distance for ID ${searchId}: ${result.radius}`);
    targetSize = result.radius;
  } else {
    console.log(`ID ${searchId} not found`);
  }


  let percent = matchPercentage(distance, targetSize);

  if (percent < 33) {
    percent = 33;
  }

  if (percent > 80) {
    percent = 100;
  }


  // Check if distance is close to the target

  var data = {
    id: tid_.toString(),
    anim: '1',
    percent: percent,
    nid: nid
  };

  console.log(data);

  // Send data for animation
  var jsonString = JSON.stringify(data);

  jsonString = "'" + jsonString + "'";

  animateTarget(jsonString);
}



// Run RabbitMQ connection
connectRabbitMQ();


// function connectWebSocket() {
//   console.log(`Connecting to WebSocket server at ${WEBSOCKET_URL}...`);

//   ws = new WebSocket(WEBSOCKET_URL);

//   // Handle WebSocket open event
//   ws.on('open', () => {
//     console.log('Connected to WebSocket server');
// //    ws.send('Hello from iTarget!');
//   });

//   // Handle incoming messages
//   ws.on('message', (message) => {
//     console.log(`Received message from WebSocket server: ${message}`);
//     // var targetHit = JSON.stringify(message);

//     // var data = { id: targetHit.target, nid: nid, anim: 1 }
//     // targetList.add(data);

//     // if (!animInProgress) {

//     //   animateTarget(data);

//     //   targetList.remove(data);


//     // }

// //message.toString()    var targetH = message.toString();
// //  var targetH_ = JSON.stringify(message.toString())
//    var   target_ ; 
//    var targetHit ;
//  var total_leds=50;
//     message  = message.toString();

//   // targetHit = JSON.stringify(target_) // Try to parse the string

//     const startIndex = message.indexOf('"distance"') + 11; // Position after "distance":
//     const endIndex = message.indexOf(",", startIndex); // Find the next comma
//     const value = message.substring(startIndex, endIndex !== -1 ? endIndex : message.length-1).trim();
//     console.log("Distance:", value);

// let js_message = JSON.parse(message);
// //   var tempName = String(targetHit.target);
// // targetHit.target = "T" + tempName.substring(7,8)
//  console.log( value );
//  // console.log( targetHit.bay );
//    //     console.log( targetHit );;
//    if (value < 15) {

// var led_per = 100 - matchPercentage(15, value)
// var num_leds = (led_per * (total_leds/100));
//     console.log("close to target")
//      var data = { id: "T1" , anim:"1", percent: js_message.percent,  nid: nid, leds:num_leds, color: js_message.color }

//   var jsonString = JSON.stringify(data);

//   jsonString = "'" + jsonString + "'";
//  console.log(data)      
//  animateTarget(jsonString);

//     }


//   });

//   // Handle errors
//   ws.on('error', (error) => {
//     console.error(`WebSocket error: ${error.message}`);
//   });

//   // Handle connection close and attempt to reconnect
//   ws.on('close', () => {
//     console.log('Disconnected from WebSocket server. Reconnecting in 5 seconds...');
//     setTimeout(connectWebSocket, 5000); // Retry after 5 seconds
//   });
// }

// function animateTarget(jsonString) {
//   console.log(`Animating target with data: ${jsonString}`);
// }

function matchPercentage(num, referenceNumber) {
  // Calculate the percentage and round up to the next integer
  const percentage = 100 - (Math.ceil((num / referenceNumber) * 100));
  return percentage;
}


// // Start the WebSocket connection
// connectWebSocket();
