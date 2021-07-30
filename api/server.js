const express = require('express');
const bodyparser = require('body-parser')
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// Constants
const PORT = 9000;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyparser.raw({ limit: '5mb', type: '*/*' }))

// Web function invocation
app.get('/hello', (req, res) => {
  res.send('Hello Serverless Cloud Function , Web Function\n');
});

app.options('/func', (req, res) => {
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end();
});

app.post('/func', (req, res) => {
  const wasmedge = spawn(
    path.join(__dirname, 'wasmedge-tensorflow'),
    ['--dir', '.:'+__dirname, path.join(__dirname, 'classify_yml.so'), './models/mobilenet_v2/task.yml'],
    {env: {'LD_LIBRARY_PATH': __dirname}}
  );

  let d = [];
  wasmedge.stdout.on('data', (data) => {
    d.push(data);
  });

  wasmedge.on('close', (code) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.send(d.join(''));
  });

  wasmedge.stdin.write(req.body);
  wasmedge.stdin.end('');
});


var server = app.listen(PORT, HOST);
console.log(`SCF Running on http://${HOST}:${PORT}`);

server.timeout = 0; // never timeout
server.keepAliveTimeout = 0; // keepalive, never timeout
