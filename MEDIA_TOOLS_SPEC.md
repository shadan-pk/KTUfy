# KTUfy — Media Tools API Specification
> **For:** Backend server / agentic AI  
> **Generated:** 2026-03-01  
> **Status:** ⚠️ Frontend UI complete — backend endpoints NOT yet implemented

---

## Overview

The **Media Tools** section of KTUfy lets students process files directly from their phone.
The frontend screens for all four categories (Video, Audio, Image, PDF) are **fully built**, but every
"Process" button currently shows a placeholder alert because the backend endpoints are missing.

All processing is **multipart file upload** → backend processes with FFmpeg / Pillow / PyMuPDF →
returns a downloadable file URL or binary stream.

### Auth
All media endpoints require the standard JWT:
```
Authorization: Bearer <supabase_access_token>
```

### Error response format
```json
{ "detail": "Human-readable error message" }
```

### File upload pattern
All endpoints accept `multipart/form-data`. Extra parameters (format, quality, etc.) are sent
as additional form fields alongside the file(s).

### Response pattern
Every processing endpoint returns either:
- A direct file download (`Content-Disposition: attachment; filename="result.mp4"`)
- OR a JSON with a download URL: `{ "download_url": "https://..." }`

The frontend will handle either — pick whichever is easier to implement on the backend.

---

## 1. 🎬 Video Tools  (`/api/v1/media/video/`)

Screen: `VideoToolsScreen.tsx`  
Accent colour: `#EF4444`

### 1.1 Convert Video
```
POST /api/v1/media/video/convert
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Video file to convert |
| `output_format` | string | ✅ | `mp4` \| `mkv` \| `avi` \| `mov` \| `webm` \| `flv` |
| `quality` | string | optional | `original` \| `1080p` \| `720p` \| `480p` \| `360p` — default `original` |

**Response:** Converted video file (download)

**Implementation hint:** FFmpeg
```bash
ffmpeg -i input.{ext} -vf scale={width}:{height} output.{output_format}
```

---

### 1.2 Extract Audio from Video
```
POST /api/v1/media/video/extract-audio
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Video file |
| `output_format` | string | ✅ | `mp3` \| `aac` \| `wav` \| `ogg` \| `flac` |

**Response:** Extracted audio file (download)

**Implementation hint:**
```bash
ffmpeg -i input.mp4 -vn -acodec {codec} output.{format}
```

---

### 1.3 Video to GIF
```
POST /api/v1/media/video/to-gif
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Video file |
| `fps` | integer | optional | `5` \| `10` \| `15` \| `24` — default `10` |

**Response:** GIF file (download)

**Implementation hint:**
```bash
ffmpeg -i input.mp4 -vf "fps={fps},scale=480:-1:flags=lanczos" output.gif
```

---

### 1.4 Compress Video
```
POST /api/v1/media/video/compress
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Video file |
| `quality` | string | ✅ | `1080p` \| `720p` \| `480p` \| `360p` |

**Response:** Compressed video file (download)

**Implementation hint:**
```bash
ffmpeg -i input.mp4 -vf scale={width}:{height} -crf 23 output.mp4
```

---

## 2. 🎵 Audio Tools  (`/api/v1/media/audio/`)

Screen: `AudioToolsScreen.tsx`  
Accent colour: `#8B5CF6`

### 2.1 Convert Audio
```
POST /api/v1/media/audio/convert
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Audio file |
| `output_format` | string | ✅ | `mp3` \| `aac` \| `wav` \| `ogg` \| `flac` \| `m4a` |
| `quality` | string | optional | `64k` \| `128k` \| `192k` \| `320k` — default `192k` |

**Response:** Converted audio file (download)

---

### 2.2 Trim Audio
```
POST /api/v1/media/audio/trim
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Audio file |
| `start` | string | ✅ | Start time — `mm:ss` or seconds, e.g. `"00:30"` or `"30"` |
| `end` | string | ✅ | End time — `mm:ss` or seconds |
| `output_format` | string | optional | Output format — defaults to same as input |

**Response:** Trimmed audio file (download)

**Implementation hint:**
```bash
ffmpeg -i input.mp3 -ss {start} -to {end} -c copy output.mp3
```

---

### 2.3 Merge Audio Files
```
POST /api/v1/media/audio/merge
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | File[] | ✅ | Multiple audio files (order = merge order) |
| `output_format` | string | optional | Output format — default `mp3` |

**Response:** Merged audio file (download)

**Implementation hint:**
```bash
# create a file list for FFmpeg
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp3
```

---

### 2.4 Normalize Audio
```
POST /api/v1/media/audio/normalize
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Audio file |
| `output_format` | string | optional | Output format — defaults to same as input |

**Response:** Normalized audio file (download)

**Implementation hint:** Use `ffmpeg-normalize` or:
```bash
ffmpeg -i input.mp3 -af loudnorm output.mp3
```

---

## 3. 🖼️ Image Tools  (`/api/v1/media/image/`)

Screen: `ImageToolsScreen.tsx`  
Accent colour: `#F59E0B`

### 3.1 Convert Image
```
POST /api/v1/media/image/convert
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Image file |
| `output_format` | string | ✅ | `jpg` \| `png` \| `webp` \| `avif` \| `gif` \| `bmp` |

**Response:** Converted image file (download)

**Implementation hint:** Pillow / ImageMagick
```python
from PIL import Image
img = Image.open(input_file)
img.save(output_path, format=output_format.upper())
```

---

### 3.2 Compress Image
```
POST /api/v1/media/image/compress
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Image file |
| `quality` | integer | optional | `50`–`100` — default `80` |
| `output_format` | string | optional | Output format — defaults to same as input |

