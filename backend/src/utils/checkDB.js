const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const eventCount = await mongoose.connection.db.collection('events').countDocuments();
    console.log('Total Events:', eventCount);
    
    const metricCount = await mongoose.connection.db.collection('metrics').countDocuments();
    console.log('Total Metrics:', metricCount);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

checkDB();
