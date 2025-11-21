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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sendOTP = async (phoneNumber: string, _otp: string) => {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while sending OTP';
    if (isDevelopment) {
      console.error(`❌ Failed to send OTP to ${phoneNumber}:`, errorMessage);
    } else {
      console.error('❌ Failed to send OTP:', errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while sending welcome message';
    if (isDevelopment) {
      console.error(`❌ Failed to send welcome message to ${phoneNumber}:`, errorMessage);
    } else {
      console.error('❌ Failed to send welcome message:', errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendOTPMock = async (_phoneNumber: string, _otp: string) => {
  const devOTP = '000000';
  if (isDevelopment) {
    console.log(`📱 [MOCK SMS] OTP for ${_phoneNumber}: ${devOTP}`);
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

