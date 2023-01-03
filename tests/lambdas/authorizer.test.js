const authorizer = require("../../src/lambdas/authorizer");

describe("authorizer.handler", () => {
  beforeAll(() => {
    process.env.AUTH_TOKEN = "123";
  });

  test("allow access with valid token", async () => {
    const awsEvent = {
      authorizationToken: "Token 123",
    };

    const response = await authorizer.handler(awsEvent);
    expect(response.policyDocument.Statement[0].Effect).toBe("Allow");
  });

  test("deny access with invalid token", async () => {
    const awsEvent = {
      authorizationToken: "Token 456",
    };

    const response = await authorizer.handler(awsEvent);
    expect(response.policyDocument.Statement[0].Effect).toBe("Deny");
  });
});
