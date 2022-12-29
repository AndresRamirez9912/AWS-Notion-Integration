const createTimeEntry = require("../../src/lambdas/createTimeEntry");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = { put: jest.fn() };
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
    },
  };

  const awsEvent = {
    body: JSON.stringify(input),
    pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
    httpMethod: "POST",
  };

  const awsContext = { awsRequestId: "f73ebe09-d9f0-4598-9988-c5edce86f019" };

  test("success response with POST method", async () => {
    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    const response = await createTimeEntry.handler(awsEvent, awsContext);
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.id).toBe(awsContext.awsRequestId);
    expect(jsonBody.payload).toStrictEqual(input.time_entry);
    expect(typeof jsonBody.createdAt).toBe("string");
    expect(jsonBody.eventType).toBe("CREATE");
  });

  test("success response with PUT method", async () => {
    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });
    awsEvent.httpMethod = "PUT";

    const response = await createTimeEntry.handler(awsEvent, awsContext);
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.id).toBe(awsContext.awsRequestId);
    expect(jsonBody.payload).toStrictEqual(input.time_entry);
    expect(typeof jsonBody.createdAt).toBe("string");
    expect(jsonBody.eventType).toBe("UPDATE");
  });

  test("success response with DELETE method", async () => {
    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });
    awsEvent.httpMethod = "DELETE";

    const response = await createTimeEntry.handler(awsEvent, awsContext);
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.id).toBe(awsContext.awsRequestId);
    expect(jsonBody.payload).toStrictEqual(input.time_entry);
    expect(typeof jsonBody.createdAt).toBe("string");
    expect(jsonBody.eventType).toBe("DELETE");
  });

  test("error raised by dynamodb.put", async () => {
    const awsErrorMessage =
      "One or more parameter values were invalid: Missing the key id in the item";

    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.reject(new Error(awsErrorMessage)),
    });

    const response = await createTimeEntry.handler(awsEvent, awsContext);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(500);
  });

  test("error decoding request body", async () => {
    const evtError = {
      body: '{"time_entry":{ "id": "317a00f4-9f39-42d0-90c7-589a68fc5e90" "started_at": 2022-12-20T16:11:00.000Z,} }',
    };

    const response = await createTimeEntry.handler(evtError, awsContext);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error.startsWith("Unexpected string")).toBe(true);
    expect(response.statusCode).toBe(500);
  });

  test("error raised by dismatch between id in path and id in payload", async () => {
    const awsErrorMessage =
      "id in path parameters does not match id in payload";

    const evtError = {
      body: '{"time_entry":{ "id": "317a00f4-9f39-42d0-90c7-589a68fc5e90", "started_at": "2022-12-20T16:11:00.000Z"} }',
      pathParameters: { id: "450a00f4-9f39-42d0-90c7-589a68fc5e90" },
      httpMethod: "PUT",
    };

    const response = await createTimeEntry.handler(evtError, awsContext);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });
});
