const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Gmail SMTP transport using App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'amyelchristian8@gmail.com',
        pass: 'otzypqudccyfxevt'
    }
});

exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
    const { email } = data;

    if (!email || typeof email !== "string") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a valid 'email' string."
        );
    }

    // 1. Generate a 6-digit OTP securely
    const otp = crypto.randomInt(100000, 999999).toString();

    // 2. Hash the OTP for storage
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // 3. Set expiry to 5 minutes from now
    const now = admin.firestore.Timestamp.now();
    const expiresAt = new admin.firestore.Timestamp(now.seconds + 5 * 60, now.nanoseconds);

    // 4. Store hashed OTP in Firestore
    await db.collection("otpVerifications").doc(email).set({
        email,
        otp: hashedOtp,
        createdAt: now,
        expiresAt,
        verified: false,
    });

    // 5. Send the email DIRECTLY via nodemailer (no Firestore trigger chain)
    try {
        await transporter.sendMail({
            from: '"Cortex" <amyelchristian8@gmail.com>',
            to: email,
            subject: "Your Cortex Verification Code",
            html: `
                <div style="font-family: sans-serif; padding: 20px; background: #0a0a0a; color: white; border-radius: 12px;">
                    <h2 style="color: white;">Verify your Cortex account</h2>
                    <p style="color: #a1a1aa;">Your verification code is:</p>
                    <h1 style="letter-spacing: 8px; color: #22c55e; font-size: 36px;">${otp}</h1>
                    <p style="color: #a1a1aa;">This code expires in <strong style="color: white;">5 minutes</strong>.</p>
                    <p style="color: #71717a; font-size: 12px; margin-top: 20px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        });
    } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        // Clean up the OTP record since the email didn't go out
        await db.collection("otpVerifications").doc(email).delete();
        throw new functions.https.HttpsError(
            "internal",
            "Failed to send verification email. Please try again."
        );
    }

    return { success: true, message: "OTP sent successfully." };
});

exports.verifyOTP = functions.https.onCall(async (data, context) => {
    const { email, otp } = data;

    if (!email || !otp || typeof otp !== "string") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Missing email or otp."
        );
    }

    const otpDocRef = db.collection("otpVerifications").doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
        throw new functions.https.HttpsError("not-found", "No OTP record found for this email.");
    }

    const record = otpDoc.data();

    // 1. Check expiration
    if (record.expiresAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError("failed-precondition", "OTP has expired.");
    }

    // 2. Check hash
    const isValid = await bcrypt.compare(otp, record.otp);

    if (!isValid) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid OTP.");
    }

    // 3. Mark as verified
    await otpDocRef.update({ verified: true });

    // 4. Also mark any existing user document for this email as OTP-verified
    const usersSnapshot = await db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
    if (!usersSnapshot.empty) {
        await usersSnapshot.docs[0].ref.update({ otpVerified: true });
    }

    // 5. Clean up the OTP record
    await otpDocRef.delete();

    return { success: true, message: "OTP verified successfully." };
});
