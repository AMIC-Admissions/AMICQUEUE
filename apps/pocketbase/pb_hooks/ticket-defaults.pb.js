/// <reference path="../pb_data/types.d.ts" />
onRecordCreate((e) => {
  if (!e.record.get("status")) {
    e.record.set("status", "new");
  }
  if (!e.record.get("counter")) {
    e.record.set("counter", 1);
  }
  e.next();
}, "tickets");