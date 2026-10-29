import { solveCollisions } from './collisions';

self.onmessage = ({ data: [links, shape, options] }) => {
  try {
    self.postMessage({ result: solveCollisions(links, shape, options) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
