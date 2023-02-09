const { Client } = require("@notionhq/client");
const Entry = require("../../src/models/entry");

const notion = new Client({ auth: "local" });

jest.mock("@notionhq/client", () => {
  const mockCreate = {
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockPages = {
    pages: mockCreate,
  };
  const mockClient = jest.fn(() => mockPages);
  return { Client: mockClient };
});

describe("createTmeEntry.handler", () => {
  const input = {
    time_entry: {
      id: "317a00f4-9f39-42d0-90c7-589a68fc5e90",
      started_at: "2022-12-20T16:11:00.000Z",
      finish_at: "2022-12-20T16:14:00.000Z",
      description: "ijasodij19 1 212",
      user_id: 123456,
      userEmail: "andres@kommit.co",
      billable: true,
      project_id: 1234567,
      projectName: "podnation",
      duration: 180,
      tag_id: 100,
      is_uploaded: false,
      page_id: " ",
    },
  };

  test("Success adding an Entry", async () => {
    const expectedId = "26a2fab8-f92b-44ff-a53b-92d36137d277";
    notion.pages.create.mockReturnValueOnce({
      id: "26a2fab8-f92b-44ff-a53b-92d36137d277",
    });

    const newEntry = new Entry(
      input.time_entry.id,
      input.time_entry.started_at,
      input.time_entry.finish_at,
      input.time_entry.user_id,
      input.time_entry.userEmail,
      input.time_entry.description,
      input.time_entry.billable,
      input.time_entry.duration,
      input.time_entry.tag_id,
      input.time_entry.project_id,
      input.time_entry.projectName
    );
    newEntry.addEntry().then((response) => {
      expect(response.id).toBe(expectedId);
    });
  });

  test("Success editing an Entry", async () => {
    const pageId = "26a2fab8-f92b-44ff-a53b-92d36137d277";
    notion.pages.update.mockReturnValueOnce({});

    const newEntry = new Entry(
      input.time_entry.id,
      input.time_entry.started_at,
      input.time_entry.finish_at,
      input.time_entry.user_id,
      input.time_entry.userEmail,
      input.time_entry.description,
      input.time_entry.billable,
      input.time_entry.duration,
      input.time_entry.tag_id,
      input.time_entry.project_id,
      input.time_entry.projectName
    );
    newEntry.editEntry(pageId);
    expect(newEntry.entry.page_id).toBe(pageId);
  });
});
