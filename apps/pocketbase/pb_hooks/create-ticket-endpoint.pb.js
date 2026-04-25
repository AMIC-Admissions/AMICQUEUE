/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/custom/create-ticket", (e) => {
  try {
    // Safely extract data from request with optional chaining and fallbacks
    const requestData = e?.requestInfo()?.data || {};
    
    const ticketNumber = requestData?.ticketNumber || "";
    const branch = requestData?.branch || "";
    const parentName = requestData?.parentName || "";
    const mobileNumber = requestData?.mobileNumber || "";
    const service = requestData?.service || "";
    const status = requestData?.status || "waiting";
    const counter = requestData?.counter || "";

    // Validate required fields
    if (!ticketNumber || ticketNumber.trim() === "") {
      return e.json(400, { error: "ticketNumber is required" });
    }
    if (!branch || branch.trim() === "") {
      return e.json(400, { error: "branch is required" });
    }
    if (!mobileNumber || mobileNumber.trim() === "") {
      return e.json(400, { error: "mobileNumber is required" });
    }
    if (!service || service.trim() === "") {
      return e.json(400, { error: "service is required" });
    }

    // Get the tickets collection
    const collection = $app.findCollectionByNameOrId("tickets");
    if (!collection) {
      return e.json(500, { error: "Tickets collection not found" });
    }

    // Create new ticket record
    const record = new Record(collection);
    
    // Set field values
    record.set("ticketNumber", ticketNumber);
    record.set("branch", branch);
    record.set("mobileNumber", mobileNumber);
    record.set("service", service);
    record.set("status", status);

    // Save the record
    $app.save(record);

    // Return success response with the created ticket
    return e.json(200, {
      success: true,
      ticket: {
        id: record.id,
        ticketNumber: record.get("ticketNumber"),
        branch: record.get("branch"),
        mobileNumber: record.get("mobileNumber"),
        service: record.get("service"),
        status: record.get("status"),
        created: record.get("created")
      }
    });

  } catch (error) {
    // Log error and return 500 response
    console.error("Error creating ticket:", error);
    return e.json(500, { 
      error: "Failed to create ticket", 
      details: error?.message || String(error)
    });
  }
}, $apis.requireGuestOnly());
