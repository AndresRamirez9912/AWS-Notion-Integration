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

function validateDate(started_at, finish_at) {
  if (started_at > finish_at) {
    const error = new Error("Start date must be before end date");
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
    !payload.user ||
    !payload.project ||
    !payload.duration
  ) {
    const error = new Error("Some Parameter is Empty");
    error.code = 400;
    throw error;
  }
  return null;
}

function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d) && d.toISOString() === str; // valid date
}

module.exports = {
  validateDate,
  validatePayload,
  validateURLQuery,
  validateCompleteEntry,
  isIsoDate,
};
