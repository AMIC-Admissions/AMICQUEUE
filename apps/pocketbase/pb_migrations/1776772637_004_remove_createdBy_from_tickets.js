/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.removeByName("createdBy");
  return app.save(collection);
}, (app) => {
  try {

  const pbc_3841632486Collection = app.findCollectionByNameOrId("pbc_3841632486");
  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.add(new RelationField({
    name: "createdBy",
    collectionId: pbc_3841632486Collection.id,
    maxSelect: 0,
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
