/**
 * PaymentController
 *
 * @description :: Server-side actions for handling payments
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
  /**
   * Create a new payment
   * POST /api/payments
   */
  create: async function (req, res) {
    try {
      const paymentData = req.body;
      
      // Validate required fields
      if (!paymentData.invoiceId || !paymentData.amount || !paymentData.paymentMethod) {
        return res.badRequest('Missing required fields: invoiceId, amount, paymentMethod');
      }

      // Check if invoice exists
      const invoice = await Invoice.findOne({ id: paymentData.invoiceId });
      if (!invoice) {
        return res.notFound('Invoice not found');
      }

      // Create payment record
      const payment = await Payment.create({
        invoice: paymentData.invoiceId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: new Date(),
        status: 'completed',
        notes: paymentData.notes || '',
        processedBy: req.user ? req.user.id : null
      }).fetch();

      // Update invoice status if payment covers full amount
      if (payment.amount >= invoice.totalAmount) {
        await Invoice.update({ id: paymentData.invoiceId }, { status: 'paid' });
      }

      return res.ok({
        message: 'Payment created successfully',
        payment: payment
      });

    } catch (error) {
      sails.log.error('Payment creation error:', error);
      return res.serverError('Error creating payment');
    }
  },

  /**
   * Get all payments
   * GET /api/payments
   */
  find: async function (req, res) {
    try {
      const payments = await Payment.find()
        .populate('invoice')
        .populate('processedBy')
        .sort('paymentDate DESC');

      return res.ok(payments);

    } catch (error) {
      sails.log.error('Payment find error:', error);
      return res.serverError('Error retrieving payments');
    }
  },

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  findOne: async function (req, res) {
    try {
      const paymentId = req.param('id');
      
      const payment = await Payment.findOne({ id: paymentId })
        .populate('invoice')
        .populate('processedBy');
      
      if (!payment) {
        return res.notFound('Payment not found');
      }

      return res.ok(payment);

    } catch (error) {
      sails.log.error('Payment findOne error:', error);
      return res.serverError('Error retrieving payment');
    }
  },

  /**
   * Update payment
   * PUT /api/payments/:id
   */
  update: async function (req, res) {
    try {
      const paymentId = req.param('id');
      const updateData = req.body;
      
      const payment = await Payment.update({ id: paymentId }, updateData).fetch();
      
      if (!payment || payment.length === 0) {
        return res.notFound('Payment not found');
      }

      return res.ok({
        message: 'Payment updated successfully',
        payment: payment[0]
      });

    } catch (error) {
      sails.log.error('Payment update error:', error);
      return res.serverError('Error updating payment');
    }
  },

  /**
   * Delete payment
   * DELETE /api/payments/:id
   */
  destroy: async function (req, res) {
    try {
      const paymentId = req.param('id');
      
      const payment = await Payment.destroy({ id: paymentId }).fetch();
      
      if (!payment || payment.length === 0) {
        return res.notFound('Payment not found');
      }

      return res.ok({
        message: 'Payment deleted successfully',
        payment: payment[0]
      });

    } catch (error) {
      sails.log.error('Payment destroy error:', error);
      return res.serverError('Error deleting payment');
    }
  }

};
