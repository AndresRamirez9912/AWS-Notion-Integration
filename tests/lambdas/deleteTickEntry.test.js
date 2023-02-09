const deleteTimeEntry = require("../../src/lambdas/deleteTimeEntry");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    delete: jest.fn(),
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
      user_id: 123456,
      userEmail: "andres@kommit.co",
      billable: true,
      project_id: 1234567,
      projectName: "podnation",
      entry_duration: 180,
      tag_id: 100,
      is_uploaded: false,
      page_id: "",
    },
  };
  const item = {
    Item: {
      finish_at: "2023-02-08T03:00:00.000Z",
      page_id: "26a2fab8-f92b-44ff-a53b-92d36137d277",
      entry_duration: 5976,
      created_at: "2023-02-08T20:09:44.274Z",
      description: "Segunda Prueba",
      project_id: 1234567,
      projectName: "podnation",
      started_at: "2023-02-08T01:20:00.000Z",
      id: "2",
      billable: true,
      is_uploaded: false,
      user_id: 123456,
      userEmail: "andres@kommit.co",
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

    dynamodb.get.mockReturnValueOnce({
      promise: () => Promise.resolve(item),
    });

    const message = "Element deleted succesfully";
    const response = await deleteTimeEntry.handler(awsEvent);
    const jsonBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.data).toBe(message);
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

    const response = await deleteTimeEntry.handler(evtError);
    const jsonBody = JSON.parse(response.body);

    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(400);
  });

  test("Success response deleting an ELement in Notion and Dynamodb ", async () => {
    notionItem = item;
    notionItem.Item.is_uploaded = true;

    dynamodb.delete.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    dynamodb.get.mockReturnValueOnce({
      promise: () => Promise.resolve(notionItem),
    });

    notion.pages.update.mockReturnValueOnce({});

    item.Item.is_uploaded = true;
    const awsEvent = {
      body: JSON.stringify(input),
      pathParameters: { id: "317a00f4-9f39-42d0-90c7-589a68fc5e90" },
    };

    const message = "Element deleted succesfully";
    const response = await deleteTimeEntry.handler(awsEvent);
    const jsonBody = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(typeof response.body).toBe("string");
    expect(jsonBody.data).toBe(message);
  });
});
