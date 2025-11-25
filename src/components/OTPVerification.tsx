"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { api, PhoneData } from "@/lib/api";
import { toast } from "sonner";

interface OTPVerificationProps {
  phoneData: PhoneData;
  onBack: () => void;
  onSuccess: (token: string, user: { profile?: { firstName?: string; lastName?: string }; id?: string; requiresRegistration?: boolean }) => void;
}

export default function OTPVerification({ phoneData, onBack, onSuccess }: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Verify OTP
  const handleVerifyOTP = useCallback(async (otpValue: string) => {
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.verifyOTP(phoneData, otpValue);

      if (response.status === 'success' && response.data) {
        // Check if registration is required
        const dataFlag = response.data.requiresRegistration;
        const rootFlag = (response as { requiresRegistration?: boolean }).requiresRegistration;
        
        const requiresRegistration = 
          dataFlag === true ||
          (typeof dataFlag === 'string' && dataFlag === "true") ||
          rootFlag === true ||
          (typeof rootFlag === 'string' && rootFlag === "true") ||
          !response.data.token ||
          !response.data.user?.profile;

        if (requiresRegistration) {
          // Don't store token/user, let parent handle registration
          onSuccess("", { requiresRegistration: true });
        } else {
          // Store token and user data, then call success
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          onSuccess(response.data.token, response.data.user);
        }
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [phoneData, onSuccess]);

  // Handle OTP input change
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = value;
      
      // Auto-focus next input
      if (value && index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }
      
      // Auto-submit when all digits are entered
      if (newOtp.every(digit => digit !== "") && newOtp.join("").length === 6) {
        setTimeout(() => handleVerifyOTP(newOtp.join("")), 100);
      }
      
      return newOtp;
    });
  }, [handleVerifyOTP]);

  // Handle backspace
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(newOtp);
    
    // Focus the last filled input or the first empty one
    setTimeout(() => {
      const lastFilledIndex = newOtp.findIndex(digit => !digit);
      const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  }, []);


  // Resend OTP
  const handleResendOTP = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.resendOTP(phoneData);

      if (response.status === 'success') {
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
        toast.success("OTP resent successfully");
      } else {
        setError(response.message || "Failed to resend OTP");
        toast.error(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [phoneData]);

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-2 sm:mb-4 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Verify OTP
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm px-2">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium break-all">
            {phoneData.countryCode} {phoneData.phoneNumber}
          </span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-gray-700 font-medium text-xs sm:text-sm">
          Verification Code
        </Label>
        
        <div className="flex gap-1.5 sm:gap-2 justify-center px-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded text-center mx-2">
            {error}
          </p>
        )}
      </div>

      {/* Verify Button */}
      <Button
        onClick={() => handleVerifyOTP(otp.join(""))}
        disabled={otp.join("").length !== 6 || isLoading}
        className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify OTP"
        )}
      </Button>

      {/* Resend OTP */}
      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleResendOTP}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Resend OTP
          </button>
        ) : (
          <p className="text-gray-500 text-xs sm:text-sm">
            Resend OTP in {countdown} seconds
          </p>
        )}
      </div>
    </div>
  );
}
