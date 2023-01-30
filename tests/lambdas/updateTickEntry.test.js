const createTimeEntry = require("../../src/lambdas/updateTimeEntry");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    update: jest.fn(),
  };
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => mockDocumentClient),
  };
  return { DynamoDB: mockDynamoDB };
});

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

  const awsEvent = {
    body: JSON.stringify(input),
    pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
  };

  test("success response with DELETE method", async () => {
    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    const response = await createTimeEntry.handler(awsEvent);
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.id).toBe(input.time_entry.id);
    expect(typeof jsonBody.created_at).toBe("string");
    delete jsonBody.created_at;
    delete input.time_entry.created_at;
    expect(jsonBody).toStrictEqual(input.time_entry);
  });

  test("error raised by dismatch between id in path and id in payload", async () => {
    const awsErrorMessage =
      "id in path parameters does not match id in payload";

    errorInput = input;
    errorInput.started_at = "2022-12-20T18:14:00.000Z";

    const evtError = {
      body: JSON.stringify(errorInput),
      pathParameters: { id: "450a00f4-9f39-42d0-90c7-589a68fc5e90" },
    };

    const response = await createTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });

  test("error raised by left an element in payload", async () => {
    const awsErrorMessage = "Some Parameter is Empty";

    const evtError = {
      body: '{"time_entry":{ "id": "317a00f4-9f39-42d0-90c7-589a68fc5e90", "started_at": "2022-12-20T16:11:00.000Z"} }',
      pathParameters: { id: "450a00f4-9f39-42d0-90c7-589a68fc5e90" },
    };

    const response = await createTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });
});
