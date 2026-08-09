export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function sendError(res, error) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.code });
  }
  console.error("Unhandled API Error:", error);
  return res.status(500).json({ error: "SERVER_ERROR" });
}
