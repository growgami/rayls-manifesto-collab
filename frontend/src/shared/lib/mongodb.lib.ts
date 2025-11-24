import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Connection pool configuration for optimal performance under load
const options = {
  // Connection Pool Settings
  maxPoolSize: 10,              // Maximum number of connections in the pool
  minPoolSize: 2,               // Keep at least 2 connections alive
  maxIdleTimeMS: 60000,         // Close idle connections after 60 seconds

  // Timeout Settings
  serverSelectionTimeoutMS: 5000,   // Fail fast if MongoDB is unreachable (5s)
  socketTimeoutMS: 45000,           // Socket timeout for operations (45s)
  connectTimeoutMS: 10000,          // Initial connection timeout (10s)

  // Reliability Settings
  retryWrites: true,            // Automatically retry failed write operations
  retryReads: true,             // Automatically retry failed read operations

  // Monitoring
  monitorCommands: process.env.NODE_ENV === 'development', // Log commands in dev mode
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Database and collection names from environment variables
export const getDatabase = async (): Promise<Db> => {
  console.log('Getting database connection...');
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DATABASE || 'rayls-manifesto';
  console.log('Connecting to database:', dbName);
  return client.db(dbName);
};

// Collection helper functions
export const getCollection = async (collectionName: string) => {
  console.log('Getting collection:', collectionName);
  const db = await getDatabase();
  const collection = db.collection(collectionName);
  console.log('Collection obtained successfully');
  return collection;
};

// Collection name constants
export const COLLECTIONS = {
  USERS: process.env.MONGODB_USERS_COLLECTION || 'users',
  UTM_DATA: process.env.MONGODB_UTM_DATA_COLLECTION || 'utmData',
  IP_DATA: process.env.MONGODB_IP_DATA_COLLECTION || 'ipData',
} as const;

/**
 * Initialize database indexes for optimal query performance
 * This should be called once during application startup
 * Indexes are idempotent - safe to call multiple times
 */
export const initializeIndexes = async (): Promise<void> => {
  try {
    console.log('Initializing database indexes...');
    const db = await getDatabase();

    // UTM Data Collection Indexes
    const utmCollection = db.collection(COLLECTIONS.UTM_DATA);

    // Index for sessionId lookups (most common query pattern)
    await utmCollection.createIndex(
      { sessionId: 1 },
      { name: 'idx_sessionId', background: true }
    );

    // Index for time-based queries (analytics, reporting)
    await utmCollection.createIndex(
      { sessionStartTime: -1 },
      { name: 'idx_sessionStartTime', background: true }
    );

    // Compound index for session end time queries
    await utmCollection.createIndex(
      { sessionEndTime: -1 },
      { name: 'idx_sessionEndTime', background: true, sparse: true }
    );

    // Compound index for UTM source analysis
    await utmCollection.createIndex(
      { utm_source: 1, sessionStartTime: -1 },
      { name: 'idx_utm_source_time', background: true, sparse: true }
    );

    // Index for referral code tracking
    await utmCollection.createIndex(
      { referralCode: 1 },
      { name: 'idx_referralCode', background: true, sparse: true }
    );

    // IP Data Collection Indexes
    const ipCollection = db.collection(COLLECTIONS.IP_DATA);

    // Index for sessionId lookups
    await ipCollection.createIndex(
      { sessionId: 1 },
      { name: 'idx_sessionId', background: true }
    );

    // Index for IP address lookups (for analytics)
    await ipCollection.createIndex(
      { ipAddress: 1, timestamp: -1 },
      { name: 'idx_ipAddress_timestamp', background: true }
    );

    // Index for timestamp-based queries
    await ipCollection.createIndex(
      { timestamp: -1 },
      { name: 'idx_timestamp', background: true }
    );

    // Users Collection Indexes
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Index for Twitter ID lookups (authentication)
    await usersCollection.createIndex(
      { twitterId: 1 },
      { name: 'idx_twitterId', unique: true, background: true }
    );

    // Index for session ID lookups
    await usersCollection.createIndex(
      { sessionId: 1 },
      { name: 'idx_sessionId', background: true }
    );

    console.log('✓ Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database indexes:', error);
    // Don't throw - index creation failures shouldn't prevent app startup
    // The app will still work, just with degraded performance
  }
};

export default clientPromise;