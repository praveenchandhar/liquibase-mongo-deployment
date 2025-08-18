// liquibase formatted mongodb
// changeset praveen:v1.0.0-users-setup runWith:mongosh

// Create the `users` collection
db.createCollection("users");

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// Insert sample data
db.users.insertMany([
  { name: "John Doe", email: "john@example.com", createdAt: new Date() },
  { name: "Jane Doe", email: "jane@example.com", createdAt: new Date() }
]);

print("Migration completed!");
