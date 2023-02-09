const { DYNAMODB_TABLE } = process.env;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");

const userMap = require("../../data/users.json");
const projectMap = require("../../data/projects.json");
const tagMap = require("../../data/tags.json");
const Entry = require("../models/entry");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

async function getEntries() {
  try {
    return await dynamodb
      .scan({
        TableName: DYNAMODB_TABLE,
        FilterExpression: "is_uploaded = :is_uploaded",
        ExpressionAttributeValues: {
          ":is_uploaded": false,
        },
      })
      .promise();
  } catch (error) {
    return error;
  }
}

async function updateDbEntry(entryId, pageId) {
  try {
    return await dynamodb
      .update({
        TableName: DYNAMODB_TABLE,
        Key: { id: entryId },
        UpdateExpression: "set page_id = :page_id, is_uploaded = :is_uploaded",
        ExpressionAttributeValues: {
          ":page_id": pageId,
          ":is_uploaded": true,
        },
      })
      .promise();
  } catch (error) {
    return error;
  }
}

module.exports.handler = async () => {
  try {
    const { Items } = await getEntries();
    Items.forEach(async (item) => {
      const newEntry = new Entry(
        item.id,
        item.started_at,
        item.finish_at,
        userMap[item.userEmail],
        item.description,
        item.billable,
        parseFloat((item.entry_duration / 3600).toFixed(2)), // Convert from seg to hours
        tagMap[item.tag_id],
        projectMap[item.projectName]
      );
      const response = await newEntry.addEntry();
      updateDbEntry(item.id, response.id);
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ data: "Time entries were uploaded successfully" }),
    };
  } catch (error) {
    return {
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
