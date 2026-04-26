/// <reference path="../pb_data/types.d.ts" />
onRecordCreate((e) => {
  const collection = e.record?.collection?.();
  const hasField = (name) => {
    try {
      return !!collection?.fields?.getByName?.(name);
    } catch (error) {
      return false;
    }
  };

  if (!e.record.get("status")) {
    e.record.set("status", "Pending");
  }

  if (hasField("counterNumber")) {
    const currentCounterNumber = Number(e.record.get("counterNumber") || 0);
    if (!Number.isFinite(currentCounterNumber) || currentCounterNumber < 0) {
      e.record.set("counterNumber", 0);
    }
  } else if (hasField("counter")) {
    const currentCounter = Number(e.record.get("counter") || 0);
    if (!Number.isFinite(currentCounter) || currentCounter < 0) {
      e.record.set("counter", 0);
    }
  }

  e.next();
}, "tickets");
