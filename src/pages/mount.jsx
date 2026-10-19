import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';

/** Renders a page component into #root; every HTML entry of the site calls it once. */
export function mount(Page) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
