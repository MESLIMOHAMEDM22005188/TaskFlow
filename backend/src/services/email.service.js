const nodemailer = require("nodemailer");

function createTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 465);
    const secureValue = String(process.env.SMTP_SECURE || (port === 465 ? "true" : "false")).toLowerCase();
    const secure = secureValue === "true";

    if (!host || !user || !pass) {
        throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured.");
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("SMTP_PORT must be a valid TCP port.");
    }
    if (!["true", "false"].includes(secureValue)) {
        throw new Error("SMTP_SECURE must be true or false.");
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });
}

async function sendEmail({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error("EMAIL_FROM is missing.");
    if (!to || !subject || (!html && !text)) {
        throw new Error("Email recipient, subject and content are required.");
    }

    const transporter = createTransporter();
    try {
        return await transporter.sendMail({ from, to, subject, html, text });
    } finally {
        transporter.close();
    }
}

async function verifySMTP() {
    const transporter = createTransporter();
    try {
        return await transporter.verify();
    } finally {
        transporter.close();
    }
}

module.exports = { sendEmail, verifySMTP };
