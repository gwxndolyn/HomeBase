const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, html'
    });
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `HomeBase <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email service is running' });
});

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `HomeBase <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: 'Test Email from HomeBase',
      html: '<h1>Success!</h1><p>Your email configuration is working correctly.</p>'
    });

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: info.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log(`Gmail user: ${process.env.GMAIL_USER || 'Not configured'}`);
  console.log(`Gmail app password configured: ${process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No'}`);
  console.log(`Backend URL: ${process.env.VITE_BACKEND_URL || 'http://localhost:5000'}`);
});
