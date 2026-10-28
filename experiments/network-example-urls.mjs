// Read the complete network examples embedded in issue Markdown.
export const networkExampleUrls = (body) =>
  [...body.matchAll(/https:\/\/konard\.github\.io\/network\/\?[^\s`]+/g)].map((match) => new URL(match[0]));
