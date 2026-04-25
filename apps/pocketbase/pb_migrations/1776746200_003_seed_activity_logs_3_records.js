/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("activity_logs");

  const record0 = new Record(collection);
    record0.set("action", "ticket_called");
    record0.set("counterNumber", 1);
    record0.set("timestamp", "2024-01-01");
    record0.set("description", "Ticket called at counter 1");
    const record0_userIdLookup = app.findFirstRecordByFilter("admins", "email!=''");
    if (!record0_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'admins' matching \"email!=''\""); }
    record0.set("userId", record0_userIdLookup.id);
    record0.set("details", "{'ticketNumber': 'A001', 'service': 'General Inquiry'}");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("action", "ticket_served");
    record1.set("counterNumber", 2);
    record1.set("timestamp", "2024-01-01");
    record1.set("description", "Ticket served at counter 2");
    const record1_userIdLookup = app.findFirstRecordByFilter("admins", "email!=''");
    if (!record1_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'admins' matching \"email!=''\""); }
    record1.set("userId", record1_userIdLookup.id);
    record1.set("details", "{'ticketNumber': 'A002', 'service': 'Document Processing'}");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("action", "counter_paused");
    record2.set("counterNumber", 3);
    record2.set("timestamp", "2024-01-01");
    record2.set("description", "Counter 3 paused for break");
    const record2_userIdLookup = app.findFirstRecordByFilter("admins", "email!=''");
    if (!record2_userIdLookup) { throw new Error("Lookup failed for userId: no record in 'admins' matching \"email!=''\""); }
    record2.set("userId", record2_userIdLookup.id);
    record2.set("details", "{'reason': 'Staff break', 'duration': '15 minutes'}");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
