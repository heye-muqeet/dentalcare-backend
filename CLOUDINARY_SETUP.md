# Cloudinary Media Upload Setup

This document explains how to use the Cloudinary media upload service in the Dental Care backend.

## Features

- **Image Upload**: Support for JPG, JPEG, PNG, GIF, WebP formats
- **Document Upload**: Support for PDF, DOC, DOCX, TXT files
- **Automatic Optimization**: Images are automatically optimized for web
- **Secure Storage**: Files are stored securely on Cloudinary
- **File Management**: Delete and retrieve file information
- **Profile Images**: Integrated with user profile management

## API Endpoints

### Image Upload
```
POST /upload/image
Content-Type: multipart/form-data

Body:
- file: (required) Image file
- folder: (optional) Cloudinary folder name (default: 'dental-care')
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "public_id": "dental-care/abc123",
    "secure_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/dental-care/abc123.jpg",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "bytes": 45678
  }
}
```

### Document Upload
```
POST /upload/document
Content-Type: multipart/form-data

Body:
- file: (required) Document file
- folder: (optional) Cloudinary folder name (default: 'dental-care/documents')
```

### Delete File
```
DELETE /upload/:publicId
```

### Get File Info
```
GET /upload/:publicId
```

## File Size Limits

- **Images**: 5MB maximum
- **Documents**: 10MB maximum

## Supported File Types

### Images
- JPG/JPEG
- PNG
- GIF
- WebP

### Documents
- PDF
- DOC
- DOCX
- TXT

## Usage Examples

### Upload Profile Image
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('folder', 'dental-care/profile-images');

const response = await fetch('/upload/image', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Use result.data.secure_url as the profile image URL
```

### Upload Document
```javascript
const formData = new FormData();
formData.append('file', documentFile);
formData.append('folder', 'dental-care/patient-documents');

const response = await fetch('/upload/document', {
  method: 'POST',
  body: formData
});
```

### Delete File
```javascript
const response = await fetch(`/upload/${publicId}`, {
  method: 'DELETE'
});
```

## Integration with User Profiles

The user schema now includes:
- `profileImage`: URL of the profile image
- `profileImagePublicId`: Cloudinary public ID for deletion

### Update User Profile Image
```javascript
// First upload the image
const uploadResponse = await uploadImage(imageFile, 'dental-care/profile-images');

// Then update the user
const userResponse = await fetch(`/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileImage: uploadResponse.data.secure_url,
    profileImagePublicId: uploadResponse.data.public_id
  })
});
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid file type, size exceeded, etc.)
- `404`: File not found (for delete/get operations)

## Security Features

- File type validation
- File size limits
- Secure Cloudinary storage
- Temporary file cleanup
- CORS protection

## Environment Variables

Make sure these are set in your `.env` file:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Cloudinary Dashboard

You can manage your uploaded files through the Cloudinary dashboard:
- View all uploaded files
- Monitor storage usage
- Configure transformations
- Set up delivery optimizations
