/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");

  const existing = collection.fields.getByName("whatsappApiKey");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("whatsappApiKey"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "whatsappApiKey"
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("settings");
    collection.fields.removeByName("whatsappApiKey");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
