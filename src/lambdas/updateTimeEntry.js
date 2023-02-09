

const {DYNAMODB_TABLE} = process.env;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const userMap = require("../../data/users.json");
const projectMap = require("../../data/projects.json");
const tagMap = require("../../data/tags.json");
const common = require("../common/common");
const Entry = require("../models/entry");

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
          "set started_at = :started_at, finish_at = :finish_at, description = :description, user_id = :user_id, userEmail = :userEmail, billable = :billable, project_id = :project_id, projectName = :projectName, entry_duration = :entry_duration",
        ExpressionAttributeValues: {
          ":started_at": itemObject.started_at,
          ":finish_at": itemObject.finish_at,
          ":description": itemObject.description,
          ":user_id": itemObject.user_id,
          ":userEmail": itemObject.userEmail,
          ":billable": itemObject.billable,
          ":projectName": itemObject.projectName,
          ":project_id": itemObject.project_id,
          ":entry_duration": itemObject.entry_duration,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    // Update the entry in Notion if was uploaded
    if (item.Item.is_uploaded) {
      const newEntry = new Entry(
        Attributes.id,
        Attributes.started_at,
        Attributes.finish_at,
        userMap[Attributes.userEmail],
        Attributes.description,
        Attributes.billable,
        parseFloat((Attributes.entry_duration / 3600).toFixed(2)), // Convert from seg to hours
        tagMap[Attributes.tag_id],
        projectMap[Attributes.projectName]
      );
      newEntry.editEntry(item.Item.page_id);
    }

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
