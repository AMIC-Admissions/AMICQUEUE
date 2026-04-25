/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.indexes.push("CREATE UNIQUE INDEX idx_tickets_ticketNumber ON tickets (ticketNumber)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("tickets");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_tickets_ticketNumber"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
