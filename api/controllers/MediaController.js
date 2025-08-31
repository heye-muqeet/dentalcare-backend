/**
 * MediaController
 *
 * @description :: Server-side actions for handling media uploads and management
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
  /**
   * Upload media file
   * POST /api/media/upload
   */
  upload: async function (req, res) {
    try {
      // Check if file was uploaded
      if (!req.file('file')) {
        return res.badRequest('No file uploaded');
      }

      const uploadedFile = req.file('file');
      
      // Upload to Cloudinary
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      // Upload file to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'dental-care',
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadedFile.upload({
          maxBytes: 10000000 // 10MB limit
        }, (err, uploadedFiles) => {
          if (err) {
            return reject(err);
          }
          
          if (uploadedFiles.length === 0) {
            return reject(new Error('No file was uploaded'));
          }

          // Create readable stream and pipe to Cloudinary
          const fs = require('fs');
          const fileStream = fs.createReadStream(uploadedFiles[0].fd);
          fileStream.pipe(uploadStream);

          // Clean up temporary file
          fs.unlink(uploadedFiles[0].fd, (err) => {
            if (err) sails.log.error('Error deleting temporary file:', err);
          });
        });
      });

      // Create media record in database
      const mediaRecord = await Media.create({
        originalName: uploadedFile._files[0].stream.filename,
        fileName: result.public_id,
        fileUrl: result.secure_url,
        fileType: result.format,
        fileSize: result.bytes,
        uploadedBy: req.user ? req.user.id : null
      }).fetch();

      return res.ok({
        message: 'File uploaded successfully',
        media: mediaRecord
      });

    } catch (error) {
      sails.log.error('Media upload error:', error);
      return res.serverError('Error uploading file');
    }
  },

  /**
   * Get media by ID
   * GET /api/media/:id
   */
  findOne: async function (req, res) {
    try {
      const mediaId = req.param('id');
      
      const media = await Media.findOne({ id: mediaId });
      
      if (!media) {
        return res.notFound('Media not found');
      }

      return res.ok(media);

    } catch (error) {
      sails.log.error('Media findOne error:', error);
      return res.serverError('Error retrieving media');
    }
  }

};
