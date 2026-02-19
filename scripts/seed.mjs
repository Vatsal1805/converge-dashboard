import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/convergeos';

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Define rough schemas if not importing models to avoid transpilation issues with TS
        // Or just use basic collection access
        const db = mongoose.connection.db;

        // 1. Seed Founder
        console.log('Seeding Founder...');
        const usersCollection = db.collection('users');
        const hashedPassword = await bcrypt.hash('convergedigitals', 10);

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
                    createdAt: new Date(),
                    performanceScore: 100
                }
            },
            { upsert: true }
        );
        console.log('Founder seeded.');

        // 2. Clear other collections maybe? Or just add sample data if empty
        const projectsCount = await db.collection('projects').countDocuments();
        if (projectsCount === 0) {
            console.log('Seeding sample data...');
            // Need Founder ID
            const founder = await usersCollection.findOne({ email: 'founder@gmail.com' });

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
                createdAt: new Date()
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
                createdAt: new Date()
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
