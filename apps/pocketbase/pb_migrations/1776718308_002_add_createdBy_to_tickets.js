/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const adminsCollection = app.findCollectionByNameOrId("admins");
  const collection = app.findCollectionByNameOrId("tickets");

  const existing = collection.fields.getByName("createdBy");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("createdBy"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "createdBy",
    required: false,
    collectionId: adminsCollection.id
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("tickets");
    collection.fields.removeByName("createdBy");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
