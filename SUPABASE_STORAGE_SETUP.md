# Supabase Storage Setup Guide for KTUfy Library

This guide explains how to set up and configure Supabase Storage for the Library feature in KTUfy.

## 📦 Bucket Configuration

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **bojrxrzwcuzduilfwyqp**
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `notes`
   - **Public bucket**: ✅ **Enable** (so users can download files)
   - **File size limit**: Set according to your needs (e.g., 50MB)
   - **Allowed MIME types**: Leave empty or specify:
     - `application/pdf`
     - `image/*`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-powerpoint`
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### 2. Set Up Storage Policies

The bucket needs proper Row Level Security (RLS) policies to allow users to:
- **Read**: Anyone can view/download files
- **Upload**: Authenticated users can upload files
- **Delete**: Only admins or file owners can delete

Go to **Storage > Policies** and add these policies for the `notes` bucket:

#### Policy 1: Public Read Access (Download)
```sql
CREATE POLICY "Public can view/download notes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'notes');
```

#### Policy 2: Authenticated Upload Access
```sql
CREATE POLICY "Authenticated users can upload notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notes' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Users can update their own files
```sql
CREATE POLICY "Users can update their own notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notes' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'notes'
  AND auth.uid() = owner
);
```

#### Policy 4: Users can delete their own files
```sql
CREATE POLICY "Users can delete their own notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notes'
  AND auth.uid() = owner
);
```

## 📁 Folder Structure

The app organizes files in this structure:

```
notes/
├── Year_1/
│   ├── Sem_1/
│   │   ├── CSE/
│   │   │   ├── Subject_Name/
│   │   │   │   ├── file1.pdf
│   │   │   │   └── file2.pdf
│   │   ├── ECE/
│   │   └── ...
│   └── Sem_2/
├── Year_2/
├── Year_3/
└── Year_4/
```

Example path: `Year_2/Sem_3/CSE/Data Structures/notes.pdf`

## 🔒 Security Considerations

### Current Setup (Public Bucket)
- ✅ Anyone can download files (good for educational content)
- ✅ Authenticated users can upload
- ❌ Anyone could potentially see all file URLs

### Recommended for Production

If you want to restrict downloads to authenticated users only:

1. **Make bucket private** (uncheck "Public bucket")
2. **Update Read Policy**:
```sql
CREATE POLICY "Authenticated users can download notes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notes'
  AND auth.role() = 'authenticated'
);
```

3. **Update app code** to use signed URLs:
```typescript
// In supabaseStorage.ts
export async function getSignedUrl(filePath: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}
```

## 🚀 Testing the Setup

### Test File Upload

1. **Run the app**: `npm run web` or `npm run android`
2. **Login** with a user account
3. **Navigate**: Library → Notes
4. **Select**: Year → Semester → Branch → Subject
5. **Click**: "📤 Upload" button
6. **Choose**: A PDF or image file
7. **Verify**: File appears in the list

### Test File Download

1. **Click** on any uploaded file
2. **Choose**: "View" or "Download"
3. **Verify**: File opens or downloads

### Verify in Supabase Dashboard

1. Go to **Storage > notes bucket**
2. Browse the folder structure
3. Verify files are uploaded correctly

## 📤 Manual File Upload (For Initial Setup)

If you want to pre-populate the storage with files:

### Option 1: Dashboard Upload
1. Go to **Storage > notes**
2. Click folder path (e.g., `Year_1/Sem_1/CSE/Subject_Name/`)
3. Click **"Upload file"**
4. Select files from your computer

### Option 2: Programmatic Upload
```typescript
import { uploadFile } from './supabaseStorage';

// Upload a file
const file = /* your file blob */;
await uploadFile('Year_1/Sem_1/CSE/Data_Structures/notes.pdf', file, {
  contentType: 'application/pdf'
});
```

### Option 3: Bulk Upload Script
Create a script to upload multiple files:

```typescript
// scripts/uploadNotes.ts
import { supabase } from '../supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

async function bulkUpload(localFolder: string, remotePath: string) {
  const files = fs.readdirSync(localFolder);
  
  for (const file of files) {
    const filePath = path.join(localFolder, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    await supabase.storage
      .from('notes')
      .upload(`${remotePath}/${file}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    console.log(`✅ Uploaded: ${file}`);
  }
}

// Usage
bulkUpload('./local-notes/CSE-S3', 'Year_2/Sem_3/CSE/Data_Structures');
```

## 🔍 Troubleshooting

### Issue: "Failed to load notes from storage"
- **Check**: Bucket name is `notes` in `supabaseStorage.ts`
- **Verify**: Bucket exists in Supabase Dashboard
- **Check**: Storage policies are configured correctly

### Issue: "Upload Failed"
- **Check**: User is authenticated
- **Verify**: Upload policy exists for `authenticated` role
- **Check**: File size doesn't exceed bucket limit
- **Verify**: MIME type is allowed (if restricted)

### Issue: "Cannot open this file"
- **Check**: Bucket is public OR using signed URLs
- **Verify**: File path is correct
- **Check**: File actually exists in storage

### Issue: Files not showing in app
- **Check**: Folder path format matches: `Year_X/Sem_X/BRANCH/SUBJECT`
- **Verify**: Files aren't named `.emptyFolderPlaceholder`
- **Check**: Browser console for errors
- **Try**: Refresh the notes list

## 📊 Storage Limits & Pricing

- **Free tier**: 1 GB storage
- **Pro plan**: 100 GB storage
- **File size limit**: Configurable per bucket
- **Bandwidth**: Monitor in Dashboard > Settings > Usage

## 🎯 Next Steps

1. ✅ Create the `notes` bucket
2. ✅ Configure storage policies
3. ✅ Test upload from the app
4. ✅ Test download from the app
5. 📤 Upload initial content (optional)
6. 📱 Test on mobile devices
7. 🔒 Review security policies for production

## 📝 Notes

- The app automatically creates folder structure when uploading
- File names should be descriptive (e.g., "Chapter_1_Introduction.pdf")
- Consider adding file naming conventions for consistency
- Monitor storage usage in Supabase Dashboard
- Regularly backup important files

---

Need help? Check the Supabase Storage documentation: https://supabase.com/docs/guides/storage
