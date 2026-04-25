/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("activity_logs");
  collection.listRule = "@request.auth.role = \"admin\"";
  collection.viewRule = "@request.auth.role = \"admin\"";
  collection.createRule = "@request.auth.role = \"admin\"";
  collection.updateRule = "@request.auth.role = \"admin\"";
  collection.deleteRule = "@request.auth.role = \"admin\"";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("activity_logs");
  collection.listRule = "@request.auth.collectionName = \"admins\"";
  collection.viewRule = "@request.auth.collectionName = \"admins\"";
  collection.createRule = "@request.auth.collectionName = \"admins\"";
  collection.updateRule = "@request.auth.collectionName = \"admins\"";
  collection.deleteRule = "@request.auth.collectionName = \"admins\"";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
