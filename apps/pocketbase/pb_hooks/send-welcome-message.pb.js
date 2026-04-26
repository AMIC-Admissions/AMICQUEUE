/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  const ticketId = e.record.id;
  const ticketNumber = e.record.get("ticketNumber");
  const mobile = e.record.get("mobileNumber") || e.record.get("mobile") || "";
  const publicAppUrl = ($os.getenv("PUBLIC_APP_URL") || "https://amic-admissions.github.io/AMICQUEUE").replace(/\/$/, "");
  const trackingUrl = publicAppUrl + "/track?ticket=" + encodeURIComponent(ticketNumber);
  const arabicMessage = "\u0645\u0631\u062d\u0628\u0627 \u0628\u0643 \u0641\u064a \u0646\u0638\u0627\u0645 \u0627\u0644\u0637\u0648\u0627\u0628\u064a\u0631. \u0631\u0642\u0645 \u062a\u0630\u0643\u0631\u062a\u0643: " + ticketNumber + ". \u064a\u0645\u0643\u0646\u0643 \u062a\u062a\u0628\u0639 \u062d\u0627\u0644\u062a\u0643 \u0639\u0628\u0631 \u0627\u0644\u0631\u0627\u0628\u0637: " + trackingUrl;

  try {
    const messagesCollection = $app.findCollectionByNameOrId("messages");
    if (!messagesCollection || !ticketNumber || !mobile) {
      e.next();
      return;
    }

    const messageAr = new Record(messagesCollection);
    messageAr.set("ticketId", ticketId);
    messageAr.set("messageType", "welcome");
    messageAr.set("language", "ar");
    messageAr.set("content", arabicMessage);
    messageAr.set("recipientPhone", mobile);
    messageAr.set("sent", false);

    const messageEn = new Record(messagesCollection);
    messageEn.set("ticketId", ticketId);
    messageEn.set("messageType", "welcome");
    messageEn.set("language", "en");
    messageEn.set("content", "Welcome to the queue system. Your ticket number is: " + ticketNumber + ". Track your status here: " + trackingUrl);
    messageEn.set("recipientPhone", mobile);
    messageEn.set("sent", false);

    $app.save(messageAr);
    $app.save(messageEn);
  } catch (err) {
    console.log("Error creating welcome messages: " + err.message);
  }

  e.next();
}, "tickets");
