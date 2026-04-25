/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.updateRule = "";
  collection.deleteRule = "";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.updateRule = "@request.auth.role = \"admin\" || @request.auth.role = \"staff\"";
  collection.deleteRule = "@request.auth.role = \"admin\"";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
