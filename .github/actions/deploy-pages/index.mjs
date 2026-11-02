// JavaScript actions run on the runner's own Node.js 24 and receive their inputs as INPUT_* variables.
import { main, fail } from '../../../scripts/deploy-pages.mjs';
main().catch(fail);
