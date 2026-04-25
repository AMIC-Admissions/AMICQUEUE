/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");

  const record0 = new Record(collection);
    record0.set("systemTitle", "Admissions & Registration Office");
    record0.set("systemSubtitle", "Queue Management System");
    record0.set("branches", ["AMIS", "KIDS"]);
    record0.set("services", ["Inquiry", "Registration", "Payment", "Document"]);
    record0.set("colorPrimary", "#3b82f6");
    record0.set("colorSecondary", "#8b5cf6");
    record0.set("colorBackground", "#ffffff");
    record0.set("colorText", "#000000");
    record0.set("colorSuccess", "#10b981");
    record0.set("colorWarning", "#f59e0b");
    record0.set("colorError", "#ef4444");
    record0.set("colorInfo", "#0ea5e9");
    record0.set("notificationSettings", "{'whatsappEnabled': True, 'inAppAlertsEnabled': True, 'soundAlertsEnabled': True}");
  try {
    app.save(record0);
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
