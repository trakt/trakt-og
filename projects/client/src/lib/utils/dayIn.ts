/** `YYYY-MM-DD` of an instant in a zone. en-CA formats dates that way. */
export const dayIn = (at: string | Date, timeZone: string | undefined) =>
  new Date(at).toLocaleDateString('en-CA', { timeZone });
