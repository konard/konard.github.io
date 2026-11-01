import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import github from './data/github.lino';
import { setLang } from './i18n/prefs';

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
    const links = within(nav)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') !== '#top');
    expect(links.length).toBeGreaterThan(5);
    links.forEach((a) => {
      expect(container.querySelector(a.getAttribute('href'))).not.toBeNull();
    });
  });

  test('shows companies on the timeline and social links', () => {
    render(<App />);
    expect(screen.getAllByText('LinksPlatform').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 3, name: 'Kaiten' })).toBeInTheDocument();
    // Issue #11: Kaiten ended in Nov 2025, the current job is Evirma.
    expect(screen.getByLabelText(/^Kaiten, Development Team Lead: Jul 2024 – Nov 2025$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Evirma, Tech Lead: May 2026 – present$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Capico LLC, Senior Software Engineer: Nov 2025 – May 2026$/)).toBeInTheDocument();
    const contacts = document.getElementById('contacts');
    expect(within(contacts).getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/konard');
    within(contacts)
      .getAllByRole('link')
      .forEach((a) => {
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

  test('links the CV and every position from the home page', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', '/cv/?lang=en');
    const more = document.querySelector('#experience .section__more');
    expect(within(more).getByRole('link', { name: 'Rust' })).toHaveAttribute('href', '/experience/?role=rust');
    expect(within(more).getAllByRole('link')).toHaveLength(14);
  });

  test('is translated to Russian without untranslated objects', () => {
    render(<App />);
    act(() => setLang('ru', { save: false }));
    expect(screen.getByRole('heading', { level: 1, name: /Константин Дьяченко/ })).toBeInTheDocument();
    ['Компании и проекты', 'Технологии', 'Сообщество, публикации и образование', 'Контакты и соцсети'].forEach(
      (title) => expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Скачать резюме' })).toHaveAttribute('href', '/cv/?lang=ru');
    expect(screen.getByText('Лет профессионального опыта')).toBeInTheDocument();
    expect(screen.getByText(/C1 — продвинутый/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\[object Object\]|undefined/);
  });
});
