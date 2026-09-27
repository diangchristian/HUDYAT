/*
 * An Error carrying the HTTP status a controller should respond with.
 * Services throw these; controllers read `statusCode` (defaulting to
 * 500 when it's absent).
 */
export const httpError = (statusCode: number, message: string) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};
