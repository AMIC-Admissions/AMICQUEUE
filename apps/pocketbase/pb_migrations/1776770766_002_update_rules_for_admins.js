/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("admins");
  collection.createRule = "@request.auth.collectionName = \"admins\"";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("admins");
  collection.createRule = null;
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
