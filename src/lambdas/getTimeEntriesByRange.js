const { DYNAMODB_TABLE } = process.env;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);
const commons = require("../common/common");

module.exports.handler = async (event) => {
  try {
    const { start, end } = event.queryStringParameters;

    if (!commons.isIsoDate(start) || !commons.isIsoDate(end))
      throw new Error(
        "Query parameters 'start' and 'end' are invalid or not provided"
      );

    commons.validateDate(start, end);

    const { Items } = await dynamodb
      .scan({
        TableName: DYNAMODB_TABLE,
        FilterExpression: "#started_at >= :start and #finish_at <= :end",
        ExpressionAttributeNames: {
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
