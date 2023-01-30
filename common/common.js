function validatePayload(payload) {
  if (!payload) {
    const error = new Error("Missing time_entry root in request body");
    error.code = 400;
    throw error;
  }
  return null;
}

function validateURLQuery(event, payload) {
  if (event.httpMethod !== "POST" && event.pathParameters.id !== payload.id) {
    const error = new Error(
      "id in path parameters does not match id in payload"
    );
    error.code = 400;
    throw error;
  }
  return null;
}

function validateDate(payload) {
  if (payload.started_at > payload.finish_at) {
    const error = new Error("Start Date major than Finish date");
    error.code = 400;
    throw error;
  }
  return null;
}

function validateCompleteEntry(payload) {
  if (
    !payload.id ||
    !payload.started_at ||
    !payload.finish_at ||
    !payload.description ||
    !payload.user_id ||
    !payload.project_id ||
    !payload.tag_id ||
    !payload.duration
  ) {
    const error = new Error("Some Parameter is Empty");
    error.code = 400;
    throw error;
  }
  return null;
}
module.exports = {
  validateDate,
  validatePayload,
  validateURLQuery,
  validateCompleteEntry,
};
