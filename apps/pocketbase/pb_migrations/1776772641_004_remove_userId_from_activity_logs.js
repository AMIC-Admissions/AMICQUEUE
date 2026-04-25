/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("activity_logs");
  collection.fields.removeByName("userId");
  return app.save(collection);
}, (app) => {
  try {

  const pbc_3841632486Collection = app.findCollectionByNameOrId("pbc_3841632486");
  const collection = app.findCollectionByNameOrId("activity_logs");
  collection.fields.add(new RelationField({
    name: "userId",
    required: true,
    collectionId: pbc_3841632486Collection.id,
    maxSelect: 1,
    cascadeDelete: false
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
