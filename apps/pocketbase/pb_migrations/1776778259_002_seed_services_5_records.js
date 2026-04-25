/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("services");

  const record0 = new Record(collection);
    record0.set("name", "General Reception");
    record0.set("nameAr", "\u0627\u0633\u062a\u0642\u0628\u0627\u0644 \u0639\u0627\u0645");
    record0.set("description", "General inquiries and reception");
    record0.set("isActive", true);
    record0.set("order", 1);
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
    record1.set("name", "Billing & Payment");
    record1.set("nameAr", "\u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631 \u0648\u0627\u0644\u062f\u0641\u0639");
    record1.set("description", "Billing and payment services");
    record1.set("isActive", true);
    record1.set("order", 2);
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
    record2.set("name", "Technical Support");
    record2.set("nameAr", "\u0627\u0644\u062f\u0639\u0645 \u0627\u0644\u0641\u0646\u064a");
    record2.set("description", "Technical support and troubleshooting");
    record2.set("isActive", true);
    record2.set("order", 3);
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
    record3.set("name", "Complaints & Suggestions");
    record3.set("nameAr", "\u0627\u0644\u0634\u0643\u0627\u0648\u0649 \u0648\u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a");
    record3.set("description", "Customer complaints and suggestions");
    record3.set("isActive", true);
    record3.set("order", 4);
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
    record4.set("name", "Other Services");
    record4.set("nameAr", "\u062e\u062f\u0645\u0627\u062a \u0623\u062e\u0631\u0649");
    record4.set("description", "Other miscellaneous services");
    record4.set("isActive", true);
    record4.set("order", 5);
  try {
    app.save(record4);
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
