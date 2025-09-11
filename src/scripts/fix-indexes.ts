import { connect, connection } from 'mongoose';

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    // Use the same connection string from your environment variables or a default
    const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/dental_care';
    console.log('Using database URL:', dbUrl);
    await connect(dbUrl);
    
    console.log('Successfully connected to MongoDB');
    
    // Get the users collection
    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const usersCollection = db.collection('users');
    
    console.log('Dropping old email unique index...');
    try {
      // Drop the existing unique index on email
      await usersCollection.dropIndex('email_1');
      console.log('Successfully dropped old email index');
    } catch (err) {
      console.log('Error dropping index (it may not exist):', err.message);
    }
    
    console.log('Creating new compound index on email+organization+role...');
    // Create the new compound index
    await usersCollection.createIndex(
      { email: 1, organization: 1, role: 1 },
      { unique: true }
    );
    
    console.log('Successfully created new compound index');
    console.log('Index fix completed successfully');
    
    await connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
