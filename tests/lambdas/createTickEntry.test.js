const AWS = require("aws-sdk");
const createTimeEntry = require("../../src/lambdas/createTimeEntry");

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    put: jest.fn(),
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
      user_id: "4268a196-f3f2-48f8-bede-b469676354ee",
      userEmail: "andres@moove-it.com",
      billable: true,
      project_id: "99c1f9b8-b7d5-4399-8180-9e92e63509c2",
      projectName: "podnation",
      duration: 180,
      is_uploaded: false,
      page_id: "",
    },
  };

  const awsEvent = {
    body: JSON.stringify(input),
    pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
  };

  test("success response with POST method", async () => {
    dynamodb.put.mockReturnValueOnce({
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
    delete input.time_entry.duration;
    delete jsonBody.entry_duration;
    expect(jsonBody).toStrictEqual(input.time_entry);
  });

  test("error raised by dynamodb.put", async () => {
    const awsErrorMessage =
      "One or more parameter values were invalid: Missing the key id in the item";
    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.reject(new Error(awsErrorMessage)),
    });
    const response = await createTimeEntry.handler(awsEvent);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(500);
  });

  test("error decoding request body", async () => {
    const evtError = {
      body: '{"time_entry":{ "id": "317a00f4-9f39-42d0-90c7-589a68fc5e90" "started_at": 2022-12-20T16:11:00.000Z,} }',
    };

    const response = await createTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error.startsWith("Unexpected string")).toBe(true);
    expect(response.statusCode).toBe(500);
  });

  test("error raised by missing time_entry in request body", async () => {
    const evt = {
      body: '{"key": "value"}',
      httpMethod: "POST",
    };

    const response = await createTimeEntry.handler(evt);
    const jsonBody = JSON.parse(response.body);
    expect(jsonBody.error).toBe("Missing time_entry root in request body");
    expect(response.statusCode).toBe(400);
  });
});
