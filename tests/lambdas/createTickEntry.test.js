const createTickEntry = require("../../src/lambdas/createTickEntry");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = { put: jest.fn() };
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => mockDocumentClient),
  };
  return { DynamoDB: mockDynamoDB };
});

describe("createTickEntry.handler", () => {
  const data = {
    name: "John",
    lastname: "Doe",
  };

  const awsEvent = {
    body: JSON.stringify(data),
    id: "f73ebe09-d9f0-4598-9988-c5edce86f019",
    createdAt: "2022-12-20T15:53:40.752Z",
  };

  const awsContext = { awsRequestId: "f73ebe09-d9f0-4598-9988-c5edce86f019" };

  test("success response", async () => {
    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.resolve({}),
    });

    const response = await createTickEntry.handler(awsEvent, awsContext);

    expect(response.statusCode).toBe(201);
    expect(typeof response.body).toBe("string");
    const jsonBody = JSON.parse(response.body);
    expect(jsonBody.id).toBe(awsContext.awsRequestId);
    expect(jsonBody.data).toStrictEqual(data);
    expect(typeof jsonBody.createdAt).toBe("string");
  });

  test("error raised by dynamodb.put", async () => {
    const awsErrorMessage =
      "One or more parameter values were invalid: Missing the key id in the item";

    dynamodb.put.mockReturnValueOnce({
      promise: () => Promise.reject(new Error(awsErrorMessage)),
    });

    const response = await createTickEntry.handler(awsEvent, awsContext);
    const jsonBody = JSON.parse(response.body);
    expect(jsonBody.error).toBe(awsErrorMessage);
    expect(response.statusCode).toBe(500);
  });

  test("error decoding request body", async () => {
    const evtError = { body: '{\nname: "John",\nlastname:"Doe"\n}' };
    const response = await createTickEntry.handler(evtError, awsContext);
    const jsonBody = JSON.parse(response.body);
    expect(jsonBody.error.startsWith("Unexpected token")).toBe(true);
    expect(response.statusCode).toBe(500);
  });
});
