# Database Migration Guide

## ⚠️ BREAKING CHANGE: Project Model Schema Update

### What Changed?

The `Project` model schema has been updated with a **breaking change**:

- **Old Field**: `teamLeadId` (single ObjectId)
- **New Field**: `teamLeadIds` (array of ObjectIds)

This change allows projects to have **multiple team leads** instead of just one.

### Impact

- ❌ Existing projects in the database will have the old `teamLeadId` field
- ❌ The new schema expects `teamLeadIds` as an array
- ⚠️ Without migration, existing projects may cause validation or runtime errors

### Solution: Run Migration Script

We've implemented:

1. ✅ **Migration Script** - Automatically converts old data to new format
2. ✅ **Backward Compatibility** - Model handles old format temporarily during transition
3. ✅ **Zero Downtime** - Application continues working during migration

---

## How to Migrate

### Step 1: Backup Your Database (Recommended)

```bash
npm run backup
```

This creates a JSON backup of all collections in `backups/` folder.

### Step 2: Run the Migration

```bash
npm run migrate:teamlead
```

This script will:
- Find all projects with old `teamLeadId` field
- Convert to new `teamLeadIds` array format
- Remove the old field
- Show detailed progress and summary

### Step 3: Verify Migration

The script will show output like:

```
🔄 Starting migration: teamLeadId → teamLeadIds

✅ Connected to MongoDB

📊 Found 15 projects with old schema

✅ Migrated project: 507f1f77bcf86cd799439011
✅ Migrated project: 507f191e810c19729de860ea
...

==================================================
📊 Migration Summary:
==================================================
Total projects found:    15
Successfully migrated:   15
Failed:                  0
==================================================

✨ Migration completed successfully!
```

---

## Backward Compatibility

We've added middleware to the Project model that automatically handles old documents during the transition period:

- If a document has `teamLeadId`, it's automatically converted to `teamLeadIds` array on read
- This prevents runtime errors while migration is being applied
- **Still recommended to run migration** for data consistency

---

## For Production Deployment

### Before Deploying:

1. **Backup production database**
2. **Run migration on production database**
3. **Verify migration success**
4. **Deploy new code**

### Rollback Plan (If Needed):

If you need to rollback:

```bash
# Restore from backup
npm run backup:list          # List available backups
# Manually restore the backup using mongorestore
```

---

## Technical Details

### Migration Script Location
📁 `scripts/migrate-teamlead-field.ts`

### What It Does

```javascript
// Old Format (in database)
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Project Alpha",
  "teamLeadId": "507f191e810c19729de860ea",  // Single ID
  ...
}

// New Format (after migration)
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Project Alpha",
  "teamLeadIds": ["507f191e810c19729de860ea"],  // Array of IDs
  ...
}
```

### Schema Change

```typescript
// Old Interface
interface IProject {
  teamLeadId: mongoose.Types.ObjectId;
}

// New Interface
interface IProject {
  teamLeadIds: mongoose.Types.ObjectId[];  // Array!
}
```

---

## Frequently Asked Questions

### Q: What happens if I don't run the migration?

A: The backward compatibility layer will handle reads temporarily, but you should still run the migration for:
- Data consistency
- Performance (middleware overhead)
- Future updates that may remove compatibility layer

### Q: Can I run the migration multiple times?

A: Yes! The script only migrates documents with the old `teamLeadId` field. Already migrated documents are skipped.

### Q: Will this cause downtime?

A: No! The application continues working during migration thanks to backward compatibility middleware.

### Q: How long does migration take?

A: Very fast - typically less than a second for hundreds of projects.

---

## Support

If you encounter issues during migration:

1. Check the error message in the migration output
2. Verify your MongoDB connection string
3. Ensure you have proper database permissions
4. Check backup files exist before proceeding

For questions, contact the development team.

---

**Last Updated**: February 23, 2026  
**Migration Script Version**: 1.0.0
