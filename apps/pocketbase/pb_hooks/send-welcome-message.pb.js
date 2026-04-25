/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const ticketId = e.record.id;
  const ticketNumber = e.record.get("ticketNumber");
  const mobile = e.record.get("mobile");
  
  // Create welcome message in Arabic
  const messageAr = new $app.models().collections.get("messages").new();
  messageAr.set("ticketId", ticketId);
  messageAr.set("messageType", "welcome");
  messageAr.set("language", "ar");
  messageAr.set("content", "مرحبا بك في نظام الطوابير. رقم تذكرتك: " + ticketNumber + ". يمكنك تتبع حالتك عبر الرابط: https://queue.local/track/" + ticketNumber);
  messageAr.set("recipientPhone", mobile);
  messageAr.set("sent", false);
  
  // Create welcome message in English
  const messageEn = new $app.models().collections.get("messages").new();
  messageEn.set("ticketId", ticketId);
  messageEn.set("messageType", "welcome");
  messageEn.set("language", "en");
  messageEn.set("content", "Welcome to the queue system. Your ticket number is: " + ticketNumber + ". Track your status here: https://queue.local/track/" + ticketNumber);
  messageEn.set("recipientPhone", mobile);
  messageEn.set("sent", false);
  
  try {
    $app.save(messageAr);
    $app.save(messageEn);
  } catch (err) {
    console.log("Error creating welcome messages: " + err.message);
  }
  
  e.next();
}, "tickets");