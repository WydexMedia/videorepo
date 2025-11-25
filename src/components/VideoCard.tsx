"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import "plyr-react/plyr.css";

const Plyr = dynamic(() => import("plyr-react"), { ssr: false });

// Move outside component to avoid recreation
const videonames = ["Session 1", "Session 2", "Session 3"];

interface VideoCardProps {
  video: Video;
  index?: number;
}



export default function VideoCard({ video, index = 0 }: VideoCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plyrRef = useRef<any>(null);

  // Determine video type from URL extension or default to mp4
  const getVideoType = useCallback((url: string): string => {
    // Remove query parameters for extension detection
    const urlWithoutParams = url.split("?")[0];
    const extension = urlWithoutParams.split(".").pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      ogv: "video/ogg",
      m3u8: "application/x-mpegURL", // HLS
      mpd: "application/dash+xml", // DASH
    };
    return typeMap[extension || ""] || "video/mp4";
  }, []);

  const videoSource = useMemo(() => {
    if (!video.url) {
      console.log('⚠️ VideoCard: No video URL in video object:', video);
      return null;
    }
    
    console.log('🎥 VideoCard: Building video source for:', video.url);

    // If multiple qualities are provided, expose them as separate sources
    const sources: Array<{ src: string; type: string; size?: number }> = [];

    if (video.qualities && Object.keys(video.qualities).length > 0) {
      Object.entries(video.qualities).forEach(([qualityStr, src]) => {
        if (!src) return;
        const quality = Number(qualityStr);
        sources.push({
          src,
          type: getVideoType(src),
          size: Number.isNaN(quality) ? undefined : quality,
        });
      });

      // Fallback: ensure at least one source
      if (sources.length === 0) {
        sources.push({
          src: video.url,
          type: getVideoType(video.url),
        });
      }
    } else {
      sources.push({
        src: video.url,
        type: getVideoType(video.url),
      });
    }

    return {
      type: "video" as const,
      sources,
      poster: video.thumbnail,
    };
  }, [video, getVideoType]);

  const videoName = useMemo(
    () => videonames[index] || video.title || "Video",
    [index, video.title]
  );


  // Build Plyr quality options if multiple qualities exist
  const qualityOptions = useMemo(() => {
    if (!video.qualities) return undefined;
    const qualities = Object.keys(video.qualities)
      .map((q) => Number(q))
      .filter((q) => !Number.isNaN(q))
      .sort((a, b) => b - a);

    if (qualities.length === 0) return undefined;

    return {
      default: qualities[0],
      options: qualities,
      forced: true,
    };
  }, [video.qualities]);

  const plyrOptions = useMemo(() => {
    const baseOptions: {
      controls: string[];
      settings: string[];
      keyboard: { focused: boolean; global: boolean };
      tooltips: { controls: boolean; seek: boolean };
      clickToPlay: boolean;
      hideControls: boolean;
      resetOnEnd: boolean;
      autoplay: boolean;
      quality?: { default: number; options: number[]; forced: boolean };
    } = {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "fullscreen",
      ],
      settings: ["quality", "speed"],
      keyboard: {
        focused: true,
        global: false,
      },
      tooltips: {
        controls: true,
        seek: true,
      },
      clickToPlay: true,
      hideControls: true,
      resetOnEnd: false,
      autoplay: false,
    };

    if (qualityOptions) {
      baseOptions.quality = qualityOptions;
    }

    return baseOptions;
  }, [qualityOptions]);

  // Reset states when video URL changes
  useEffect(() => {
    if (video.url) {
      console.log('🎥 VideoCard: URL changed to:', video.url);
      setIsLoading(true);
      setError(null);
    } else {
      console.log('⚠️ VideoCard: No video URL provided');
    }
  }, [video.url]);

  // Set up Plyr event listeners when player is ready
  useEffect(() => {
    if (!videoSource) return;
    
    // Check for player instance - plyr-react exposes it as ref.current.plyr
    const checkAndSetup = (): (() => void) | false => {
      const player = plyrRef.current?.plyr;
      if (!player) {
        return false;
      }
      
      console.log('🎬 VideoCard: Player found, setting up listeners for:', video.url);
      let loadingTimeout: NodeJS.Timeout | null = null;
    
    const handleReady = () => {
      console.log('✅ VideoCard: Player ready');
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      setIsLoading(false);
      setError(null);
    };
    
    const handleLoadStart = () => {
      console.log('🔄 VideoCard: Load started');
      setIsLoading(true);
      setError(null);
      
      // Set timeout to prevent infinite loading
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      loadingTimeout = setTimeout(() => {
        console.log('⏱️ VideoCard: Loading timeout reached');
        setIsLoading(false);
        setError('Video is taking too long to load. Please check the URL and CORS settings.');
        loadingTimeout = null;
      }, 30000); // 30 second timeout
    };
    
    const handleCanPlay = () => {
      console.log('▶️ VideoCard: Can play');
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      setIsLoading(false);
      setError(null);
    };
    
    const handleError = () => {
      console.error('❌ VideoCard: Error occurred');
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      const videoElement = player.media as HTMLVideoElement | null;
      if (videoElement?.error) {
        const videoError = videoElement.error;
        let errorMessage = 'Unknown error';
        
        console.error('Video error details:', {
          code: videoError.code,
          message: videoError.message,
        });
        
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - Check CORS settings on S3 bucket';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video decode error - File may be corrupted';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
          default:
            errorMessage = `Error code: ${videoError.code}`;
        }
        
        setError(errorMessage);
      } else {
        setError('Video failed to load. Check CORS settings and URL accessibility.');
      }
      
      setIsLoading(false);
    };
    
    // Use Plyr's ready event instead of polling
    if (player.ready) {
      handleReady();
    } else {
      player.once('ready', handleReady);
    }
    
      player.on('loadstart', handleLoadStart);
      player.on('canplay', handleCanPlay);
      player.on('error', handleError);
      
      return () => {
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        player.off('ready', handleReady);
        player.off('loadstart', handleLoadStart);
        player.off('canplay', handleCanPlay);
        player.off('error', handleError);
      };
    };
    
    // Try to setup immediately
    let cleanup: (() => void) | false = checkAndSetup();
    if (cleanup) {
      return cleanup;
    }
    
    // If not ready, check periodically (max 5 seconds)
    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
      attempts++;
      cleanup = checkAndSetup();
      if (cleanup || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && !cleanup) {
          console.warn('⚠️ VideoCard: Player did not initialize after 5 seconds');
        }
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [video.url, videoSource]);


  if (!videoSource) {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 hover:border-blue-300">
        <CardContent className="p-0">
          <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="text-center p-3 sm:p-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-red-400 px-2">{error || 'Invalid video source'}</p>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2">
              {video.title}
            </h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 hover:border-blue-300 group">
      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
              <div className="text-center">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-white mx-auto mb-2" />
                <p className="text-xs text-white/80">Loading video...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
              <div className="text-center p-3 sm:p-4 max-w-xs">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-400 mb-1">{error}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Check CORS settings on S3 bucket</p>
              </div>
            </div>
          )}
          {!error && videoSource && (
            <Plyr
              ref={plyrRef}
              source={videoSource}
              options={plyrOptions}
            />
          )}
        </div>
        
        <div className="p-3 sm:p-4 bg-gradient-to-b from-white to-gray-50 group-hover:from-blue-50 group-hover:to-white transition-colors duration-300">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {videoName}
          </h3>
          {video.duration && (
            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {video.duration}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

