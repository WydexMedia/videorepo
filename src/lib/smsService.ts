import twilio from 'twilio';

const isDevelopment = process.env.NODE_ENV === 'development';

const isTwilioConfigured =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC');

let client: twilio.Twilio | null = null;
if (isTwilioConfigured) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const sendOTP = async (phoneNumber: string, otp: string) => {
  try {
    if (!client) {
      console.error('❌ Twilio client not initialized. Cannot send OTP');
      return {
        success: false,
        error: 'Twilio client not initialized',
      };
    }

    const devOTP = '000000';

    const message = await client.messages.create({
      body: `Your Proskill verification code is: ${devOTP}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phoneNumber,
    });

    if (isDevelopment) {
      console.log(`✅ OTP sent successfully to ${phoneNumber}. SID: ${message.sid}`);
      console.log(`📱 [DEV MODE] Using hardcoded OTP: ${devOTP}`);
    } else {
      console.log('✅ OTP sent successfully');
    }

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
      devOTP: devOTP,
    };
  } catch (error: any) {
    if (isDevelopment) {
      console.error(`❌ Failed to send OTP to ${phoneNumber}:`, error.message);
    } else {
      console.error('❌ Failed to send OTP:', error.message);
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending OTP',
    };
  }
};

export const sendWelcomeMessage = async (phoneNumber: string, userName: string = 'User') => {
  try {
    if (!client) {
      console.error('❌ Twilio client not initialized. Cannot send welcome message');
      return {
        success: false,
        error: 'Twilio client not initialized',
      };
    }

    const message = await client.messages.create({
      body: `Welcome to Proskill, ${userName}! Your account has been successfully created. Start your learning journey today!`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phoneNumber,
    });

    if (isDevelopment) {
      console.log(`✅ Welcome message sent to ${phoneNumber}. SID: ${message.sid}`);
    } else {
      console.log('✅ Welcome message sent successfully');
    }

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    if (isDevelopment) {
      console.error(`❌ Failed to send welcome message to ${phoneNumber}:`, error.message);
    } else {
      console.error('❌ Failed to send welcome message:', error.message);
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending welcome message',
    };
  }
};

const sendOTPMock = async (phoneNumber: string, otp: string) => {
  const devOTP = '000000';
  if (isDevelopment) {
    console.log(`📱 [MOCK SMS] OTP for ${phoneNumber}: ${devOTP}`);
  }
  return {
    success: true,
    messageSid: 'mock-message-sid',
    status: 'sent',
    devOTP: devOTP,
  };
};

export const smsService = {
  sendOTP: isTwilioConfigured ? sendOTP : sendOTPMock,
  sendWelcomeMessage: isTwilioConfigured ? sendWelcomeMessage : sendOTPMock,
  isTwilioConfigured,
};

