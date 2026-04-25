/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.removeByName("createdAt");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.add(new AutodateField({
    name: "createdAt",
    onCreate: true,
    onUpdate: false
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
