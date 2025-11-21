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
  const [playerReady, setPlayerReady] = useState(false);
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
      return null;
    }

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
  }, [video.url, video.thumbnail, video.qualities, getVideoType]);

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
    const baseOptions: any = {
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
      setIsLoading(true);
      setError(null);
      setPlayerReady(false);
    }
  }, [video.url]);

  // Set up Plyr event listeners when player is ready
  useEffect(() => {
    const player = plyrRef.current?.plyr;
    if (!player || !playerReady) return;
    
    const handleReady = () => {
      setIsLoading(false);
      setError(null);
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };
    
    const handleError = (e: any) => {
      const videoElement = player.media as HTMLVideoElement | null;
      if (videoElement?.error) {
        const videoError = videoElement.error;
        let errorMessage = 'Unknown error';
        
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
      player.off('ready', handleReady);
      player.off('loadstart', handleLoadStart);
      player.off('canplay', handleCanPlay);
      player.off('error', handleError);
    };
  }, [playerReady, video.url]);

  // Set player ready when Plyr instance is available
  useEffect(() => {
    if (plyrRef.current?.plyr && !playerReady) {
      setPlayerReady(true);
    }
  }, [playerReady]);

  if (!videoSource) {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white">
        <CardContent className="p-0">
          <div className="relative w-full aspect-video bg-black flex items-center justify-center">
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error || 'Invalid video source'}</p>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
              {video.title}
            </h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white">
      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center p-4">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-red-400">{error}</p>
                <p className="text-xs text-gray-400 mt-1">Check CORS settings on S3 bucket</p>
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
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
            {videoName}
          </h3>
          {video.duration && (
            <p className="text-sm text-gray-500">{video.duration}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

