import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { optionalAuth } from '@/lib/middleware/auth';
import { escapeString } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const USE_CLOUDFRONT = process.env.USE_CLOUDFRONT === 'true';

const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const isVideoFile = (filename: string) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  return videoExtensions.includes(getFileExtension(filename));
};

const isImageFile = (filename: string) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  return imageExtensions.includes(getFileExtension(filename));
};

const getVideoUrl = async (key: string, usePresigned: boolean = false) => {
  if (usePresigned) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } else if (USE_CLOUDFRONT && CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  } else {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
};

const extractVideoMetadata = (key: string) => {
  const filename = key.split('/').pop() || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  let title = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b(video|vid|clip|file)\b/gi, '').trim();
  if (!title) {
    title = nameWithoutExt;
  }
  title = title
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return {
    title,
    filename,
  };
};

const findThumbnail = (videoKey: string, allObjects: Array<{ Key?: string }>) => {
  const videoName = videoKey.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  const videoPath = videoKey.substring(0, videoKey.lastIndexOf('/'));
  const thumbnailPaths = [
    `${videoPath}/${videoName}.jpg`,
    `${videoPath}/${videoName}.jpeg`,
    `${videoPath}/${videoName}.png`,
    `${videoPath}/thumbnails/${videoName}.jpg`,
    `${videoPath}/thumbnails/${videoName}.jpeg`,
    `${videoPath}/thumbnails/${videoName}.png`,
    `thumbnails/${videoName}.jpg`,
    `thumbnails/${videoName}.jpeg`,
    `thumbnails/${videoName}.png`,
  ];
  for (const thumbPath of thumbnailPaths) {
    const thumbnail = allObjects.find((obj) => obj.Key === thumbPath && isImageFile(obj.Key));
    if (thumbnail) {
      return thumbnail.Key;
    }
  }
  return null;
};

export async function GET(req: NextRequest) {
  try {
    await optionalAuth(req);

    if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ Videos API: S3 not configured', {
        hasBucket: !!BUCKET_NAME,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });
      // Return empty array instead of error to allow fallback to config videos
      return NextResponse.json(
        {
          status: 'success',
          message: 'S3 not configured. Using fallback videos.',
          data: [],
        },
        { status: 200 }
      );
    }

    console.log('✅ Videos API: S3 configured, fetching videos from bucket:', BUCKET_NAME);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'newest';

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Limit must be between 1 and 100',
          errors: ['INVALID_LIMIT'],
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Offset must be a non-negative integer',
          errors: ['INVALID_OFFSET'],
        },
        { status: 400 }
      );
    }

    if (!['newest', 'oldest', 'title'].includes(sort)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Sort must be one of: newest, oldest, title',
          errors: ['INVALID_SORT'],
        },
        { status: 400 }
      );
    }

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(listCommand);
    console.log('📦 Videos API: S3 response received', {
      totalObjects: response.Contents?.length || 0,
    });

    if (!response.Contents || response.Contents.length === 0) {
      console.log('⚠️ Videos API: No objects found in S3 bucket');
      return NextResponse.json(
        {
          status: 'success',
          message: 'No videos found',
          data: [],
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            ETag: '"videos-empty"',
          },
        }
      );
    }

    const videoObjects = response.Contents.filter((obj) => obj.Key && isVideoFile(obj.Key));
    console.log('🎬 Videos API: Found video files', {
      totalVideos: videoObjects.length,
      videoKeys: videoObjects.map(v => v.Key),
    });

    if (videoObjects.length === 0) {
      console.log('⚠️ Videos API: No video files found in S3 bucket');
      return NextResponse.json(
        {
          status: 'success',
          message: 'No videos found',
          data: [],
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            ETag: '"videos-empty"',
          },
        }
      );
    }

    const usePresignedUrls = process.env.USE_PRESIGNED_URLS === 'true';

    const videos = await Promise.all(
      videoObjects.map(async (videoObj, index) => {
        const metadata = extractVideoMetadata(videoObj.Key!);
        const thumbnailKey = findThumbnail(videoObj.Key!, response.Contents || []);
        const videoUrl = await getVideoUrl(videoObj.Key!, usePresignedUrls);
        let thumbnailUrl = null;
        if (thumbnailKey) {
          thumbnailUrl = await getVideoUrl(thumbnailKey, usePresignedUrls);
        }

        return {
          id: (index + 1).toString(),
          title: escapeString(metadata.title),
          url: videoUrl,
          thumbnail: thumbnailUrl || undefined,
          duration: undefined,
          createdAt: videoObj.LastModified ? videoObj.LastModified.toISOString() : undefined,
        };
      })
    );

    if (sort === 'newest') {
      videos.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sort === 'oldest') {
      videos.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } else if (sort === 'title') {
      videos.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }

    const totalVideos = videos.length;
    const paginatedVideos = videos.slice(offset, offset + limit);
    
    console.log('✅ Videos API: Returning videos', {
      total: totalVideos,
      returned: paginatedVideos.length,
      videoUrls: paginatedVideos.map(v => v.url),
    });

    return NextResponse.json(
      {
        status: 'success',
        message: 'Videos retrieved successfully',
        data: paginatedVideos,
        meta: {
          total: totalVideos,
          limit: limit,
          offset: offset,
          returned: paginatedVideos.length,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
          ETag: `"videos-${totalVideos}-${offset}-${limit}"`,
          Vary: 'Accept, Accept-Encoding',
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching videos from S3:', errorMessage);

    if (error instanceof Error && error.name === 'NoSuchBucket') {
      return NextResponse.json(
        {
          status: 'error',
          message: 'S3 bucket not found',
          errors: [`Bucket "${BUCKET_NAME}" does not exist`],
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch')) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid AWS credentials',
          errors: ['AWS credentials are invalid or not configured correctly'],
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred while fetching videos. Please try again.',
        errors: ['INTERNAL_SERVER_ERROR'],
      },
      { status: 500 }
    );
  }
}

