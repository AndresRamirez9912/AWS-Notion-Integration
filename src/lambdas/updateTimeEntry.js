"use strict";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const common = require("../common/common");

module.exports.handler = async (event) => {
  try {
    const { time_entry: payload } = JSON.parse(event.body);

    common.validatePayload(payload);
    common.validateURLQuery(event, payload);

    // Get the item from the database
    const item = await dynamodb
      .get({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: payload.id,
        },
      })
      .promise();

    // If the item doesn't exist, throw an error
    if (!item.Item) {
      const error = Error("Item not found");
      error.code = 404;
      throw error;
    }

    // Change duration to entry_duration in payload
    payload.entry_duration = payload.duration;
    delete payload.duration;

    // If the item exists, update it
    const itemObject = Object.assign(item.Item, payload);

    const { Attributes } = await dynamodb
      .update({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: payload.id,
        },
        UpdateExpression:
          "set started_at = :started_at, finish_at = :finish_at, description = :description, #user.#name = :user_name, #user.#id = :user_id, billable = :billable, #project.#name = :project_name, #project.#id = :project_id, entry_duration = :entry_duration",
        ExpressionAttributeNames: {
          "#user": "user",
          "#name": "name",
          "#id": "id",
          "#project": "project",
        },
        ExpressionAttributeValues: {
          ":started_at": itemObject.started_at,
          ":finish_at": itemObject.finish_at,
          ":description": itemObject.description,
          ":user_name": itemObject.user.name,
          ":user_id": itemObject.user.id,
          ":billable": itemObject.billable,
          ":project_name": itemObject.project.name,
          ":project_id": itemObject.project.id,
          ":entry_duration": itemObject.entry_duration,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ data: Attributes }),
    };
  } catch (error) {
    return {
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
