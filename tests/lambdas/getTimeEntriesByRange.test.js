const AWS = require("aws-sdk");
const getTimeEntryByRange = require("../../src/lambdas/getTimeEntriesByRange");
const timeEntriesData = require("../../assets/data.json");

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local" });

jest.mock("aws-sdk", () => {
  const mockDocumentClient = { scan: jest.fn() };
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => mockDocumentClient),
  };
  return { DynamoDB: mockDynamoDB };
});

describe("getTimeEntryByRange.handler", () => {
  const awsEvent = {
    httpMethod: "GET",
    queryStringParameters: {
      start: "2022-12-20T01:00:00.000Z",
      end: "2022-12-20T02:00:00.000Z",
    },
  };

  test("success response filtering ", async () => {
    dynamodb.scan.mockReturnValueOnce({
      promise: () => Promise.resolve({ Items: [timeEntriesData[0]] }),
    });

    const response = await getTimeEntryByRange.handler(awsEvent);
    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.length).toBe(1);
    expect(body[0].payload.started_at).toBe("2022-12-20T01:10:00.000Z");
  });

  test("success response filtering two entries", async () => {
    awsEvent.queryStringParameters = {
      start: "2022-12-20T01:00:00.000Z",
      end: "2022-12-20T03:30:00.000Z",
    };

    dynamodb.scan.mockReturnValueOnce({
      promise: () =>
        Promise.resolve({ Items: [timeEntriesData[0], timeEntriesData[1]] }),
    });

    const response = await getTimeEntryByRange.handler(awsEvent);
    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.length).toBe(2);
    expect(body[0].payload.started_at).toBe("2022-12-20T01:10:00.000Z");
    expect(body[1].payload.started_at).toBe("2022-12-20T02:10:00.000Z");
  });

  test("Fail response, not query parameters", async () => {
    const message =
      "Query parameters 'start' and 'end' are invalid or not provided";
    awsEvent.queryStringParameters = {};

    const response = await getTimeEntryByRange.handler(awsEvent);
    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(400);
    expect(body.error).toBe(message);
  });

  test("Fail response, `start` after `end` date", async () => {
    const message = "Start date must be before end date";
    awsEvent.queryStringParameters = {
      start: "2022-12-20T03:30:00.000Z",
      end: "2022-12-20T01:00:00.000Z",
    };

    const response = await getTimeEntryByRange.handler(awsEvent);
    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(400);
    expect(body.error).toBe(message);
  });
});
