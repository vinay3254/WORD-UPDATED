const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  type:      { type: String, enum: ['verify', 'reset'], required: true },
  expiresAt: { type: Date,   required: true, index: { expires: 0 } },
});

module.exports = mongoose.model('OTP', otpSchema);
