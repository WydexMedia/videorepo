import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phoneNumber: string;
  countryCode: string;
  fullPhoneNumber: string;
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  lastLogin?: Date;
  lastLogout?: Date;
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    place?: string;
    avatar?: string;
  };
  preferences: {
    language: string;
    notifications: boolean;
  };
  isActive: boolean;
  tokenVersion: number;
  registeredAt?: Date;
  generateOTP(): string;
  verifyOTP(otp: string): Promise<boolean>;
  clearOTP(): void;
  updateLastLogin(): void;
  updateLastLogout(): void;
  incrementTokenVersion(): number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      default: '+91',
    },
    fullPhoneNumber: {
      type: String,
      required: [true, 'Full phone number is required'],
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    lastLogout: {
      type: Date,
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      place: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String,
      },
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    registeredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ phoneNumber: 1 }, { unique: true, name: 'phoneNumber_unique_idx' });
userSchema.index({ fullPhoneNumber: 1 }, { unique: true, name: 'fullPhoneNumber_unique_idx' });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || 'User';
});

// Method to generate OTP
userSchema.methods.generateOTP = function () {
  const otp = '000000';
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 [DEV MODE] Generated hardcoded OTP: ${otp}`);
  }
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = async function (otp: string) {
  if (!this.otp || !this.otpExpires) {
    return false;
  }

  if (this.otpExpires <= new Date()) {
    return false;
  }

  return await bcrypt.compare(otp, this.otp);
};

// Method to clear OTP
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpires = undefined;
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
};

// Method to update last logout
userSchema.methods.updateLastLogout = function () {
  this.lastLogout = new Date();
  this.lastLogin = null;
};

// Method to increment token version
userSchema.methods.incrementTokenVersion = function () {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  return this.tokenVersion;
};

// Pre-save middleware to hash OTP
userSchema.pre('save', async function (next) {
  if (this.isModified('otp') && this.otp) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

// Create the model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;

