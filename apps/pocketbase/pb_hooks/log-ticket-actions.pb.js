/// <reference path="../pb_data/types.d.ts" />
onRecordAfterUpdateSuccess((e) => {
  const statusSelect = e.record.get("statusSelect");
  const original = e.record.original();
  const originalStatus = original.get("statusSelect");
  
  // Only log if status changed
  if (statusSelect && statusSelect !== originalStatus) {
    const actionMap = {
      "Called": "ticket_called",
      "Waiting": "ticket_waiting",
      "Served": "ticket_served",
      "Pending": "ticket_pending"
    };
    
    const action = actionMap[statusSelect] || "ticket_status_changed";
    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      const logRecord = new Record($app.findCollectionByNameOrId("activity_logs"));
      logRecord.set("action", action);
      logRecord.set("ticketId", e.record.id);
      logRecord.set("counterNumber", e.record.get("counter"));
      logRecord.set("timestamp", timestamp);
      logRecord.set("description", "Ticket " + e.record.get("ticketNumber") + " status changed to " + statusSelect);
      
      $app.save(logRecord);
    } catch (err) {
      console.log("Error logging ticket action: " + err.message);
    }
  }
  
  e.next();
}, "tickets");