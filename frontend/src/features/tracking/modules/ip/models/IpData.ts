import { ObjectId, Collection } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/features/tracking/lib/mongodb.lib';

export interface IpData {
  _id?: ObjectId;
  sessionId: string; // Links to UTM data session
  ipAddress: string; // Client IP address
  userAgent?: string; // Browser user agent string
  timestamp: Date; // When IP was captured

  // Future geolocation fields (not implemented yet)
  // country?: string;
  // region?: string;
  // city?: string;
  // latitude?: number;
  // longitude?: number;
}

export interface IpDataCreateInput {
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
}

// MongoDB Schema Validation
export const ipDataSchemaValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["sessionId", "ipAddress", "timestamp"],
    properties: {
      _id: {
        bsonType: "objectId"
      },
      sessionId: {
        bsonType: "string",
        minLength: 10,
        description: "must be a string and is required - links to UTM session"
      },
      ipAddress: {
        bsonType: "string",
        pattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^unknown$|^127\\.0\\.0\\.1$",
        description: "must be a valid IPv4 address, 'unknown', or localhost"
      },
      userAgent: {
        bsonType: "string",
        maxLength: 500,
        description: "browser user agent string"
      },
      timestamp: {
        bsonType: "date",
        description: "must be a date and is required - when IP was captured"
      }
    }
  }
};

// Index definitions for optimal query performance
export const ipDataIndexes = [
  // Index on sessionId for linking to UTM data
  { key: { sessionId: 1 }, options: { name: "sessionId_index" } },

  // Index on ipAddress for IP-based analytics
  { key: { ipAddress: 1 }, options: { name: "ipAddress_index" } },

  // Index on timestamp for time-based queries
  { key: { timestamp: 1 }, options: { name: "timestamp_index" } },

  // Compound index for session and IP analysis
  { key: { sessionId: 1, ipAddress: 1 }, options: { name: "session_ip_index" } },

  // Index for finding recent IPs
  { key: { timestamp: -1, ipAddress: 1 }, options: { name: "recent_ip_index" } }
];

// Initialize IpData collection with schema and indexes
export async function initializeIpDataCollection(): Promise<Collection> {
  const collection = await getCollection(COLLECTIONS.IP_DATA);

  try {
    // Apply schema validation
    const db = await getCollection(COLLECTIONS.IP_DATA).then(c => c.db);
    await db.command({
      collMod: COLLECTIONS.IP_DATA,
      validator: ipDataSchemaValidation
    });

    // Create indexes
    await collection.createIndex({ sessionId: 1 }, { name: "sessionId_index" });
    await collection.createIndex({ ipAddress: 1 }, { name: "ipAddress_index" });
    await collection.createIndex({ timestamp: 1 }, { name: "timestamp_index" });
    await collection.createIndex({ sessionId: 1, ipAddress: 1 }, { name: "session_ip_index" });
    await collection.createIndex({ timestamp: -1, ipAddress: 1 }, { name: "recent_ip_index" });

    console.log('IpData collection initialized with schema validation and 5 indexes');
  } catch (error) {
    console.error('Error initializing IpData collection:', error);
  }

  return collection;
}

// Utility functions for IP analytics
export class IpDataModel {
  static async findBySessionId(sessionId: string): Promise<IpData | null> {
    const collection = await getCollection(COLLECTIONS.IP_DATA);
    return await collection.findOne({ sessionId }) as IpData | null;
  }

  static async getUniqueIpCount(days: number = 30): Promise<number> {
    const collection = await getCollection(COLLECTIONS.IP_DATA);
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const result = await collection.aggregate([
      { $match: { timestamp: { $gte: cutoffDate }, ipAddress: { $ne: "unknown" } } },
      { $group: { _id: "$ipAddress" } },
      { $count: "uniqueIps" }
    ]).toArray();

    return result[0]?.uniqueIps || 0;
  }

  static async getTopIpAddresses(limit: number = 10): Promise<{ ip: string; sessions: number }[]> {
    const collection = await getCollection(COLLECTIONS.IP_DATA);

    return await collection.aggregate([
      { $match: { ipAddress: { $ne: "unknown" } } },
      { $group: { _id: "$ipAddress", sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
      { $limit: limit },
      { $project: { _id: 0, ip: "$_id", sessions: 1 } }
    ]).toArray() as { ip: string; sessions: number }[];
  }

  static async getIpActivityTimeline(days: number = 7): Promise<{ date: string; uniqueIps: number }[]> {
    const collection = await getCollection(COLLECTIONS.IP_DATA);
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    return await collection.aggregate([
      { $match: { timestamp: { $gte: cutoffDate }, ipAddress: { $ne: "unknown" } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
          },
          uniqueIps: { $addToSet: "$ipAddress" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          uniqueIps: { $size: "$uniqueIps" }
        }
      },
      { $sort: { date: 1 } }
    ]).toArray() as { date: string; uniqueIps: number }[];
  }

  static async getBrowserStats(): Promise<{ browser: string; count: number }[]> {
    const collection = await getCollection(COLLECTIONS.IP_DATA);

    return await collection.aggregate([
      { $match: { userAgent: { $exists: true, $ne: null } } },
      {
        $project: {
          browser: {
            $cond: {
              if: { $regexMatch: { input: "$userAgent", regex: "Chrome" } },
              then: "Chrome",
              else: {
                $cond: {
                  if: { $regexMatch: { input: "$userAgent", regex: "Firefox" } },
                  then: "Firefox",
                  else: {
                    $cond: {
                      if: { $regexMatch: { input: "$userAgent", regex: "Safari" } },
                      then: "Safari",
                      else: "Other"
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, browser: "$_id", count: 1 } }
    ]).toArray() as { browser: string; count: number }[];
  }
}