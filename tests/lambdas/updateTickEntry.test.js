const updateTimeEntry = require("../../src/lambdas/updateTimeEntry");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

const { Client } = require("@notionhq/client");

const notion = new Client({ auth: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    update: jest.fn(),
    get: jest.fn(),
  };
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => mockDocumentClient),
  };
  return { DynamoDB: mockDynamoDB };
});

jest.mock("@notionhq/client", () => {
  const mockCreate = {
    update: jest.fn(),
  };
  const mockPages = {
    pages: mockCreate,
  };
  const mockClient = jest.fn(() => mockPages);
  return { Client: mockClient };
});

describe("createTmeEntry.handler", () => {
  const input = {
    time_entry: {
      id: "317a00f4-9f39-42d0-90c7-589a68fc5e90",
      started_at: "2022-12-20T16:11:00.000Z",
      finish_at: "2022-12-20T16:14:00.000Z",
      description: "ijasodij19 1 212",
      is_uploaded: true,
      user_id: 123456,
      userEmail: "andres@kommit.co",
      billable: true,
      project_id: 1234567,
      projectName: "podnation",
    },
  };

  const awsEvent = {
    body: JSON.stringify(input),
    pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
  };

  test("success response with PUT method", async () => {
    const data = {
      Item: {
        finish_at: "2022-12-20T06:00:00.000Z",
        entry_duration: 200,
        project_id: 1234567,
        projectName: "podnation",
        user_id: 123456,
        userEmail: "andres@kommit.co",
        created_at: "2023-01-31T19:50:51.233Z",
        description: "Nueva Edicion de la Primera Prueba",
        started_at: "2022-12-20T01:10:00.000Z",
        is_uploaded: true,
        id: "1",
        billable: false,
      },
    };

    dynamodb.get.mockReturnValueOnce({
      promise: () => Promise.resolve(data),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.resolve({ Attributes: data.Item }),
    });

    notion.pages.update.mockReturnValueOnce({});

    const response = await updateTimeEntry.handler(awsEvent);
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.id).toBe(input.time_entry.id);
    delete jsonBody.created_at;
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

    const response = await updateTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });

  test("error raised by item not found", async () => {
    const awsErrorMessage = "Item not found";

    dynamodb.get.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    const response = await updateTimeEntry.handler(awsEvent);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(404);
  });

  test("error raised by update Dynamo Function", async () => {
    dynamodb.get.mockReturnValueOnce({
      promise: () => Promise.resolve(data),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.reject(),
    });

    const response = await updateTimeEntry.handler(awsEvent);
    const jsonBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
  });
});
