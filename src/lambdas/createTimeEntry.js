const { DYNAMODB_TABLE } = process.env;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const common = require("../common/common");

module.exports.handler = async (event) => {
  try {
    const { time_entry: payload } = JSON.parse(event.body);
    const createdAt = new Date().toISOString();

    common.validatePayload(payload);
    common.validateDate(payload.started_at, payload.finish_at);
    common.validateCompleteEntry(payload);

    const item = {
      id: payload.id,
      started_at: payload.started_at,
      finish_at: payload.finish_at,
      description: payload.description,
      user_id: payload.user_id,
      userEmail: payload.userEmail,
      billable: payload.billable,
      project_id: payload.project_id,
      projectName: payload.projectName,
      entry_duration: payload.duration,
      tag_id: payload.tag_id,
      created_at: createdAt,
      is_uploaded: false,
      page_id: "",
    };

    await dynamodb
      .put({
        TableName: DYNAMODB_TABLE,
        Item: item,
      })
      .promise();
    console.log("Entry %s created succesfully", payload.id);
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
