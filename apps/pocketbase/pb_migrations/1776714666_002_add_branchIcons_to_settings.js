/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");

  const existing = collection.fields.getByName("branchIcons");
  if (existing) {
    if (existing.type === "file") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("branchIcons"); // exists with wrong type, remove first
  }

  collection.fields.add(new FileField({
    name: "branchIcons",
    maxSelect: 10,
    maxSize: 20971520
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("settings");
    collection.fields.removeByName("branchIcons");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
