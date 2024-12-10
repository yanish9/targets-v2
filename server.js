const express = require("express");
const path = require("path");
const { exec } = require('child_process');
const app = express();
app.use(express.json());

const PORT = 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Fallback route for other requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
