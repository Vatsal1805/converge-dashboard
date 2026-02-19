const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/convergeos';

async function seed() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // 1. Seed Founder
        console.log('Seeding Founder...');
        const hashedPassword = await bcrypt.hash('convergedigitals', 10);

        // Check if founder exists to avoid overwriting specific fields if we want, but upsert is fine
        await usersCollection.updateOne(
            { email: 'founder@gmail.com' },
            {
                $set: {
                    name: 'Founder',
                    email: 'founder@gmail.com',
                    password: hashedPassword,
                    role: 'founder',
                    department: 'Executive',
                    status: 'active',
                    // Don't overwrite createdAt if exists
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    performanceScore: 100
                }
            },
            { upsert: true }
        );
        console.log('Founder seeded.');

        const founder = await usersCollection.findOne({ email: 'founder@gmail.com' });

        // 2. Check for sample data
        const projectsCount = await db.collection('projects').countDocuments();
        if (projectsCount === 0) {
            console.log('Seeding sample data...');

            // Create a Team Lead
            const teamLeadHash = await bcrypt.hash('password', 10);
            const tlResult = await usersCollection.insertOne({
                name: 'Sarah Lead',
                email: 'sarah@converge.com',
                password: teamLeadHash,
                role: 'teamlead',
                department: 'Engineering',
                status: 'active',
                createdAt: new Date(),
                performanceScore: 90,
                createdBy: founder._id
            });
            const tlId = tlResult.insertedId;

            // Create Intern
            const internHash = await bcrypt.hash('password', 10);
            const internResult = await usersCollection.insertOne({
                name: 'Jack Intern',
                email: 'jack@converge.com',
                password: internHash,
                role: 'intern',
                department: 'Engineering',
                status: 'active',
                createdAt: new Date(),
                performanceScore: 50,
                createdBy: founder._id
            });
            const internId = internResult.insertedId;

            // Create Project
            const projResult = await db.collection('projects').insertOne({
                name: 'ConvergeOS Redesign',
                clientName: 'Converge Digitals',
                description: 'Internal OS rebuild',
                teamLeadId: tlId,
                deadline: new Date('2024-12-31'),
                status: 'active',
                priority: 'high',
                createdBy: founder._id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Create Task
            await db.collection('tasks').insertOne({
                title: 'Setup DB Schema',
                projectId: projResult.insertedId,
                assignedTo: internId,
                priority: 'high',
                status: 'in_progress',
                deadline: new Date('2024-11-20'),
                estimatedHours: 5,
                hoursLogged: 2,
                createdBy: founder._id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Sample data seeded.');
        }

        console.log('Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
