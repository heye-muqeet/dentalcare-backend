module.exports = {
  attributes: {
    invoiceNumber: {
      type: 'string',
      required: true,
      unique: true,
    },
    date: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
    },
    dueDate: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
    },
    subtotal: {
      type: 'number',
      required: true,
    },
    tax: {
      type: 'number',
      required: true,
    },
    total: {
      type: 'number',
      required: true,
    },
    status: {
      type: 'string',
      isIn: ['due', 'paid', 'overdue'],
      defaultsTo: 'due',
    },
    notes: {
      type: 'string',
      defaultsTo: '',
    },
    services: {
      type: 'json',
    },
    // Organization and Location references
    organization: {
      model: 'organization',
      required: true,
    },
    location: {
      model: 'location',
      required: true,
    },
    // Associations
    patient: {
      model: 'patient',
      required: true,
    },
    treatment: {
      model: 'treatment',
      required: true,
    },
    // payments: {
    //   collection: 'payment',
    //   via: 'invoiceId',
    // },
  },

  // Lifecycle callbacks
  beforeCreate: async function(values, proceed) {
    // Generate invoice number if not provided
    if (!values.invoiceNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const count = await Invoice.count();
      values.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    return proceed();
  },

  // afterUpdate: async function(updatedRecord, proceed) {
  //   // Update patient balance when payment status changes
  //   if (updatedRecord.balanceDue !== undefined) {
  //     await Patient.updateOne({ id: updatedRecord.patientId })
  //       .set({ balance: updatedRecord.balanceDue });
  //   }
  //   return proceed();
  // },
}; 