const http = require('http');
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Proxy Test: Body Received Successfully\n');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Test server running on port 3000');
});
