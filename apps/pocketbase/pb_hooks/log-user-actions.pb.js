/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    const logRecord = new Record($app.findCollectionByNameOrId("activity_logs"));
    logRecord.set("action", "user_created");
    logRecord.set("userId", e.record.id);
    logRecord.set("timestamp", timestamp);
    logRecord.set("description", "User account created: " + e.record.get("email"));
    
    $app.save(logRecord);
  } catch (err) {
    console.log("Error logging user creation: " + err.message);
  }
  
  e.next();
}, "users");

onRecordAfterUpdateSuccess((e) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    const logRecord = new Record($app.findCollectionByNameOrId("activity_logs"));
    logRecord.set("action", "user_updated");
    logRecord.set("userId", e.record.id);
    logRecord.set("timestamp", timestamp);
    logRecord.set("description", "User account updated: " + e.record.get("email"));
    
    $app.save(logRecord);
  } catch (err) {
    console.log("Error logging user update: " + err.message);
  }
  
  e.next();
}, "users");

onRecordDelete((e) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    const logRecord = new Record($app.findCollectionByNameOrId("activity_logs"));
    logRecord.set("action", "user_deleted");
    logRecord.set("userId", e.record.id);
    logRecord.set("timestamp", timestamp);
    logRecord.set("description", "User account deleted: " + e.record.get("email"));
    
    $app.save(logRecord);
  } catch (err) {
    console.log("Error logging user deletion: " + err.message);
  }
  
  e.next();
}, "users");

onRecordAuthWithPasswordRequest((e) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    const logRecord = new Record($app.findCollectionByNameOrId("activity_logs"));
    logRecord.set("action", "user_login");
    logRecord.set("userId", e.record.id);
    logRecord.set("timestamp", timestamp);
    logRecord.set("description", "User login: " + e.record.get("email"));
    
    $app.save(logRecord);
  } catch (err) {
    console.log("Error logging user login: " + err.message);
  }
  
  e.next();
}, "users");