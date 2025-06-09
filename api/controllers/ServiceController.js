module.exports = {
    /**
     * `ServiceController.create()`
     */
    create: async function (req, res) {
        try {
            const {
                name,
                price,
                description,
                features,
            } = req.body;

            const newService = await Service.create({
                name,
                price,
                description,
                features,
                location: req.user.location,
                organization: req.user.organization,
            }).fetch();

            return res.status(201).json({
                status: 'success',
                message: 'Service created successfully',
                data: newService
            });
        } catch (err) {
            sails.log.error('Error creating service:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ServiceController.find()`
     */
    find: async function (req, res) {
        try {
            if (!req.user || !req.user.location) {
                return res.status(400).json({ error: 'User location is not available to filter services.' });
            }
            const findCriteria = {
                location: req.user.location,
                deletedAt: 0,
            };
            const services = await Service.find(findCriteria);
            return res.json({
                status: 'success',
                data: services
            });
        } catch (err) {
            sails.log.error('Error fetching services:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ServiceController.findOne()`
     */
    findOne: async function (req, res) {
        try {
            const { id } = req.params;
            const service = await Service.findOne({
                id,
                location: req.user.location,
                deletedAt: 0
            });

            if (!service) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            return res.json({
                status: 'success',
                data: service
            });
        } catch (err) {
            sails.log.error('Error fetching service:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ServiceController.update()`
     */
    update: async function (req, res) {
        try {
            const { id } = req.params;
            const service = await Service.findOne({
                id,
                location: req.user.location,
                deletedAt: 0
            });

            if (!service) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }
            const {
                name,
                price,
                description,
                features,
            } = req.body;

            const updatedService = await Service.updateOne({ id })
                .set({
                    name,
                    price,
                    description,
                    features,
                });

            return res.json({
                status: 'success',
                data: updatedService
            });
        } catch (err) {
            sails.log.error('Error updating service:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ServiceController.delete()`
     */
    delete: async function (req, res) {
        try {
            const { id } = req.params;
            const service = await Service.findOne({
                id,
                location: req.user.location,
                deletedAt: 0
            });

            if (!service) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            // Soft delete by setting deletedAt timestamp
            await Service.updateOne({ id }).set({
                deletedAt: Date.now()
            });

            return res.json({
                status: 'success',
                message: 'Service deleted successfully'
            });
        } catch (err) {
            sails.log.error('Error deleting service:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    }
}; 