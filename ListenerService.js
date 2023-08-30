const crypto = require('crypto');
const socketIO = require('socket.io');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

// MongoDB setup-----
mongoose.connect('mongodb://localhost:27017/timeseriesdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const TimeseriesModel = mongoose.model('Timeseries', new mongoose.Schema({}, { strict: false }));

// Express app setup------------------
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware to decrypt and validate the incoming message--------------------------
io.use((socket, next) => {
  const passKey = 'asdfghjkl'; // Replace with your decryption key
  const decipher = crypto.createDecipher('aes-256-ctr', passKey);

  socket.on('encryptedMessage', (encryptedMessage) => {
    const decryptedMessage = decipher.update(encryptedMessage, 'hex', 'utf8') + decipher.final('utf8');
    try {
      const parsedMessage = JSON.parse(decryptedMessage);
      const { name, origin, destination, secret_key } = parsedMessage;

      const calculatedSecretKey = crypto.createHash('sha256').update(JSON.stringify({ name, origin, destination })).digest('hex');
      if (secret_key === calculatedSecretKey) {
        parsedMessage.timestamp = new Date();
        const minute = parsedMessage.timestamp.setSeconds(0, 0);
        parsedMessage.minute = new Date(minute);

        const timeseriesData = new TimeseriesModel(parsedMessage);
        timeseriesData.save();
        console.log('Saved data:', parsedMessage);
      } else {
        console.log('Data integrity compromised. Discarding data:', parsedMessage);
      }
    } catch (error) {
      console.error('Error parsing decrypted message:', error.message);
    }
  });

  next();
});

// Start the server--------------------
const PORT = 3001; // Change this to your desired port
server.listen(PORT, () => {
  console.log(`Listener server is running on port ${PORT}`);
});
