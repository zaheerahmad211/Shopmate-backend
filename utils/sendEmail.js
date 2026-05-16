const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use Real Gmail SMTP integration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: '"Marketplace" <noreply@marketplace.com>',
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Real email sent: %s', info.messageId);
    } else {
        // Fallback: Mock the email delivery.
        // Ethereal API frequently times out or rejects connections, which causes the entire
        // backend route to crash and throw 500 errors, blocking Registration entirely.
        // We already print the OTP in authRoutes.js directly to the console anyway!
        console.log(`[Email Mocked] Did not send real email to ${options.email} (No SMTP credentials found in .env)`);
    }
};

module.exports = sendEmail;
