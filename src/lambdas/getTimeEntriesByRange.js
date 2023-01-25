"use strict";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const isIsoDate = (str) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d) && d.toISOString() === str; // valid date
};

module.exports.handler = async (event) => {
  try {
    const { start, end } = event.queryStringParameters;

    if (!isIsoDate(start) || !isIsoDate(end))
      throw new Error(
        "Query parameters 'start' and 'end' are invalid or not provided"
      );

    if (start > end) throw new Error("Start date must be before end date");

    const { Items } = await dynamodb
      .scan({
        TableName: DYNAMODB_TABLE,
        FilterExpression:
          "#payload.#started_at >= :start and #payload.#finish_at <= :end",
        ExpressionAttributeNames: {
          "#payload": "payload",
          "#started_at": "started_at",
          "#finish_at": "finish_at",
        },
        ExpressionAttributeValues: {
          ":start": start,
          ":end": end,
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(Items),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
