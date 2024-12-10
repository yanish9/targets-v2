const { spawn } = require('child_process');


runPythonScript()

function runPythonScript() {
  const pythonScriptPath = '/home/yan/sx126x_lorawan_hat_code/python/lora/examples/SX126x/transmitter.py';

  // Spawn the Python process with sudo
  const pythonProcess = spawn('sudo', ['python', pythonScriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python script finished with code ${code}`);
  });
}
