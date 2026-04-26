/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  ["users", "counters"].forEach((collectionName) => {
    const collection = app.findCollectionByNameOrId(collectionName);
    const field = collection.fields.getByName("counterNumber");

    if (!field) {
      console.log(`counterNumber field not found in ${collectionName}, skipping`);
      return;
    }

    field.min = 1;
    field.max = 999;
    field.onlyInt = true;
    app.save(collection);
  });
}, (app) => {
  ["users", "counters"].forEach((collectionName) => {
    try {
      const collection = app.findCollectionByNameOrId(collectionName);
      const field = collection.fields.getByName("counterNumber");

      if (!field) {
        console.log(`counterNumber field not found in ${collectionName}, skipping revert`);
        return;
      }

      field.min = 1;
      field.max = 10;
      field.onlyInt = true;
      app.save(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log(`Collection ${collectionName} not found, skipping revert`);
        return;
      }
      throw e;
    }
  });
})
