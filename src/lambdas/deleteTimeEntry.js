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
    common.validateURLQuery(event, payload);

    const item = {
      id: payload.id,
      started_at: payload.started_at,
      finish_at: payload.finish_at,
      description: payload.description,
      user_id: payload.user_id,
      billable: payload.billable,
      project_id: payload.project_id,
      duration: payload.duration,
      created_at,
      tag_id: payload.tag_id,
      is_uploaded: false,
      page_id: "",
    };

    await dynamodb
      .delete({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: item.id,
        },
      })
      .promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ data: "Element deleted succesfully" }),
    };
  } catch (error) {
    return {
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
