"use strict";

const generatePolicy = ({ allow }) => {
  return {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: "*",
        },
      ],
    },
  };
};

exports.handler = async function (event) {
  const authToken = event.authorizationToken;
  const [_, token] = authToken.split("Token token=");

  const allow = token === process.env.AUTH_TOKEN;
  return generatePolicy({ allow });
};
