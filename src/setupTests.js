// jest-dom adds custom matchers for asserting on DOM nodes, such as
// expect(element).toHaveTextContent(/react/i).
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
