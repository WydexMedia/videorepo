# Video Loading Debugging Guide

## How to Debug Video Loading Issues

### Step 1: Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab. Look for:
- 🎬 Video fetching logs
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warning messages

### Step 2: Check Network Tab
1. Open Developer Tools → Network tab
2. Filter by "Fetch/XHR" or "Media"
3. Look for:
   - `/api/videos` request - Check if it returns 200 status
   - Video file requests - Check if they return 200 or CORS errors

### Step 3: Common Issues and Solutions

#### Issue 1: "S3 not configured" in console
**Solution:** Add AWS credentials to `.env.local`:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=proskillvideocourse
```

#### Issue 2: CORS Error in Network Tab
**Symptoms:** 
- Network tab shows CORS error (red)
- Console shows "Network error - Check CORS settings"

**Solution:** Configure CORS on your S3 bucket:
1. Go to AWS S3 Console
2. Select your bucket → Permissions → CORS
3. Add this configuration:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

#### Issue 3: Video URLs are invalid
**Check:** In console, look for "VideoCard: URL changed to:" logs
- If URL contains "your-bucket", update `src/config/videos.ts`
- If URL is empty, check API response

#### Issue 4: Videos API returns empty array
**Check console for:**
- "S3 not configured" → Add AWS credentials
- "No video files found" → Check S3 bucket has video files
- "No objects found" → Check bucket name is correct

### Step 4: Test Video URL Directly
1. Copy the video URL from console logs
2. Paste in browser address bar
3. If it downloads/plays → URL is valid, issue is with player
4. If it shows error → URL is invalid or CORS issue

### Step 5: Check Video Format
Supported formats: mp4, avi, mov, wmv, flv, webm, mkv, m4v
- Check file extension in S3
- Try converting to MP4 if needed

### Step 6: Verify Environment Variables
Check `.env.local` has:
```env
MONGODB_URI=...
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=proskillvideocourse
```

### Quick Test Commands

1. **Test API endpoint:**
```bash
curl http://localhost:3000/api/videos
```

2. **Test video URL directly:**
```bash
curl -I "https://proskillvideocourse.s3.ap-south-1.amazonaws.com/THEORY PART  (2)-003.mp4"
```

3. **Check if video is accessible:**
Open video URL directly in browser - should download or play

### Debug Checklist
- [ ] Console shows video fetching logs
- [ ] Network tab shows `/api/videos` request succeeds
- [ ] Video URLs are valid (not "your-bucket")
- [ ] S3 bucket CORS is configured
- [ ] AWS credentials are set in `.env.local`
- [ ] Video files exist in S3 bucket
- [ ] Video format is supported (MP4 recommended)
- [ ] No CORS errors in Network tab

