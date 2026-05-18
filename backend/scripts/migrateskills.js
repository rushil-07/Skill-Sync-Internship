// --- Migration: Convert user.skills from [String] to objects
// Run: node scripts/migrate_skills.js
// No model dependencies - works directly with MongoDB

require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')

const MONGO_URI = process.env.MONGO_URI
const DB_NAME   = process.env.DB_NAME || 'skill-sync-demo'

async function migrate() {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI is required. Add it to backend/.env before running this migration.')
    }

    const client = new MongoClient(MONGO_URI)
    await client.connect()
    console.log('OK Connected to MongoDB')

    const db       = client.db(DB_NAME)
    const users    = db.collection('users')

    const allUsers = await users.find({}).toArray()
    console.log(`Found ${allUsers.length} users\n`)

    let migrated = 0
    let skipped  = 0

    for (const user of allUsers) {
        if (!user.skills || user.skills.length === 0) {
            skipped++
            continue
        }

        // Check if already in new format
        const first = user.skills[0]
        if (typeof first === 'object' && first !== null && (first.skill_name || first.proficiency_level)) {
            console.log(`  - Skipped ${user.username} (already migrated)`)
            skipped++
            continue
        }

        // Convert old string array to new object array
        const newSkills = user.skills.map(s => {
            const name = typeof s === 'string' ? s : (s.name || s.skill_name || String(s))
            return {
                _id:               new ObjectId(),
                skill_id:          null,
                skill_name:        name.trim(),
                proficiency_level: 'INTERMEDIATE',
                verified:          false,
                last_used:         null,
            }
        })

        await users.updateOne(
            { _id: user._id },
            { $set: { skills: newSkills } }
        )

        console.log(`  OK Migrated ${user.username}: [${user.skills.join(', ')}]`)
        migrated++
    }

    console.log(`\nOK Done - ${migrated} migrated, ${skipped} skipped`)
    await client.close()
}

migrate().catch(err => {
    console.error('X Migration failed:', err.message)
    process.exit(1)
})
