const uploadEntries = require("../../src/lambdas/uploadEntries");
const AWS = require("aws-sdk");
const { Client } = require("@notionhq/client");

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });
const notion = new Client({ auth: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    update: jest.fn(),
    scan: jest.fn(),
  };
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => mockDocumentClient),
  };
  return { DynamoDB: mockDynamoDB };
});

jest.mock("@notionhq/client", () => {
  const mockCreate = {
    create: jest.fn(),
  };
  const mockPages = {
    pages: mockCreate,
  };
  const mockClient = jest.fn(() => mockPages);
  return { Client: mockClient };
});

describe("UploadEntries.handler", () => {
  const scanResult = [
    {
      finish_at: "2023-01-31T03:00:00.000Z",
      page_id: "",
      entry_duration: 100,
      started_at: "2023-01-31T01:20:00.000Z",
      description: "Primera Prueba",
      user_id: 123456,
      userEmail: "andres@kommit.co",
      billable: true,
      project_id: 1234567,
      projectName: "podnation",
      billable: false,
      is_uploaded: false,
    },
  ];

  test("Sucess Upload Entry", async () => {
    dynamodb.scan.mockReturnValueOnce({
      promise: () => Promise.resolve({ Items: scanResult }),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.resolve(scanResult[0]),
    });

    notion.pages.create.mockReturnValueOnce({});

    const message = "Time entries were uploaded successfully";
    const response = await uploadEntries.handler();
    const { data: jsonBody } = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(typeof response.body).toBe("string");
    expect(jsonBody).toBe(message);
  });

  test("Error updating an Entry", async () => {
    dynamodb.scan.mockReturnValueOnce({
      promise: () => Promise.resolve({ Items: {} }),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.reject(),
    });

    notion.pages.create.mockReturnValueOnce({});

    const response = await uploadEntries.handler();
    expect(response.statusCode).toBe(500);
  });

  test("Error Scanning an Entry", async () => {
    dynamodb.scan.mockReturnValueOnce({
      promise: () => Promise.reject(),
    });

    dynamodb.update.mockReturnValueOnce({
      promise: () => Promise.resolve(scanResult[0]),
    });

    notion.pages.create.mockReturnValueOnce({});

    const response = await uploadEntries.handler();
    expect(response.statusCode).toBe(500);
  });
});
