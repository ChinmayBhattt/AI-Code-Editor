// Initialize the application
console.log('Application started');

// Define a function to handle requests
function handleRequest(req, res) {
    // Send a response
    res.send('Hello, World!');
}

// Export the function to be used elsewhere
module.exports = handleRequest;