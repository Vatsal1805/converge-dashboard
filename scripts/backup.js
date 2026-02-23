/**
 * Database Backup and Recovery Utilities
 * Run these scripts periodically to ensure data safety
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}
const BACKUP_DIR = path.join(__dirname, "../backups");

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Export all collections to JSON
 */
async function backupDatabase() {
  try {
    console.log("🔄 Starting database backup...");
    console.log("Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    ensureBackupDir();

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`  Backing up ${collectionName}...`);

      const data = await db.collection(collectionName).find({}).toArray();
      const filePath = path.join(backupPath, `${collectionName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  ✓ ${collectionName}: ${data.length} documents`);
    }

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      collections: collections.map((c) => c.name),
      uri: MONGODB_URI.replace(/:[^:]*@/, ":****@"), // Hide password
      totalCollections: collections.length,
    };
    fs.writeFileSync(
      path.join(backupPath, "metadata.json"),
      JSON.stringify(metadata, null, 2),
    );

    console.log(`✓ Backup completed: ${backupPath}`);
    await mongoose.connection.close();
    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    await mongoose.connection.close();
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreDatabase(backupPath) {
  try {
    console.log(`🔄 Starting database restore from ${backupPath}...`);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup directory not found: ${backupPath}`);
    }

    console.log("Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db;

    const files = fs
      .readdirSync(backupPath)
      .filter((f) => f.endsWith(".json") && f !== "metadata.json");

    for (const file of files) {
      const collectionName = file.replace(".json", "");
      console.log(`  Restoring ${collectionName}...`);

      const filePath = path.join(backupPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (data.length > 0) {
        // Drop existing collection
        try {
          await db.collection(collectionName).drop();
        } catch (e) {
          // Collection might not exist
        }

        // Insert data
        await db.collection(collectionName).insertMany(data);
        console.log(`  ✓ ${collectionName}: ${data.length} documents restored`);
      }
    }

    console.log("✓ Restore completed");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Restore failed:", error);
    await mongoose.connection.close();
    throw error;
  }
}

/**
 * List all available backups
 */
function listBackups() {
  ensureBackupDir();
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_"))
    .sort()
    .reverse();

  console.log("📦 Available backups:");
  backups.forEach((backup, index) => {
    const backupPath = path.join(BACKUP_DIR, backup);
    const metadataPath = path.join(backupPath, "metadata.json");

    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      console.log(`  ${index + 1}. ${backup}`);
      console.log(`     Date: ${metadata.timestamp}`);
      console.log(`     Collections: ${metadata.totalCollections}`);
    } else {
      console.log(`  ${index + 1}. ${backup} (no metadata)`);
    }
  });

  return backups;
}

/**
 * Clean old backups (keep last N backups)
 */
function cleanOldBackups(keepCount = 10) {
  ensureBackupDir();
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_"))
    .sort()
    .reverse();

  if (backups.length <= keepCount) {
    console.log(`Only ${backups.length} backups exist. Nothing to clean.`);
    return;
  }

  const toDelete = backups.slice(keepCount);
  console.log(`🗑️  Cleaning ${toDelete.length} old backups...`);

  toDelete.forEach((backup) => {
    const backupPath = path.join(BACKUP_DIR, backup);
    fs.rmSync(backupPath, { recursive: true, force: true });
    console.log(`  Deleted: ${backup}`);
  });

  console.log("✓ Cleanup completed");
}

// CLI interface
const command = process.argv[2];

if (command === "backup") {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (command === "restore") {
  const backupPath = process.argv[3];
  if (!backupPath) {
    console.error(
      "❌ Please specify backup path: node backup.js restore <path>",
    );
    process.exit(1);
  }
  restoreDatabase(backupPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (command === "list") {
  listBackups();
} else if (command === "clean") {
  const keepCount = parseInt(process.argv[3]) || 10;
  cleanOldBackups(keepCount);
} else {
  console.log(`
Database Backup Utility

Usage:
  node scripts/backup.js backup              - Create a new backup
  node scripts/backup.js restore <path>      - Restore from backup
  node scripts/backup.js list                - List all backups
  node scripts/backup.js clean [keep]        - Clean old backups (default: keep last 10)

Examples:
  node scripts/backup.js backup
  node scripts/backup.js restore ./backups/backup_2026-02-22T10-30-00-000Z
  node scripts/backup.js clean 5
    `);
}

module.exports = {
  backupDatabase,
  restoreDatabase,
  listBackups,
  cleanOldBackups,
};
