const crypto = require('crypto');
const ioClient = require('socket.io-client');

// Constants for generating random messages
const names = ['Alice', 'Bob', 'Charlie'];
const origins = ['CityA', 'CityB', 'CityC'];
const destinations = ['CityX', 'CityY', 'CityZ'];

// Emitter configuration
const emitterConfig = {
  serverUrl: 'http://localhost:3001', // Change this to the listener server URL
  interval: 10000, // 10 seconds
};

// Generate a random element from an array
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function to create a message
function createMessage() {
  const name = getRandomElement(names);
  const origin = getRandomElement(origins);
  const destination = getRandomElement(destinations);

  const originalMessage = { name, origin, destination };
  const secret_key = crypto.createHash('sha256').update(JSON.stringify(originalMessage)).digest('hex');

  const encryptedMessage = encryptPayload(JSON.stringify({ ...originalMessage, secret_key }));
  return encryptedMessage;
}

// Function to encrypt payload
function encryptPayload(payload) {
  const passKey = 'asdfghjkl'; // Replace with your encryption key(your_secret_key_here)
  const cipher = crypto.createCipher('aes-256-ctr', passKey);
  let encryptedMessage = cipher.update(payload, 'utf8', 'hex');
  encryptedMessage += cipher.final('hex');
  return encryptedMessage;
}

// Emitter main function
function startEmitter() {
  const socket = ioClient.connect(emitterConfig.serverUrl);

  socket.on('connect', () => {
    console.log('Emitter connected to server');
    setInterval(() => {
      const message = createMessage();
      socket.emit('encryptedMessage', message);
      console.log('Sent encrypted message:', message);
    }, emitterConfig.interval);
  });

  socket.on('disconnect', () => {
    console.log('Emitter disconnected from server');
  });
}

// Start the emitter
startEmitter();
