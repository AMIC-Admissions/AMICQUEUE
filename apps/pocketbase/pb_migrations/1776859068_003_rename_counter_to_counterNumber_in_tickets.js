/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  const counterNumber = collection.fields.getByName("counterNumber");
  const counter = collection.fields.getByName("counter");

  if (counterNumber) {
    if (counterNumber.type !== "number") {
      collection.fields.removeByName("counterNumber");
      collection.fields.add(new NumberField({
        name: "counterNumber",
        required: false
      }));
      return app.save(collection);
    }

    counterNumber.required = false;
    return app.save(collection);
  }

  if (counter) {
    counter.name = "counterNumber";
    counter.required = false;
    return app.save(collection);
  }

  collection.fields.add(new NumberField({
    name: "counterNumber",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("tickets");
    const counterNumber = collection.fields.getByName("counterNumber");

    if (!counterNumber) {
      console.log("counterNumber field not found, skipping revert");
      return;
    }

    counterNumber.name = "counter";
    counterNumber.required = false;
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
