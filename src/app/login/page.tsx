"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { api, extractPhoneData, PhoneData } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import OTPVerification from "@/components/OTPVerification";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [phoneData, setPhoneData] = useState<PhoneData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);


  // Handle login button click
  const handleLogin = useCallback(async () => {
    if (!phone) {
      setError("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const extractedPhoneData = extractPhoneData(phone);
      
      console.log("Sending OTP to:", extractedPhoneData);

      // Call backend API to send OTP
      const response = await api.sendOTP(extractedPhoneData);

      if (response.status === 'success') {
        setPhoneData(extractedPhoneData);
        setShowOTPVerification(true);
        toast.success(`OTP sent successfully to ${extractedPhoneData.countryCode} ${extractedPhoneData.phoneNumber}`);
        console.log("OTP sent successfully:", response);
      } else {
        // Extract specific error message from errors array if available
        let errorMessage = response.message || "Failed to send OTP";
        if (response.errors && response.errors.length > 0) {
          const firstError = response.errors[0];
          if (typeof firstError === 'object' && firstError !== null && 'path' in firstError) {
            const phoneError = response.errors.find((err): err is { path?: string; msg?: string } => 
              typeof err === 'object' && err !== null && 'path' in err && (err as { path?: string }).path === 'phoneNumber'
            );
            if (phoneError && 'msg' in phoneError && phoneError.msg) {
              errorMessage = phoneError.msg;
            } else if ('msg' in firstError && firstError.msg) {
              errorMessage = firstError.msg;
            }
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("OTP send failed:", response);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  // Handle OTP verification success
  const handleOTPSuccess = useCallback((token: string, user: { profile?: { firstName?: string; lastName?: string }; id?: string }) => {
    if (!phoneData) return;

    // Check if registration is required
    const requiresRegistration = 
      !user?.profile ||
      !token;

    if (requiresRegistration) {
      console.log("Redirecting to registration page");
      localStorage.setItem('pending_registration_phone', JSON.stringify(phoneData));
      router.push('/registration');
      return;
    }

    console.log("✅ User is registered, proceeding to home");
    toast.success("Login successful!");
    router.push('/home');
  }, [phoneData, router]);

  // Handle back to phone input
  const handleBackToPhone = useCallback(() => {
    setShowOTPVerification(false);
    setPhoneData(null);
    setPhone("");
    setError("");
  }, []);


  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        {showOTPVerification && phoneData ? (
          <OTPVerification 
            phoneData={phoneData}
            onBack={handleBackToPhone}
            onSuccess={handleOTPSuccess}
          />
        ) : (
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-8">
            <div className="relative">
              <Image 
                src="/Proksilllogo.webp" 
                alt="Logo" 
                width={100} 
                height={100}
                priority
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              Sign in to continue to Proskill
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium text-xs sm:text-sm">
                Phone Number
              </Label>
              <div className="relative w-full">
                {isMounted ? (
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    defaultCountry="in"
                    className="!h-12 !w-full"
                    style={{
                      '--react-international-phone-height': '48px',
                      '--react-international-phone-border-radius': '0.5rem',
                      '--react-international-phone-border-color': 'rgb(229 231 235)',
                      '--react-international-phone-background-color': 'white',
                    } as React.CSSProperties}
                    inputClassName="!h-12 !w-full !bg-white !border-gray-200 !text-gray-900 !placeholder-gray-400 !px-3 !text-sm focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/20 !transition-all !duration-200"
                    countrySelectorStyleProps={{
                      buttonClassName: "!h-12 !bg-white !border-gray-200 hover:!bg-gray-50 !text-gray-700 !px-3 !rounded-l-lg !border-r-0",
                      dropdownStyleProps: {
                        className: "!bg-white !border-gray-200 !shadow-lg !rounded-lg !mt-1"
                      }
                    }}
                  />
                ) : (
                  <div className="h-12 w-full bg-white border border-gray-200 rounded-lg flex items-center px-3" aria-hidden="true">
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                )}
              </div>
              {phone && phone.length < 10 && (
                <p className="text-xs text-red-500">
                  Please enter a valid phone number
                </p>
              )}
              
              {/* Error Message */}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!phone || phone.length < 10 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>

          {/* Additional Links */}
          <div className="text-center pt-2 sm:pt-4">
            <p className="text-gray-600 text-xs sm:text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Create account
              </a>
            </p>
          </div>

          {/* Divider */}
          <div className="relative py-3 sm:py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 sm:px-4 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-10 sm:h-11 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-lg text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="h-10 sm:h-11 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-lg text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </Button>
          </div>
        
          </div>
        )}
      </div>

      {/* Right Side - Dashboard Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
            <Image
              src="/LOGIN.png"
              alt="Dashboard Preview"
              width={800}
              height={600}
              className="w-full h-full object-cover"
              loading="lazy"
            />
        </div>
      </div>
    </div>
  );
}
