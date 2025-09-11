import { connect, connection } from 'mongoose';

async function fixPatientIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/dental_care';
    console.log('Using database URL:', dbUrl);
    await connect(dbUrl);
    
    console.log('Successfully connected to MongoDB');
    
    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const patientsCollection = db.collection('patients');
    
    console.log('Dropping old email unique index...');
    try {
      await patientsCollection.dropIndex('email_1');
      console.log('Successfully dropped old email index');
    } catch (err: any) {
      console.log('Error dropping index (it may not exist):', err.message);
    }
    
    console.log('Creating new compound index on email+organization...');
    await patientsCollection.createIndex(
      { email: 1, organization: 1 },
      { unique: true }
    );
    
    console.log('Successfully created new compound index');
    console.log('Patient index fix completed successfully');
    
    await connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error fixing patient indexes:', err);
    process.exit(1);
  }
}

fixPatientIndexes();
