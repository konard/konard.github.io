import { render, screen } from '@testing-library/react';
import App from '../App';
import { RepoItem } from './RepoList';
import { Story } from '../pages/BlogPage';

it('shows a daily contribution calendar and personal open-source code totals', () => {
  const { container } = render(<App />);
  expect(container.querySelectorAll('.contribution-calendar__day').length).toBeGreaterThanOrEqual(365);
  expect(screen.getByRole('heading', { name: 'My open-source code' })).toBeInTheDocument();
  expect(screen.getByText(/Closed-source experience/)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Data effective/ })[0]).toHaveAttribute('href', '#data-sources');
});

it('shows code, comments and blanks for every repository language', () => {
  render(
    <RepoItem
      repo={{
        fullName: 'example/project',
        owner: 'example',
        name: 'project',
        fields: [],
        stars: 0,
        pushedAt: '2026-10-28',
        sourceLines: { JavaScript: { code: 20, comment: 3, blank: 2 } },
      }}
    />,
  );
  expect(screen.getByText(/20 source lines/)).toBeInTheDocument();
  expect(screen.getByText(/JavaScript: 20 code/)).toBeInTheDocument();
});

it('tries the original social embed by default and keeps an archive fallback', () => {
  const post = {
    id: 'x-1',
    network: 'x',
    lang: 'en',
    url: 'https://x.com/konard/status/1',
    publishedAt: '2026-10-28T00:00:00Z',
    embed: { type: 'x', id: '1' },
    html: '<p>Historical text</p>',
    media: [],
  };
  const { container } = render(<Story story={{ posts: [post] }} lang="en" />);
  expect(container.querySelector('iframe, [data-social-embed]')).not.toBeNull();
  expect(screen.getByText(/Historical text/)).toBeInTheDocument();
});
