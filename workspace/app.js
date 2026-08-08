// Initialize the application
console.log('Application started');

// Import the sendEmail function from the emailService file
const sendEmail = require('./emailService');

// Define a function to handle requests
function handleRequest(req, res) {
    // Send a response
    res.send('Hello, World!');

    // Send an automated email
    sendEmail('recipient-email@example.com', 'Test Email', 'This is a test email sent from the application.');
}

// Export the function to be used elsewhere
module.exports = handleRequest;