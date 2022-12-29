"use strict";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const eventTypesMap = { PUT: "UPDATE", DELETE: "DELETE", POST: "CREATE" };

module.exports.handler = async (event, context) => {
  try {
    const { time_entry: payload } = JSON.parse(event.body);
    const id = context.awsRequestId;
    const createdAt = new Date().toISOString();
    const eventType = eventTypesMap[event.httpMethod];

    if (eventType != "CREATE" && event.pathParameters.id !== payload.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "id in path parameters does not match id in payload",
        }),
      };
    }

    const item = {
      id,
      payload,
      eventType,
      createdAt,
    };

    await dynamodb
      .put({
        TableName: DYNAMODB_TABLE,
        Item: item,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ data: item }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
