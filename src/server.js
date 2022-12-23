const http = require('http');
const { connectDB, disconnectDB } = require('./models/db');
const router = require('./routes');

const PORT = process.env.PORT || 3000;
const server = http.createServer(router.handleRequests);

connectDB();

server.on('error', (err) => {
  console.error(err);
  server.close();
});

server.on('close', () => {
  disconnectDB();
  console.log('Server closed.');
});

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
