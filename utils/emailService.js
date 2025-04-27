// File: utils/emailService.js
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const Token = require('../models/Token');
const crypto = require('crypto');

// OAuth2 configuration from environment variables
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URL = process.env.OAUTH_REDIRECT_URL;
const REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Rest of the email service code remains the same...
/**
 * Get transporter with OAuth2 authentication
 */
const getTransporter = async () => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw error;
  }
};

/**
 * Generate OTP and save it to Token model
 * @param {string} userId - User ID
 * @param {string} type - Token type ('activation' or 'passwordReset')
 * @returns {string} The generated OTP
 */
exports.generateOTP = async (userId, type) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Save token to database
  await Token.findOneAndDelete({ userId, type }); // Delete any existing tokens
  await Token.create({
    userId,
    token: hashedOTP,
    type
  });
  
  return otp;
};

/**
 * Verify OTP
 * @param {string} userId - User ID
 * @param {string} otp - One-time password to verify
 * @param {string} type - Token type ('activation' or 'passwordReset')
 * @returns {boolean} True if OTP is valid
 */
exports.verifyOTP = async (userId, otp, type) => {
  // Hash provided OTP
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Find token
  const token = await Token.findOne({
    userId,
    token: hashedOTP,
    type
  });
  
  return !!token; // Return true if token exists
};

/**
 * Send activation email with OTP
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.otp - One-time password code
 */
exports.sendActivationEmail = async (options) => {
  try {
    const transporter = await getTransporter();
    
    // Email content
    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: options.email,
      subject: 'Activate Your Travlease Account',
      html: generateEmailTemplate('Account Activation', options.otp)
    };

    // Send email
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw error;
  }
};

/**
 * Send OTP email for password reset
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.otp - One-time password code
 */
exports.sendOTPEmail = async (options) => {
  try {
    const transporter = await getTransporter();
    
    // Email content
    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: options.email,
      subject: 'Password Reset Code - Travlease',
      html: generateEmailTemplate('Password Reset Code', options.otp)
    };

    // Send email
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
};

/**
 * Generate email template
 * @param {string} title - Email title
 * @param {string} otp - One-time password
 * @returns {string} HTML email template
 */
function generateEmailTemplate(title, otp) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Travlease Verification Code</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          min-width: 100%;
          font-family: Arial, sans-serif;
          line-height: 1.5;
          color: #333333;
          background-color: #f5f5f5;
        }
        
        .wrapper {
          width: 100%;
          background-color: #f5f5f5;
          padding-bottom: 40px;
        }
        
        .main {
          background-color: #ffffff;
          margin: 0 auto;
          width: 100%;
          max-width: 600px;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        .header {
          padding: 25px 0;
          text-align: center;
          background-color: #E61E51;
          border-bottom: 5px solid #EAE2E2;
        }
        
        .header-content {
          color: #ffffff;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .content {
          padding: 35px;
        }
        
        .footer {
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #ffffff;
          background-color: #E61E51;
        }
        
        h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #E61E51;
        }
        
        p {
          margin: 0 0 20px 0;
          font-size: 16px;
        }
        
        .otp-container {
          margin: 30px 0;
          text-align: center;
        }
        
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #ffffff;
          padding: 15px 25px;
          background-color: #E61E51;
          border-radius: 10px;
          display: inline-block;
          box-shadow: 0 3px 6px rgba(230, 30, 81, 0.3);
        }
        
        .highlight {
          color: #E61E51;
          font-weight: 600;
        }
        
        .note {
          font-size: 14px;
          color: #666666;
          background-color: #EAE2E2;
          padding: 15px;
          border-left: 4px solid #E61E51;
          border-radius: 4px;
        }
        
        .divider {
          height: 1px;
          background-color: #EAE2E2;
          margin: 25px 0;
        }
        
        @media screen and (max-width: 600px) {
          .main {
            width: 95%;
          }
          
          .content {
            padding: 20px;
          }
          
          .otp-code {
            font-size: 28px;
            letter-spacing: 5px;
            padding: 12px 15px;
          }
          
          .header-content {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div style="display: none; max-height: 0; overflow: hidden;">
        Your Travlease verification code is ready - valid for 10 minutes only
      </div>
      
      <center class="wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" valign="top">
              <table class="main" width="600" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="header">
                    <div class="header-content">TRAVLEASE</div>
                  </td>
                </tr>
                
                <tr>
                  <td class="content">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <h1>${title}</h1>
                          <p>Hello,</p>
                          <p>${title === 'Password Reset Code' 
                            ? 'You requested a password reset for your Travlease account.' 
                            : 'Thank you for registering with Travlease!'} 
                            Please use the following one-time password (OTP) to verify your identity:</p>
                          
                          <div class="otp-container">
                            <div class="otp-code">${otp}</div>
                          </div>
                          
                          <div class="note">
                            <p style="margin: 0;">This code is valid for <span class="highlight">10 minutes</span> only and can be used just once.</p>
                          </div>
                          
                          <div class="divider"></div>
                          
                          <p>If you didn't request this code, you can safely ignore this email or contact support if you have concerns.</p>
                          
                          <p>Safe travels,<br>The Travlease Team</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td class="footer">
                    <p>&copy; ${new Date().getFullYear()} Travlease. All rights reserved.</p>
                    <p>Making travel easier, one journey at a time.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
  `;
}