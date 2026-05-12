const nodemailer = require('nodemailer')

// ─── Create transporter ───────────────────────────────────────────────────────
// Uses Gmail by default. Set EMAIL_USER and EMAIL_PASS in .env
// For Gmail: enable 2FA → generate an App Password → use it as EMAIL_PASS
// For other providers: change the service or use host/port directly

function createTransporter() {
    if (process.env.EMAIL_SERVICE === 'smtp') {
        // Custom SMTP (e.g. Mailtrap for dev, SendGrid for prod)
        return nodemailer.createTransport({
            host:   process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port:   parseInt(process.env.SMTP_PORT) || 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })
    }

    // Default: Gmail
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,   // App Password, not your Gmail password
        },
    })
}

// ─── Send password reset email ────────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, username, resetToken) {
    const transporter = createTransporter()

    const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5173'
    const resetLink  = `${clientUrl}/reset-password?token=${resetToken}`
    const expiryMins = 30

    const mailOptions = {
        from:    `"SkillSync" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: 'Reset your SkillSync password',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0F2027;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:40px;
              background:linear-gradient(160deg,#162B1E 0%,#0F2027 60%);
              border-radius:20px;border:1px solid rgba(62,224,127,0.15);
              box-shadow:0 24px 80px rgba(15,32,39,0.8);">

    <!-- Logo -->
    <div style="margin-bottom:32px;">
      <span style="font-size:24px;font-weight:700;color:#F0FAF4;letter-spacing:-0.5px;">Skill</span>
      <span style="font-size:24px;font-weight:700;color:#3EE07F;">Sync</span>
    </div>

    <!-- Heading -->
    <h1 style="color:#F0FAF4;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Reset your password
    </h1>
    <p style="color:#7BAF8E;font-size:14px;margin:0 0 28px 0;line-height:1.6;">
      Hi <strong style="color:#F0FAF4;">${username}</strong>, we received a request to reset your SkillSync password.
      Click the button below to set a new password.
    </p>

    <!-- Button -->
    <a href="${resetLink}"
       style="display:inline-block;padding:14px 32px;
              background:linear-gradient(135deg,#28623A,#1A4D2E);
              color:#F0FAF4;font-size:14px;font-weight:600;
              text-decoration:none;border-radius:12px;
              border:1px solid rgba(62,224,127,0.25);
              box-shadow:0 8px 24px rgba(62,224,127,0.15);">
      Reset Password →
    </a>

    <!-- Expiry notice -->
    <p style="color:#7BAF8E;font-size:12px;margin:24px 0 0 0;line-height:1.6;">
      ⏰ This link expires in <strong style="color:#FBBF24;">${expiryMins} minutes</strong>.
      If you didn't request a password reset, you can safely ignore this email.
    </p>

    <!-- Divider -->
    <div style="border-top:1px solid rgba(40,98,58,0.3);margin:28px 0;"></div>

    <!-- Link fallback -->
    <p style="color:rgba(123,175,142,0.5);font-size:11px;margin:0;line-height:1.6;">
      If the button doesn't work, copy this link into your browser:<br>
      <span style="color:#3EE07F;word-break:break-all;">${resetLink}</span>
    </p>

    <!-- Footer -->
    <p style="color:rgba(123,175,142,0.3);font-size:11px;margin:20px 0 0 0;text-align:center;">
      © SkillSync · AI-Powered Project Management
    </p>
  </div>
</body>
</html>`,
        text: `Hi ${username},\n\nReset your SkillSync password using this link:\n${resetLink}\n\nThis link expires in ${expiryMins} minutes.\n\nIf you didn't request this, ignore this email.`,
    }

    await transporter.sendMail(mailOptions)
}

module.exports = { sendPasswordResetEmail }