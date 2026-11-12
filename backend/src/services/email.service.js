
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail({ to, subject, html, text }) {
    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is missing");
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
    });
}

async function verifySMTP() {
    return transporter.verify();
}

module.exports = { sendEmail, verifySMTP };
