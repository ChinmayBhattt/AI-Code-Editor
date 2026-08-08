const express = require('express');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Middleware
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // or 'STARTTLS'
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password'
  }
});

// Route to send email
app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;
  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(500).send({ message: 'Error sending email' });
    } else {
      res.send({ message: 'Email sent successfully' });
    }
  });
});

// Cron job to send daily summary
cron.schedule('0 * * * *', () => {
  const text = 'This is a daily summary';
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'user@example.com',
    subject: 'Daily Summary',
    text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent successfully');
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});