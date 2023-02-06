"use strict";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

const options = process.env.IS_OFFLINE
  ? { region: "localhost", endpoint: "http://localhost:8000" }
  : { region: process.env.REGION };

const AWS = require("aws-sdk");
const { Client } = require("@notionhq/client");

const userMap = require("../../data/users.json");
const projectMap = require("../../data/projects.json");
const tagMap = require("../../data/tags.json");

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const notion = new Client({ auth: NOTION_TOKEN });

class Entry {
  constructor(
    id,
    dateStart,
    dateEnd,
    userId,
    details,
    biliableCheck,
    numberOfHours,
    tagName,
    projectId
  ) {
    this.id = id;
    const date = {
      type: "date",
      date: {
        start: dateStart,
        end: dateEnd,
      },
    };
    const person = {
      type: "people",
      people: [
        {
          object: "user",
          id: userId,
        },
      ],
    };
    const project = {
      type: "relation",
      has_more: false,
      relation: [
        {
          id: projectId,
        },
      ],
    };
    const detail = {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: details,
          },
        },
      ],
    };
    const biliable = {
      type: "checkbox",
      checkbox: biliableCheck,
    };
    const hours = {
      type: "number",
      number: numberOfHours,
    };
    const tags = {
      type: "multi_select",
      multi_select: [
        {
          name: tagName,
        },
      ],
    };

    this.entry = {
      parent: {
        database_id: NOTION_DATABASE_ID,
      },
      properties: {
        Date: date,
        "Person/People": person,
        Detail: detail,
        Biliable: biliable,
        Hours: hours,
      },
    };

    if (projectId) {
      this.entry.properties.Project = project;
    }

    if (tagName) {
      this.entry.properties.Tags = tags;
    }
  }

  async addEntry() {
    const response = await notion.pages.create(this.entry);
    await updateEntries(this.id, response.id);
  }
}

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

async function updateEntries(Id, pageId) {
  try {
    return await dynamodb
      .update({
        TableName: DYNAMODB_TABLE,
        Key: { id: Id },
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

module.exports.handler = async (event) => {
  try {
    const { Items } = await getEntries();
    Items.forEach((item) => {
      const newEntry = new Entry(
        item.id,
        item.started_at,
        item.finish_at,
        userMap[item.user.name],
        item.description,
        item.billable,
        parseFloat((item.entry_duration / 3600).toFixed(2)), // Convert from seg to hours
        tagMap[item.tag_id],
        projectMap[item.project.name]
      );
      newEntry.addEntry();
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
