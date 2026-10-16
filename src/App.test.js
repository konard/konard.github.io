import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import github from './data/github.json';

describe('App', () => {
  test('renders the name, headline and every CV section', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Konstantin Diachenko/ })).toBeInTheDocument();
    [
      'Companies & ventures',
      'Open-source ecosystem',
      'Contributions & languages',
      'Technologies',
      'Featured projects',
      'Published packages',
      'Community, writing & education',
      'Universal problem solving algorithm',
      'Contacts & social media',
    ].forEach((title) => {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    });
  });

  test('every navigation link points to an existing section', () => {
    const { container } = render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    const links = within(nav).getAllByRole('link').filter((a) => a.getAttribute('href') !== '#top');
    expect(links.length).toBeGreaterThan(5);
    links.forEach((a) => {
      expect(container.querySelector(a.getAttribute('href'))).not.toBeNull();
    });
  });

  test('shows companies on the timeline and social links', () => {
    render(<App />);
    expect(screen.getAllByText('LinksPlatform').length).toBeGreaterThan(0);
    expect(screen.getByText('Kaiten')).toBeInTheDocument();
    const contacts = document.getElementById('contacts');
    expect(within(contacts).getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/konard');
    within(contacts).getAllByRole('link').forEach((a) => {
      expect(a).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
  });

  test('contributions chart toggles between log and linear scale', () => {
    render(<App />);
    const log = screen.getByRole('button', { name: 'Log scale' });
    const linear = screen.getByRole('button', { name: 'Linear' });
    expect(log).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(linear);
    expect(linear).toHaveAttribute('aria-pressed', 'true');
    expect(log).toHaveAttribute('aria-pressed', 'false');
  });

  test('chart bars expose a tooltip on focus', () => {
    render(<App />);
    const last = github.contributions[github.contributions.length - 1];
    const bar = screen.getByLabelText(new RegExp(`^${last.year}: .* contributions$`));
    fireEvent.focus(bar);
    expect(screen.getByRole('status')).toHaveTextContent(`${last.year}`);
    fireEvent.blur(bar);
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('project language filter narrows the list', () => {
    render(<App />);
    const projects = document.querySelector('.projects');
    const before = projects.children.length;
    fireEvent.click(screen.getByRole('button', { name: 'Rust' }));
    const after = document.querySelector('.projects').children.length;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });
});
