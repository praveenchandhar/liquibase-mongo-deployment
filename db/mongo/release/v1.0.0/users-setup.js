db.createCollection("users");

db.users.insertMany([
  { name: "John Doe", email: "john@example.com", createdAt: new Date() },
  { name: "Jane Doe", email: "jane@example.com", createdAt: new Date() }
]);
