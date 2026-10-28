import { readFileSync } from 'node:fs';
const readme = readFileSync('README.md', 'utf8');
for (const section of ['Development', 'Updating the data', 'Deployment']) {
  if (!readme.includes(`## ${section}`)) throw new Error(`README.md is missing the ${section} section`);
}
console.log('README development, data and deployment documentation is present.');
