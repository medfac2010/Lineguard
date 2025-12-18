import { getDb } from './db';
import { subsidiaries, lineTypes, users, lines, faults } from "@shared/schema";
import { hashPassword } from "./password";

async function seed() {
  console.log("🌱 Starting database seed...");
 const db = await getDb();
  try {
    // Check if data exists
    console.log("🔍 Checking for existing data...");
    const existingSubsidiaries = await db.select().from(subsidiaries);
    const existingLineTypes = await db.select().from(lineTypes);
    const existingUsers = await db.select().from(users);
    const existingLines = await db.select().from(lines);
    const existingFaults = await db.select().from(faults);

    const hasData = 
      existingSubsidiaries.length > 0 ||
      existingLineTypes.length > 0 ||
      existingUsers.length > 0 ||
      existingLines.length > 0 ||
      existingFaults.length > 0;

    if (hasData) {
      console.log("⚠️  Found existing data. Clearing...");
      // Clear existing data only if it exists
      if (existingFaults.length > 0) {
        console.log(`   Deleting ${existingFaults.length} faults...`);
        await db.delete(faults);
      }
      if (existingLines.length > 0) {
        console.log(`   Deleting ${existingLines.length} lines...`);
        await db.delete(lines);
      }
      if (existingUsers.length > 0) {
        console.log(`   Deleting ${existingUsers.length} users...`);
        await db.delete(users);
      }
      if (existingLineTypes.length > 0) {
        console.log(`   Deleting ${existingLineTypes.length} line types...`);
        await db.delete(lineTypes);
      }
      if (existingSubsidiaries.length > 0) {
        console.log(`   Deleting ${existingSubsidiaries.length} subsidiaries...`);
        await db.delete(subsidiaries);
      }

      // MySQL uses AUTO_INCREMENT, no need for ALTER SEQUENCE
      console.log("   Database cleared for fresh seed...");
    } else {
      console.log("✅ No existing data found. Starting fresh seed...");
    }

    // Seed Subsidiaries
    console.log("📍 Seeding subsidiaries...");
    await db
      .insert(subsidiaries)
      .values([
        { name: "Siège Social" },
        { name: "Filiale Nord" },
        { name: "Usine Sud" },
      ]);
    
    // Fetch inserted subsidiaries
    const [sub1, sub2, sub3] = await db.select().from(subsidiaries).limit(3);

    // Seed Line Types
    console.log("📞 Seeding line types...");
    await db
      .insert(lineTypes)
      .values([
        { code: "LS", title: "Ligne spécialisée (LS)" },
        { code: "IP_STD", title: "IP STD 4 chiffres" },
      ]);
    
    // Fetch inserted line types
    const [lt1, lt2] = await db.select().from(lineTypes).limit(2);

    // Seed Users
    console.log("👥 Seeding users...");
    const userData = [
      {
        name: "Administrateur Système",
        role: "admin",
        password: await hashPassword("admin"),
        subsidiaryId: null,
      },
      {
        name: "Opérateur Siège",
        role: "subsidiary",
        password: await hashPassword("user1"),
        subsidiaryId: sub1.id,
      },
      {
        name: "Gestionnaire Filiale Nord",
        role: "subsidiary",
        password: await hashPassword("user2"),
        subsidiaryId: sub2.id,
      },
      {
        name: "Équipe Support Technique",
        role: "maintenance",
        password: await hashPassword("maint"),
        subsidiaryId: null,
      },
    ];
    await db
      .insert(users)
      .values(userData);
    
    // Fetch inserted users
    const [admin, user1, user2, maint1] = await db.select().from(users).limit(4);

    // Seed Lines
    console.log("☎️  Seeding lines...");
    await db
      .insert(lines)
      .values([
        {
          number: "LS-1024",
          type: "LS",
          subsidiaryId: sub1.id,
          location: "Salle serveur A",
          status: "working",
          inFaultFlow: true,
        },
        {
          number: "1001",
          type: "IP_STD",
          subsidiaryId: sub1.id,
          location: "Réception",
          status: "faulty",
          inFaultFlow: true,
        },
        {
          number: "LS-9901",
          type: "LS",
          subsidiaryId: sub2.id,
          location: "Bureau d'entrepôt",
          status: "maintenance",
          inFaultFlow: true,
        },
        {
          number: "1002",
          type: "IP_STD",
          subsidiaryId: sub2.id,
          location: "Étage commercial",
          status: "working",
          inFaultFlow: false,
        },
        {
          number: "LS-5500",
          type: "LS",
          subsidiaryId: sub3.id,
          location: "Chaîne de production 1",
          status: "working",
          inFaultFlow: true,
        },
      ]);
    
    // Fetch inserted lines
    const [line1, line2, line3, line4, line5] = await db.select().from(lines).limit(5);

    // Seed Faults
    console.log("🚨 Seeding faults...");
    await db
      .insert(faults)
      .values([
        {
          lineId: line2.id,
          subsidiaryId: sub1.id,
          declaredBy: user1.id,
          symptoms: "Pas de tonalité, bruit intermittent",
          probableCause: "Dommage probable du câble",
          status: "open",
          declaredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          lineId: line3.id,
          subsidiaryId: sub2.id,
          declaredBy: user2.id,
          symptoms: "Connexion interrompue toutes les 5 minutes",
          probableCause: "Configuration du routeur",
          status: "assigned",
          assignedTo: maint1.id,
          declaredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          assignedAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
        },
      ]);

    console.log("✅ Database seed completed successfully!");
    console.log("\n📋 Seeded data:");
    console.log(`  - ${3} subsidiaries`);
    console.log(`  - ${2} line types`);
    console.log(`  - ${4} users`);
    console.log(`  - ${5} lines`);
    console.log(`  - ${2} faults`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
