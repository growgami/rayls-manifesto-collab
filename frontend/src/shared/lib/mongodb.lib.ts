import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

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

export default clientPromise;