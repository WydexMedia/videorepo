import { parsePhoneNumberFromString } from "libphonenumber-js";
// API Configuration - Now using local Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: any[];
}

export interface PhoneData {
  countryCode: string;
  phoneNumber: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  countryCode: string;
  fullPhoneNumber: string;
  isVerified: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  preferences: {
    language: string;
    notifications: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  requiresRegistration?: boolean;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  /**
   * Optional thumbnail/poster image for the video
   */
  thumbnail?: string;
  /**
   * Optional human‑readable duration label (e.g. "12:34")
   */
  duration?: string;
  createdAt?: string;
  /**
   * Optional map of quality → URL.
   * Example:
   * {
   *   1080: "https://.../video_1080.mp4",
   *   720: "https://.../video_720.mp4",
   *   480: "https://.../video_480.mp4"
   * }
   */
  qualities?: {
    1080?: string;
    720?: string;
    480?: string;
    360?: string;
  };
}

// API Functions
export const api = {
  // Send OTP
  sendOTP: async (phoneData: PhoneData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(phoneData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('sendOTP error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Verify OTP
  verifyOTP: async (phoneData: PhoneData, otp: string): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...phoneData,
          otp,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('verifyOTP error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Resend OTP
  resendOTP: async (phoneData: PhoneData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(phoneData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('resendOTP error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Get current user
  getCurrentUser: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Logout
  logout: async (token: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('logout error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Get videos
  getVideos: async (token?: string): Promise<ApiResponse<Video[]>> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('getVideos error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },

  // Register user
  register: async (phoneData: PhoneData, registrationData: { name: string; email: string; place: string }): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...phoneData,
          ...registrationData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('register error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },
};

// Utility function to extract phone data from international format
export const extractPhoneData = (fullPhone: string): PhoneData => {
  if (!fullPhone) return { countryCode: "+91", phoneNumber: "" };

  const parsed = parsePhoneNumberFromString(fullPhone);
  if (parsed && parsed.isValid()) {
    return {
      countryCode: `+${parsed.countryCallingCode}`,
      phoneNumber: parsed.nationalNumber,
    };
  }

  // Fallback: keep plus sign if present, otherwise treat last 10 digits as local
  const cleanDigits = fullPhone.replace(/[^\d+]/g, "");
  if (cleanDigits.startsWith("+")) {
    // Try to split: +<1-3 digit code><rest>
    const match = cleanDigits.match(/^\+(\d{1,3})(\d{5,})$/);
    if (match) {
      return { countryCode: `+${match[1]}`, phoneNumber: match[2] };
    }
  }

  const digits = cleanDigits.replace(/^\+/, "");
  if (digits.length >= 10) {
    return { countryCode: "+91", phoneNumber: digits.slice(-10) };
  }
  return { countryCode: "+91", phoneNumber: digits };
};

// Local storage helpers
export const storage = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },
  
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },
  
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },
  
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  },
  
  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },
  
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
    }
  },
  
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }
};
