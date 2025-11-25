"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { api, Video, User } from "@/lib/api";
import { S3_VIDEOS } from "@/config/videos";
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
        console.log('🎬 Fetching videos from API...');
        const response = await api.getVideos(token || undefined);
        console.log('📦 API Response:', response);
        
        if (response.status === 'success' && response.data && response.data.length > 0) {
          console.log('✅ Videos loaded from API:', response.data.length, 'videos');
          console.log('📹 Video URLs:', response.data.map(v => v.url));
          setVideos(response.data);
        } else {
          console.log('⚠️ No videos from API, checking config fallback...');
          // Fallback: Use direct S3 URLs from config file only if they're not placeholders
          const validConfigVideos = S3_VIDEOS.filter(
            (video) => video.url && !video.url.includes('your-bucket')
          );
          console.log('📋 Config videos:', validConfigVideos.length, 'valid videos');
          if (validConfigVideos.length > 0) {
            console.log('✅ Using config videos:', validConfigVideos.map(v => v.url));
            setVideos(validConfigVideos);
          } else {
            // No valid videos - show empty state
            console.log('❌ No valid videos found in config');
            setVideos([]);
            toast.info('No videos configured. Please set up S3 or add video URLs in config.');
          }
        }
      } catch (error) {
        console.error('❌ Error fetching videos:', error);
        // Fallback to direct S3 URLs from config file only if they're not placeholders
        const validConfigVideos = S3_VIDEOS.filter(
          (video) => video.url && !video.url.includes('your-bucket')
        );
        if (validConfigVideos.length > 0) {
          console.log('✅ Using config videos as fallback:', validConfigVideos.map(v => v.url));
          setVideos(validConfigVideos);
          toast.warning('Could not load videos from server. Using configured S3 URLs.');
        } else {
          console.log('❌ No valid videos available');
          setVideos([]);
          toast.error('No videos available. Please configure S3 or add video URLs.');
        }
      } finally {
        setIsLoadingVideos(false);
        console.log('🏁 Finished loading videos');
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
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
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
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {/* Top Section: Welcome Banner and Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="lg:col-span-2">
                <WelcomeBanner userName={userName} progress={80} />
              </div>
              <div>
                <Calendar />
              </div>
            </div>

            {/* Your Courses Section */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Your Courses</h2>
                <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                  VIEW ALL
                </button>
              </div>

              {isLoadingVideos ? (
                <div className="flex items-center justify-center py-8 sm:py-12 bg-card rounded-lg">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600 mr-2 sm:mr-3" />
                  <p className="text-muted-foreground text-sm sm:text-base">Loading videos...</p>
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {videos.map((video, index) => (
                    <VideoCard key={video.id || `video-${index}`} video={video} index={index} />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow-sm p-6 sm:p-12 text-center border border-border">
                  <VideoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-base sm:text-lg">No videos available at the moment.</p>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-2">
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
