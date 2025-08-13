// Create users collection with indexes
print("=== Setting up users collection ===");

// Create collection
db.createCollection("users");

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: 1 });

print("✅ Users collection setup completed");
