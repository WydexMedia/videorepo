"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { api, Video, User } from "@/lib/api";
import { S3_VIDEOS } from "@/config/videos";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import WelcomeBanner from "@/components/WelcomeBanner";
import Calendar from "@/components/Calendar";
import VideoCard from "@/components/VideoCard";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const fetchVideos = async () => {
      const token = localStorage.getItem('auth_token');
      setIsLoadingVideos(true);

      try {
        // Try to fetch videos from API
        const response = await api.getVideos(token || undefined);
        
        if (response.status === 'success' && response.data) {
          setVideos(response.data);
        } else {
          // Fallback: Use direct S3 URLs from config file
          setVideos(S3_VIDEOS);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        // Fallback to direct S3 URLs from config file on error
        setVideos(S3_VIDEOS);
        toast.error('Could not load videos from server. Using configured S3 URLs.');
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [isLoading]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    toast.success("Logged out successfully");
    router.push("/login");
  }, [router]);

  const userName = useMemo(
    () => user?.profile?.firstName || "Esther",
    [user?.profile?.firstName]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeItem="home" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader 
          userName={userName}
          userAvatar={user?.profile?.avatar}
          phoneNumber={user?.phoneNumber}
          countryCode={user?.countryCode}
          memberSince={user?.createdAt}
          onLogout={handleLogout}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-[1600px] mx-auto">
            {/* Top Section: Welcome Banner and Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <WelcomeBanner userName={userName} progress={80} />
              </div>
              <div>
                <Calendar />
              </div>
            </div>

            {/* Your Courses Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Your Courses</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  VIEW ALL
                </button>
              </div>

              {isLoadingVideos ? (
                <div className="flex items-center justify-center py-12 bg-card rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <p className="text-muted-foreground">Loading videos...</p>
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video, index) => (
                    <VideoCard key={video.id || `video-${index}`} video={video} index={index} />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow-sm p-12 text-center border border-border">
                  <VideoIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No videos available at the moment.</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Please configure your S3 video URLs or set up the video API endpoint.
                  </p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
