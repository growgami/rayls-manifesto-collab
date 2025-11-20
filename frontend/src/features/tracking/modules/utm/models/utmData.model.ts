import { ObjectId, Collection } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/features/tracking/lib/mongodb.lib';

export interface UtmData {
  _id?: ObjectId;
  sessionId: string; // Unique session identifier

  // Standard UTM parameters
  utm_source?: string; // traffic source (twitter, facebook, google, etc.)
  utm_medium?: string; // marketing medium (social, email, cpc, organic, etc.)
  utm_campaign?: string; // campaign name
  utm_term?: string; // paid search keywords
  utm_content?: string; // A/B test content or ad variation

  // Additional tracking data
  userAgent?: string; // browser user agent string
  url: string; // full URL where UTM was captured

  // Session timing data
  sessionStartTime: Date; // when session started
  sessionEndTime?: Date; // when session ended (null until page exit)
  sessionDuration?: number; // seconds of active viewing time

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

export interface UtmDataCreateInput {
  sessionId: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  userAgent?: string;
  url: string;
  sessionStartTime: Date;
}

export interface UtmDataUpdateInput {
  sessionEndTime: Date;
  sessionDuration: number;
  updatedAt: Date;
}

// MongoDB Schema Validation
export const utmDataSchemaValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["sessionId", "url", "sessionStartTime", "createdAt"],
    properties: {
      _id: {
        bsonType: "objectId"
      },
      sessionId: {
        bsonType: "string",
        minLength: 10,
        description: "must be a string and is required - unique session identifier"
      },
      utm_source: {
        bsonType: "string",
        maxLength: 100,
        description: "traffic source (twitter, facebook, google, etc.)"
      },
      utm_medium: {
        bsonType: "string",
        maxLength: 100,
        description: "marketing medium (social, email, cpc, organic, etc.)"
      },
      utm_campaign: {
        bsonType: "string",
        maxLength: 100,
        description: "campaign name"
      },
      utm_term: {
        bsonType: "string",
        maxLength: 100,
        description: "paid search keywords"
      },
      utm_content: {
        bsonType: "string",
        maxLength: 100,
        description: "A/B test content or ad variation"
      },
      userAgent: {
        bsonType: "string",
        maxLength: 500,
        description: "browser user agent string"
      },
      url: {
        bsonType: "string",
        pattern: "^https?://.*",
        description: "must be a valid URL and is required"
      },
      sessionStartTime: {
        bsonType: "date",
        description: "must be a date and is required"
      },
      sessionEndTime: {
        bsonType: "date",
        description: "when session ended"
      },
      sessionDuration: {
        bsonType: "int",
        minimum: 0,
        description: "seconds of active viewing time"
      },
      createdAt: {
        bsonType: "date",
        description: "must be a date and is required"
      },
      updatedAt: {
        bsonType: "date",
        description: "last update timestamp"
      }
    }
  }
};

// Index definitions for optimal query performance
export const utmDataIndexes = [
  // Unique index on sessionId (most important for lookups)
  { key: { sessionId: 1 }, options: { unique: true, name: "sessionId_unique" } },

  // Compound index for UTM campaign analysis
  { key: { utm_source: 1, utm_medium: 1, utm_campaign: 1 }, options: { name: "utm_campaign_index" } },

  // Index on sessionStartTime for time-based analytics
  { key: { sessionStartTime: 1 }, options: { name: "sessionStartTime_index" } },

  // Index on sessionDuration for engagement analytics
  { key: { sessionDuration: -1 }, options: { name: "sessionDuration_index" } },

  // Compound index for conversion funnel analysis
  { key: { utm_source: 1, sessionDuration: -1 }, options: { name: "source_engagement_index" } },

  // Index on createdAt for recent activity queries
  { key: { createdAt: -1 }, options: { name: "createdAt_index" } },

  // Text search index for URL content analysis
  { key: { url: "text" }, options: { name: "url_text_index" } }
];

// Initialize UtmData collection with schema and indexes
export async function initializeUtmDataCollection(): Promise<Collection> {
  const collection = await getCollection(COLLECTIONS.UTM_DATA);

  try {
    // Apply schema validation
    const db = await getCollection(COLLECTIONS.UTM_DATA).then(c => c.db);
    await db.command({
      collMod: COLLECTIONS.UTM_DATA,
      validator: utmDataSchemaValidation
    });

    // Create indexes
    await collection.createIndex({ sessionId: 1 }, { unique: true, name: "sessionId_unique" });
    await collection.createIndex({ utm_source: 1, utm_medium: 1, utm_campaign: 1 }, { name: "utm_campaign_index" });
    await collection.createIndex({ sessionStartTime: 1 }, { name: "sessionStartTime_index" });
    await collection.createIndex({ sessionDuration: -1 }, { name: "sessionDuration_index" });
    await collection.createIndex({ utm_source: 1, sessionDuration: -1 }, { name: "source_engagement_index" });
    await collection.createIndex({ createdAt: -1 }, { name: "createdAt_index" });
    await collection.createIndex({ url: "text" }, { name: "url_text_index" });

    console.log('UtmData collection initialized with schema validation and 7 indexes');
  } catch (error) {
    console.error('Error initializing UtmData collection:', error);
  }

  return collection;
}

// Utility functions for UTM analytics
export class UtmDataModel {
  static async findBySessionId(sessionId: string): Promise<UtmData | null> {
    const collection = await getCollection(COLLECTIONS.UTM_DATA);
    return await collection.findOne({ sessionId }) as UtmData | null;
  }

  static async getTopSources(limit: number = 10): Promise<{ source: string; count: number }[]> {
    const collection = await getCollection(COLLECTIONS.UTM_DATA);

    return await collection.aggregate([
      { $match: { utm_source: { $exists: true, $ne: null } } },
      { $group: { _id: "$utm_source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, source: "$_id", count: 1 } }
    ]).toArray() as { source: string; count: number }[];
  }

  static async getCampaignPerformance(): Promise<{ campaign: string; sessions: number; avgDuration: number }[]> {
    const collection = await getCollection(COLLECTIONS.UTM_DATA);

    return await collection.aggregate([
      { $match: { utm_campaign: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$utm_campaign",
          sessions: { $sum: 1 },
          avgDuration: { $avg: "$sessionDuration" }
        }
      },
      { $sort: { sessions: -1 } },
      {
        $project: {
          _id: 0,
          campaign: "$_id",
          sessions: 1,
          avgDuration: { $round: ["$avgDuration", 2] }
        }
      }
    ]).toArray() as { campaign: string; sessions: number; avgDuration: number }[];
  }

  static async getEngagementStats(days: number = 7): Promise<{ totalSessions: number; avgDuration: number; bounceRate: number }> {
    const collection = await getCollection(COLLECTIONS.UTM_DATA);
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const stats = await collection.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: "$sessionDuration" },
          bounces: {
            $sum: {
              $cond: [{ $or: [{ $eq: ["$sessionDuration", null] }, { $lte: ["$sessionDuration", 3] }] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSessions: 1,
          avgDuration: { $round: ["$avgDuration", 2] },
          bounceRate: {
            $round: [{ $multiply: [{ $divide: ["$bounces", "$totalSessions"] }, 100] }, 2]
          }
        }
      }
    ]).toArray() as { totalSessions: number; avgDuration: number; bounceRate: number }[];

    return stats[0] || { totalSessions: 0, avgDuration: 0, bounceRate: 0 };
  }
}