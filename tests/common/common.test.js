const commons = require("../../common/common");

describe("createTmeEntry.handler", () => {
  const input = {
    time_entry: {
      id: "317a00f4-9f39-42d0-90c7-589a68fc5e90",
      started_at: "2022-12-20T16:11:00.000Z",
      finish_at: "2022-12-20T16:14:00.000Z",
      description: "ijasodij19 1 212",
      user_id: 11,
      billable: true,
      project_id: 5,
      duration: 180,
      tag_id: 100,
      is_uploaded: false,
      page_id: " ",
    },
  };
  const data = {
    payload: { id: "317a00f4-9f31-42d0-90c7-589a68fc5e90" },
  };
  const awsEvent = {
    body: JSON.stringify(input),
    event: {
      pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
      httpMethod: "DELETE",
    },
  };

  const awsErrorEvent = {
    body: JSON.stringify({ time: { user_id: 11 } }),
    pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
    httpMethod: "PUT",
  };

  test("Succes Complete Entry Payload", async () => {
    response = commons.validateCompleteEntry(input.time_entry);
    expect(response).toBeNull();
  });

  test("Fail Complete Entry Payload", async () => {
    expect(() => {
      commons.validateCompleteEntry(data.payload);
    }).toThrow();
  });

  test("Succes Date on Payload", async () => {
    const payload = {
      started_at: "2022-12-20T16:11:00.000Z",
      finish_at: "2022-12-20T18:14:00.000Z",
    };
    response = commons.validateDate(payload);
    expect(response).toBeNull();
  });

  test("Fail Date on Payload", async () => {
    const errorPayload = {
      started_at: "2022-12-20T18:11:00.000Z",
      finish_at: "2022-12-20T16:14:00.000Z",
    };

    expect(() => {
      commons.validateDate(errorPayload);
    }).toThrow();
  });
});
