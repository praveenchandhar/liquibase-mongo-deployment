// db/mongo/release/v1.0.0/users-setup.rollback.js
(function () {
    print("=== Rolling back users collection setup ===");
    
    if (db.getCollectionNames().includes("users")) {
        // Check if collection is empty before dropping
        const userCount = db.users.estimatedDocumentCount();
        
        if (userCount === 0) {
            // Drop indexes first
            try {
                db.users.dropIndex("email_1");
                print("✅ Dropped email index");
            } catch (e) {
                print("ℹ️  Email index not found or already dropped");
            }
            
            try {
                db.users.dropIndex("created_at_1");
                print("✅ Dropped created_at index");
            } catch (e) {
                print("ℹ️  Created_at index not found or already dropped");
            }
            
            // Drop collection
            db.users.drop();
            print("✅ Dropped users collection");
        } else {
            print("⚠️  Users collection has data, skipping drop for safety");
        }
    } else {
        print("ℹ️  Users collection doesn't exist, nothing to rollback");
    }
    
    print("✅ Rollback completed");
})();
