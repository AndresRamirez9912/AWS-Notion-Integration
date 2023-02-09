const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: NOTION_TOKEN });

module.exports = class Entry {
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
    return await notion.pages.create(this.entry);
  }

  async editEntry(page_id) {
    this.entry.page_id = page_id;
    await notion.pages.update(this.entry);
  }
};
