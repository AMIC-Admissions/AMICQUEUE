/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.removeByName("counter");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("tickets");
  collection.fields.add(new NumberField({
    name: "counter",
    required: false
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
