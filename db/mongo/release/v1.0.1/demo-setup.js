// liquibase formatted mongodb
// changeset praveen:v1.0.0-users-setup runWith:mongosh

// Create the `users` collection
db.createCollection("demo_collection");

// Create indexes
db.demo_collection.createIndex({ email: 1 }, { unique: true });
db.demo_collection.createIndex({ createdAt: 1 });

// Insert sample data
db.getCollection("sk_uam_permission").insertMany([
{ 
    "permission" : "sp.benefits.benefitguide.list",
    "suiteKey" : "sp",
    "productKey" : "sp.benefits",
    "type" : "normal",
    "moduleKey" : "sp.benefits.benefits",
    "createdBy" : "1",
    "createdAt" : ISODate(),
    "updatedBy" : "1",
    "updatedAt" : ISODate(),
    "description" : "Permission to list Benefits guide.",
    "featureKey" : "sp.benefits.benefits.benefits"
},
{ 
    "permission" : "sp.benefits.benefitguide.sharewithprospecthire",
    "suiteKey" : "sp",
    "productKey" : "sp.benefits",
    "type" : "normal",
    "moduleKey" : "sp.benefits.benefits",
    "createdBy" : "1",
    "createdAt" : ISODate(),
    "updatedBy" : "1",
    "updatedAt" : ISODate(),
    "description" : "Permission to share with prospect hire.",
    "featureKey" : "sp.benefits.benefits.benefits"
}
]);

// Remove old permission features
db.getCollection("sk_uam_permission_feature").deleteMany({'permission':{$in:["sp.benefits.benefitguide.list", "sp.benefits.benefitguide.sharewithprospecthire"]}});

// Insert new permission features
db.getCollection("sk_uam_permission_feature").insertMany([
{   "permission" : "sp.benefits.benefitguide.list",
    "description" : "Permission to list Benefits guide.",
    "featureKey" : "sp.benefits.benefits.benefits"
},
{   "permission" : "sp.benefits.benefitguide.sharewithprospecthire",
    "description" : "Permission to share with prospect hire.",
    "featureKey" : "sp.benefits.benefits.benefits"
}
]);

print("Migration completed!");
