const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
  // Create a new report
  create: async function(req, res) {
    try {
      const {
        patient,
        doctor,
        treatment,
        appointment,
        reportType,
        title,
        description,
        findings,
        recommendations,
        isPrivate,
      } = req.body;

      // Handle file uploads
      const mediaUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `dental-clinic/reports/${patient}`,
            resource_type: 'auto',
          });

          mediaUrls.push({
            url: result.secure_url,
            type: result.resource_type,
            format: result.format,
            publicId: result.public_id,
            thumbnailUrl: result.secure_url.replace('/upload/', '/upload/c_thumb,w_200,g_face/'),
          });

          // Clean up temporary file
          fs.unlinkSync(file.path);
        }
      }

      // Create report
      const report = await Report.create({
        patient,
        doctor,
        treatment,
        appointment,
        reportType,
        title,
        description,
        findings,
        recommendations,
        isPrivate,
        mediaUrls,
        organization: req.user.organization,
        location: req.user.location
      }).fetch();

      return res.status(201).json({
        status: 'success',
        message: 'Report created successfully',
        data: report
      });
    } catch (err) {
      sails.log.error('Error creating report:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get reports for a patient
  getPatientReports: async function(req, res) {
    try {
      const { patient } = req.params;
      const reports = await Report.find({
        where: { 
          patient,
          location: req.user.location, 
          deletedAt: 0 
        },
        sort: 'date DESC',
      });

      return res.json({
        status: 'success',
        data: reports
      });
    } catch (err) {
      sails.log.error('Error fetching reports:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Get reports for a treatment
  getTreatmentReports: async function(req, res) {
    try {
      const { treatment } = req.params;
      const reports = await Report.find({
        where: { 
          treatment,
          location: req.user.location,
          deletedAt: 0
        },
        sort: 'date DESC',
      });

      return res.json({
        status: 'success',
        data: reports
      });
    } catch (err) {
      sails.log.error('Error fetching reports:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Update a report
  update: async function(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Find the report to ensure it belongs to the user's location
      const report = await Report.findOne({
        id,
        location: req.user.location,
        deletedAt: 0
      });

      if (!report) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Handle new file uploads
      if (req.files && req.files.length > 0) {
        const mediaUrls = [];
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `dental-clinic/reports/${updateData.patient || report.patient}`,
            resource_type: 'auto',
          });

          mediaUrls.push({
            url: result.secure_url,
            type: result.resource_type,
            format: result.format,
            publicId: result.public_id,
            thumbnailUrl: result.secure_url.replace('/upload/', '/upload/c_thumb,w_200,g_face/'),
          });

          // Clean up temporary file
          fs.unlinkSync(file.path);
        }

        // Merge new media URLs with existing ones
        updateData.mediaUrls = [...(report.mediaUrls || []), ...mediaUrls];
      }

      const updatedReport = await Report.updateOne({ id }).set(updateData);
      
      return res.json({
        status: 'success',
        message: 'Report updated successfully',
        data: updatedReport
      });
    } catch (err) {
      sails.log.error('Error updating report:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },

  // Delete a report and its associated media
  destroy: async function(req, res) {
    try {
      const { id } = req.params;
      const report = await Report.findOne({ 
        id,
        location: req.user.location,
        deletedAt: 0 
      });

      if (!report) {
        return res.status(404).json({ 
          status: 'error',
          error: sails.config.responses.GENERIC.NOT_FOUND 
        });
      }

      // Delete media files from Cloudinary
      if (report.mediaUrls && report.mediaUrls.length > 0) {
        for (const media of report.mediaUrls) {
          await cloudinary.uploader.destroy(media.publicId);
        }
      }

      // Soft delete by setting deletedAt timestamp
      await Report.updateOne({ id }).set({
        deletedAt: Date.now()
      });

      return res.json({ 
        status: 'success',
        message: 'Report deleted successfully' 
      });
    } catch (err) {
      sails.log.error('Error deleting report:', err);
      return res.status(500).json({ 
        status: 'error',
        error: sails.config.responses.GENERIC.SERVER_ERROR 
      });
    }
  },
}; 