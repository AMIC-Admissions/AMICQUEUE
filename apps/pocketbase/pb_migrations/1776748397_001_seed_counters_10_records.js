/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("counters");

  const record0 = new Record(collection);
    record0.set("counterNumber", 1);
    record0.set("status", "Active");
    record0.set("currentTicketId", null);
    record0.set("operatorId", null);
    record0.set("isPaused", false);
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
    record1.set("counterNumber", 2);
    record1.set("status", "Active");
    record1.set("currentTicketId", null);
    record1.set("operatorId", null);
    record1.set("isPaused", false);
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
    record2.set("counterNumber", 3);
    record2.set("status", "Active");
    record2.set("currentTicketId", null);
    record2.set("operatorId", null);
    record2.set("isPaused", false);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("counterNumber", 4);
    record3.set("status", "Active");
    record3.set("currentTicketId", null);
    record3.set("operatorId", null);
    record3.set("isPaused", false);
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("counterNumber", 5);
    record4.set("status", "Active");
    record4.set("currentTicketId", null);
    record4.set("operatorId", null);
    record4.set("isPaused", false);
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("counterNumber", 6);
    record5.set("status", "Active");
    record5.set("currentTicketId", null);
    record5.set("operatorId", null);
    record5.set("isPaused", false);
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    record6.set("counterNumber", 7);
    record6.set("status", "Active");
    record6.set("currentTicketId", null);
    record6.set("operatorId", null);
    record6.set("isPaused", false);
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    record7.set("counterNumber", 8);
    record7.set("status", "Active");
    record7.set("currentTicketId", null);
    record7.set("operatorId", null);
    record7.set("isPaused", false);
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    record8.set("counterNumber", 9);
    record8.set("status", "Active");
    record8.set("currentTicketId", null);
    record8.set("operatorId", null);
    record8.set("isPaused", false);
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    record9.set("counterNumber", 10);
    record9.set("status", "Active");
    record9.set("currentTicketId", null);
    record9.set("operatorId", null);
    record9.set("isPaused", false);
  try {
    app.save(record9);
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
