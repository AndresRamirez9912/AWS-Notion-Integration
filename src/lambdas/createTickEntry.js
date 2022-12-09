'use strict';

const REGION = process.env.REGION;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: REGION });

module.exports.handler = async (event, context) => {
  try {
    const tickEntry = {
      id: context.awsRequestId,
      data: JSON.parse(event.body),
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: DYNAMODB_TABLE,
      Item: tickEntry
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(tickEntry)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
