"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, User, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { api, PhoneData } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneData, setPhoneData] = useState<PhoneData | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Retrieve phone data from localStorage
    const storedPhoneData = localStorage.getItem('pending_registration_phone');
    if (!storedPhoneData) {
      // If no phone data, redirect to login
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedPhoneData);
      setPhoneData(parsed);
    } catch (err) {
      console.error("Error parsing phone data:", err);
      router.push('/login');
    }
  }, [router]);

  const handleRegistration = useCallback(async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!place.trim()) {
      setError("Please enter your place");
      return;
    }

    if (!phoneData) {
      setError("Phone data is missing. Please try logging in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.register(phoneData, {
        name: name.trim(),
        email: email.trim(),
        place: place.trim(),
      });

      if (response.status === 'success' && response.data) {
        toast.success("Registration successful!");
        // Store token and user data
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        // Clear pending registration data
        localStorage.removeItem('pending_registration_phone');
        
        // Redirect to home page
        router.push('/home');
      } else {
        // Extract specific error message from errors array if available
        let errorMessage = response.message || "Registration failed. Please try again.";
        if (response.errors && response.errors.length > 0) {
          const firstError = response.errors[0];
          if (typeof firstError === 'object' && firstError !== null && 'path' in firstError) {
            const emailError = response.errors.find((err): err is { path?: string; msg?: string } => 
              typeof err === 'object' && err !== null && 'path' in err && (err as { path?: string }).path === 'email'
            );
            if (emailError && 'msg' in emailError && emailError.msg) {
              errorMessage = emailError.msg;
            } else if ('msg' in firstError && firstError.msg) {
              errorMessage = firstError.msg;
            }
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please check your connection and try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, email, place, phoneData, router]);

  const handleBackToLogin = useCallback(() => {
    localStorage.removeItem('pending_registration_phone');
    router.push('/login');
  }, [router]);

  if (!phoneData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-8">
            <div className="relative">
              <Image src="/Proksilllogo.webp" alt="Logo" width={100} height={100} />
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Heading */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Complete Your Registration
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              Please provide your details to continue
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Phone: {phoneData.countryCode} {phoneData.phoneNumber}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium text-xs sm:text-sm">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium text-xs sm:text-sm">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Place Field */}
            <div className="space-y-2">
              <Label htmlFor="place" className="text-gray-700 font-medium text-xs sm:text-sm">
                Place
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="place"
                  type="text"
                  placeholder="Enter your place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleRegistration}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim() || !email.trim() || !place.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Dashboard Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/LOGIN.png"
            alt="Registration Preview"
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

