import { installSolverWorker } from '@link-foundation/ui-components/links-view';
import { solveCollisions } from './collisions';

installSolverWorker(self, (links, { shape, options }) => solveCollisions(links, shape, options));
