const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

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

// Function to extract email addresses from a webpage
async function extractEmails(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const emails = [];
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('@')) {
        emails.push(href);
      }
    });
    return emails;
  } catch (error) {
    console.log('Error extracting emails:', error);
    return [];
  }
}

// Function to send email with extracted email addresses
async function sendEmail(emails) {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'user@example.com',
    subject: 'Extracted Email Addresses',
    text: emails.join(', ')
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent successfully');
    }
  });
}

// Cron job to extract and send email addresses daily
cron.schedule('0 * * * *', async () => {
  const url = 'https://example.com'; // Replace with the URL to extract emails from
  const emails = await extractEmails(url);
  await sendEmail(emails);
});

// Start the automation
console.log('AI Email Finder Automation started');