// Shared by the artifact upload and the Pages deployment: retry only failures
// that a later attempt can fix (network loss, HTTP 429 and 5xx), never refusals.
export function isTransient(error) {
  const chain = [];
  for (let item = error; item && !chain.includes(item); item = item.cause) chain.push(item);
  const statuses = chain.map((e) => Number(e.statusCode || e.status || e.response?.status)).filter(Boolean);
  const message = chain.map((e) => `${e.code || ''} ${e.message || ''}`).join(' ');
  if (
    statuses.some((n) => n >= 400 && n < 500 && n !== 429) ||
    /\b(400|401|403|404|409|422)\b|forbidden|unauthorized|not accessible by integration/i.test(message)
  )
    return false;
  return (
    statuses.some((n) => n === 429 || n >= 500) ||
    /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH|EPIPE|socket hang up|fetch failed|TimeoutError|\b(429|5\d\d)\b/i.test(
      message,
    )
  );
}
