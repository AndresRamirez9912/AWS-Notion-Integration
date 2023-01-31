"use strict";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const common = require("../../common/common");

module.exports.handler = async (event) => {
  try {
    const { time_entry: payload } = JSON.parse(event.body);

    common.validatePayload(payload);
    common.validateURLQuery(event, payload);

    await dynamodb
      .delete({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: payload.id,
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ data: "Element deleted succesfully" }),
    };
  } catch (error) {
    return {
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
