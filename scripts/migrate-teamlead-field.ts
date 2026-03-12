/**
 * Migration Script: teamLeadId to teamLeadIds
 *
 * This script migrates existing Project documents from the old schema
 * where teamLeadId was a single ObjectId to the new schema where
 * teamLeadIds is an array of ObjectIds.
 *
 * Usage: npx tsx scripts/migrate-teamlead-field.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

interface OldProject {
  _id: mongoose.Types.ObjectId;
  teamLeadId?: mongoose.Types.ObjectId;
  teamLeadIds?: mongoose.Types.ObjectId[];
}

async function migrateTeamLeadField() {
  try {
    console.log("🔄 Starting migration: teamLeadId → teamLeadIds\n");

    // Connect to database
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const projectsCollection = db.collection("projects");

    // Find documents with old field structure
    const oldProjects = (await projectsCollection
      .find({
        teamLeadId: { $exists: true },
      })
      .toArray()) as unknown as OldProject[];

    console.log(`\n📊 Found ${oldProjects.length} projects with old schema\n`);

    if (oldProjects.length === 0) {
      console.log("✨ No migration needed - all projects are up to date!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Migrate each project
    for (const project of oldProjects) {
      try {
        const updateData: any = {
          $set: {
            teamLeadIds: [project.teamLeadId],
          },
          $unset: {
            teamLeadId: "",
          },
        };

        await projectsCollection.updateOne({ _id: project._id }, updateData);

        successCount++;
        console.log(`✅ Migrated project: ${project._id}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate project ${project._id}:`, error);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`Total projects found:    ${oldProjects.length}`);
    console.log(`Successfully migrated:   ${successCount}`);
    console.log(`Failed:                  ${errorCount}`);
    console.log("=".repeat(50));

    if (errorCount === 0) {
      console.log("\n✨ Migration completed successfully!");
    } else {
      console.log(
        "\n⚠️  Migration completed with errors. Please review failed migrations.",
      );
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Handle backward compatibility for projects that might still have teamLeadId
export async function ensureTeamLeadIdsArray() {
  const db = mongoose.connection.db;
  if (!db) return;

  const projectsCollection = db.collection("projects");

  // Check if there are any documents with old schema
  const hasOldSchema = await projectsCollection.countDocuments({
    teamLeadId: { $exists: true },
  });

  if (hasOldSchema > 0) {
    console.warn(
      "⚠️  Warning: Found projects with old schema. Run migration: npm run migrate:teamlead",
    );
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateTeamLeadField()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateTeamLeadField;
