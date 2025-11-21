import { Video } from "@/lib/api";

/**
 * Configure your S3 video URLs here
 * Replace the URLs below with your actual S3 video URLs
 * 
 * To get your S3 video URL:
 * 1. Go to AWS S3 Console
 * 2. Select your bucket
 * 3. Click on the video file
 * 4. Copy the "Object URL" or make it public and use the public URL
 * 
 * Format: https://your-bucket-name.s3.region.amazonaws.com/video-name.mp4
 * Or: https://your-bucket-name.s3-region.amazonaws.com/video-name.mp4
 */

export const S3_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Video 1',
    // Default URL (for players that don't support quality selection)
    url: 'https://your-bucket.s3.amazonaws.com/video1_720.mp4',
    // Optional: multiple qualities for Plyr quality selector
    // Replace these with your actual S3 URLs for each resolution
    qualities: {
      1080: 'https://your-bucket.s3.amazonaws.com/video1_1080.mp4',
      720: 'https://your-bucket.s3.amazonaws.com/video1_720.mp4',
      480: 'https://your-bucket.s3.amazonaws.com/video1_480.mp4',
    },
  },
  {
    id: '2',
    title: 'Video 2',
    url: 'https://your-bucket.s3.amazonaws.com/video2_720.mp4',
    qualities: {
      1080: 'https://your-bucket.s3.amazonaws.com/video2_1080.mp4',
      720: 'https://your-bucket.s3.amazonaws.com/video2_720.mp4',
      480: 'https://your-bucket.s3.amazonaws.com/video2_480.mp4',
    },
  },
  {
    id: '3',
    title: 'Video 3',
    url: 'https://your-bucket.s3.amazonaws.com/video3_720.mp4',
    qualities: {
      1080: 'https://your-bucket.s3.amazonaws.com/video3_1080.mp4',
      720: 'https://your-bucket.s3.amazonaws.com/video3_720.mp4',
      480: 'https://your-bucket.s3.amazonaws.com/video3_480.mp4',
    },
  },
];