**Response:** Compressed image file (download)

---

### 3.3 Resize Image
```
POST /api/v1/media/image/resize
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | Image file |
| `width` | integer | ✅ | Target width in pixels |
| `height` | integer | ✅ | Target height in pixels |
| `output_format` | string | optional | Output format — defaults to same as input |

**Response:** Resized image file (download)

**Preset resolutions the frontend uses:**

| Label | Width | Height |
|-------|-------|--------|
| HD | 1280 | 720 |
| FHD | 1920 | 1080 |
| 4K | 3840 | 2160 |
| Square | 1080 | 1080 |

---

## 4. 📄 PDF Tools  (`/api/v1/media/pdf/`)

Screen: `PdfToolsScreen.tsx`  
Accent colour: `#10B981`

### 4.1 Merge PDFs
```
POST /api/v1/media/pdf/merge
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | File[] | ✅ | Multiple PDF files — merged in order provided |

**Response:** Merged PDF file (download)

**Implementation hint:** PyMuPDF or PyPDF2
```python
import fitz  # PyMuPDF
result = fitz.open()
for pdf in files:
    result.insert_pdf(fitz.open(pdf))
result.save("merged.pdf")
```

---

### 4.2 Split PDF
```
POST /api/v1/media/pdf/split
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | PDF file to split |
| `ranges` | string | ✅ | Page ranges, e.g. `"1-3,4-7,8-end"` |

**Response:** ZIP archive containing the split PDF files (download)

---

### 4.3 Compress PDF
```
POST /api/v1/media/pdf/compress
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | PDF file to compress |
| `quality` | string | optional | `screen` (72 dpi) \| `print` (150 dpi) \| `high` (300 dpi) \| `max` — default `print` |

**Response:** Compressed PDF file (download)

**Implementation hint:** Ghostscript
```bash
gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/{quality} -sOutputFile=output.pdf input.pdf
```
Where `{quality}` maps: `screen` → `screen`, `print` → `printer`, `high` → `prepress`, `max` → `default`

---

### 4.4 Images to PDF
```
POST /api/v1/media/pdf/images-to-pdf
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | File[] | ✅ | Image files (JPG, PNG, WEBP) — page order = file order |

**Response:** Combined PDF file (download)

**Implementation hint:**
```python
images = [Image.open(f).convert('RGB') for f in files]
images[0].save("output.pdf", save_all=True, append_images=images[1:])
```

---

### 4.5 PDF to Images
```
POST /api/v1/media/pdf/pdf-to-images
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | ✅ | PDF file |
| `output_format` | string | optional | `jpg` \| `png` \| `webp` — default `jpg` |
| `quality` | string | optional | `screen` (72 dpi) \| `print` (150 dpi) \| `high` (300 dpi) — default `print` |

**Response:** ZIP archive containing one image per PDF page (download)

**Implementation hint:**
```python
doc = fitz.open("input.pdf")
for page_num, page in enumerate(doc):
    pix = page.get_pixmap(dpi=dpi)
    pix.save(f"page_{page_num+1}.{format}")
```

---

## 5. Priority & Dependencies

Backend library stack recommendation:
- **Video / Audio:** FFmpeg (required for all video/audio ops)
- **Image:** Pillow (`pip install Pillow`) or ImageMagick
- **PDF:** PyMuPDF (`pip install pymupdf`) + Ghostscript for compression

### Implementation order (fastest value to users)

```
1. POST /api/v1/media/image/convert       ← simplest, no FFmpeg needed
2. POST /api/v1/media/image/compress      ← Pillow only
3. POST /api/v1/media/image/resize        ← Pillow only
4. POST /api/v1/media/pdf/merge           ← PyMuPDF only
5. POST /api/v1/media/pdf/images-to-pdf   ← Pillow only
6. POST /api/v1/media/pdf/pdf-to-images   ← PyMuPDF only
7. POST /api/v1/media/pdf/compress        ← needs Ghostscript
8. POST /api/v1/media/pdf/split           ← PyMuPDF only
9. POST /api/v1/media/video/convert       ← FFmpeg
10. POST /api/v1/media/video/extract-audio ← FFmpeg
11. POST /api/v1/media/video/to-gif        ← FFmpeg
12. POST /api/v1/media/video/compress      ← FFmpeg
13. POST /api/v1/media/audio/convert       ← FFmpeg
14. POST /api/v1/media/audio/trim          ← FFmpeg
15. POST /api/v1/media/audio/merge         ← FFmpeg
16. POST /api/v1/media/audio/normalize     ← FFmpeg + ffmpeg-normalize
```

---

## 6. Notes for Backend Implementation

- **File size limits:** Consider setting a max upload size (e.g. 200 MB for videos, 50 MB for audio, 20 MB for images/PDFs). Return `HTTP 413` with `{ "detail": "File too large. Max size: 200MB." }`.
- **Processing time:** Video/audio jobs may take >8 seconds (frontend timeout). Consider an async job pattern: return a `job_id`, then poll `GET /api/v1/media/jobs/{job_id}`.
- **Cleanup:** Delete temp files after serving. Don't store processed files permanently unless explicitly needed.
- **CORS:** Ensure `multipart/form-data` uploads are allowed in your FastAPI CORS config.

---

*This file was auto-generated from the KTUfy frontend codebase on 2026-03-01.*  
*Source of truth: `screens/VideoToolsScreen.tsx`, `AudioToolsScreen.tsx`, `ImageToolsScreen.tsx`, `PdfToolsScreen.tsx`.*
