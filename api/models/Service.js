module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    price: {
      type: 'number',
      required: true,
    },
    description: {
      type: 'string',
      allowNull: true,
    },
    features: {
      type: 'json', // Stores an array of strings
      columnType: 'array',
      defaultsTo: [],
    },
    // Association to Location model (assuming you have a Location model)
    location: {
      model: 'location', // This should match the identity of your Location model
      required: true, // Uncomment if a service must belong to a location
    },
    organization: {
      model: 'organization',
      required: true,
    },
    deletedAt: {
      type: 'number',
      defaultsTo: 0,
    },
  },

  // Custom methods if needed, e.g., for soft delete
  customToJSON: function() {
    // Exclude deletedAt from JSON responses by default, unless explicitly requested
    return _.omit(this, ['deletedAt']);
  },
}; 