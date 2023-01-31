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
    const created_at = new Date().toISOString();

    common.validatePayload(payload);
    common.validateDate(payload.started_at, payload.finish_at);
    common.validateCompleteEntry(payload);

    const item = {
      id: payload.id,
      started_at: payload.started_at,
      finish_at: payload.finish_at,
      description: payload.description,
      user: payload.user,
      billable: payload.billable,
      project: payload.project,
      entry_duration: payload.duration,
      created_at,
      is_uploaded: false,
      page_id: "",
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
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
