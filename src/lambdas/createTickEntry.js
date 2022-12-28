"use strict";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient(options);

module.exports.handler = async (event, context) => {
  try {
    const tickEntry = {
      id: context.awsRequestId,
      data: JSON.parse(event.body),
      createdAt: new Date().toISOString(),
    };

    await dynamodb
      .put({
        TableName: DYNAMODB_TABLE,
        Item: tickEntry,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify(tickEntry),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
