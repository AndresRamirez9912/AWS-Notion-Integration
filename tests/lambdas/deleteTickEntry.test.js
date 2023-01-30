const createTimeEntry = require("../../src/lambdas/deleteTimeEntry");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    delete: jest.fn(),
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
    dynamodb.delete.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });
    const message = "Element eliminated succesfully";
    const response = await createTimeEntry.handler(awsEvent);
    const { jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    // expect(typeof jsonBody.data).toBe(message);
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

    errorInput = input;
    delete errorInput.time_entry.started_at;

    const evtError = {
      body: JSON.stringify(errorInput),
      pathParameters: { id: "450a00f4-9f39-42d0-90c7-589a68fc5e90" },
    };
    const response = await createTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });
});
