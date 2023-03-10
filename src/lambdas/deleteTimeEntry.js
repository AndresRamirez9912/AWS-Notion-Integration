const { DYNAMODB_TABLE, NOTION_TOKEN } = process.env;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const { Client } = require("@notionhq/client");
const common = require("../common/common");

const notion = new Client({ auth: NOTION_TOKEN });

module.exports.handler = async (event) => {
  try {
    const { time_entry: payload } = JSON.parse(event.body);

    common.validatePayload(payload);
    common.validateURLQuery(event, payload);

    // Validate if the entry was uploaded to Notion
    const item = await dynamodb
      .get({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: payload.id,
        },
      })
      .promise();

    // Delete the entry
    if (item.Item.is_uploaded) {
      await notion.pages.update({
        page_id: item.Item.page_id,
        archived: true,
      });
    }

    await dynamodb
      .delete({
        TableName: DYNAMODB_TABLE,
        Key: {
          id: payload.id,
        },
      })
      .promise();
    console.log("Entry %s eliminated succesfully", payload.id);
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
