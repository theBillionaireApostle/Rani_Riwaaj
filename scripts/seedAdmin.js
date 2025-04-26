// scripts/seedAdmin.js

require("dotenv").config();
const readline = require("readline");
const dbConnect = require("../lib/db"); // Ensure this path is correct.
const User = require("../lib/models/User");
const bcrypt = require("bcryptjs"); // Make sure to install with: npm install bcryptjs
const { v4: uuidv4 } = require("uuid"); // Make sure to install with: npm install uuid

// Set up readline to prompt for input in the terminal.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
}

async function seedAdmin() {
  try {
    // Connect to your database.
    await dbConnect();

    console.log("Seeding Admin User...");

    // Prompt for admin email, display name, and password.
    const email = await askQuestion("Enter admin email (username): ");
    const displayName = await askQuestion("Enter admin display name: ");
    const password = await askQuestion("Enter admin password: ");

    // Check if an admin user already exists.
    const existingAdmin = await User.findOne({ email: email, role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin);
      rl.close();
      process.exit(0);
    }

    // Generate a unique UID using uuid.
    const uid = uuidv4();

    // Hash the password securely.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Define the admin user data.
    const adminData = {
      uid,
      email,
      displayName,
      role: "admin",
      password: hashedPassword,
    };

    // Create the admin user.
    const newAdmin = await User.create(adminData);
    console.log("Admin user created successfully:", newAdmin);
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    rl.close();
    process.exit(1);
  }
}

seedAdmin();