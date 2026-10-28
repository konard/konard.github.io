// JavaScript actions receive runner runtime credentials; shell steps do not.
import { main } from '../../../scripts/upload-artifact.mjs';
main({ name: process.env.INPUT_NAME, input: process.env.INPUT_PATH, pages: process.env.INPUT_PAGES === 'true' }).catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
