// db/mongo/release/v1.0.0/users-setup.js
(function () {
    print("=== Setting up users collection ===");
    
    // Create collection if it doesn't exist
    if (!db.getCollectionNames().includes("users")) {
        db.createCollection("users");
        print("✅ Created users collection");
    } else {
        print("ℹ️  Users collection already exists");
    }
    
    // Create email unique index if it doesn't exist
    const emailIndexExists = db.users.getIndexes().some(idx => 
        idx.name === "email_1" || (idx.key && idx.key.email === 1 && idx.unique)
    );
    
    if (!emailIndexExists) {
        db.users.createIndex({ email: 1 }, { unique: true, name: "email_1" });
        print("✅ Created unique email index");
    } else {
        print("ℹ️  Email index already exists");
    }
    
    // Create created_at index if it doesn't exist
    const createdAtIndexExists = db.users.getIndexes().some(idx => 
        idx.name === "created_at_1" || (idx.key && idx.key.created_at === 1)
    );
    
    if (!createdAtIndexExists) {
        db.users.createIndex({ created_at: 1 }, { name: "created_at_1" });
        print("✅ Created created_at index");
    } else {
        print("ℹ️  Created_at index already exists");
    }
    
    print("✅ Users collection setup completed");
})();
