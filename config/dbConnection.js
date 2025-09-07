import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.LOCAL_DB_CONNECTION);
    console.log('🛢️  Database is connected!');
  } catch (error) {
    console.log('MONGODB connection FAILED:', error.message);
    // throw error; 
  }
};

export default connectDB;
