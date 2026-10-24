import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import NetworkGallery, { networkHref } from '../components/NetworkGallery';
import { NetworkExample } from '../components/MetaTheory';
import { decode } from '../links/configurations';
import { STYLE_DEFAULTS, normalizeStyle } from '../links/style';
import NetworkPage, { DEFAULT_CODE, networkQuery, readNetwork } from './NetworkPage';
import { randomLinks, stepped } from './NetworkEditor';

const go = (url = '/') => window.history.replaceState(null, '', url);
afterEach(() => {
  go('/');
  localStorage.clear();
});

const field = (name) => screen.getByLabelText(name);
const preview = () => document.querySelector('.network__preview');

describe('gallery cards open the page of their network (issue #17)', () => {
  it('links each card to /network/ and has a share icon that only the hover shows', () => {
    render(<NetworkGallery initial={1} />);
    const list = screen.getByRole('list', { name: 'Networks of 1 link' });
    const first = list.firstChild;
    expect(within(first).getAllByRole('link')[0]).toHaveAttribute('href', '/network/?code=00');
    const share = within(first).getByRole('link', { name: 'Share 00₂' });
    expect(share).toHaveAttribute('href', '/network/?code=00#share');
    expect(share.className).toBe('symbols__share');
    // The icon has no text and no paths: the card still reads as its notation only.
    expect(first.textContent).toBe('00₂');
    expect(share.querySelectorAll('path')).toHaveLength(0);
    expect(networkHref('01 20')).toBe('/network/?code=0120');
  });

  it('links the example of the theory to its page', () => {
    render(<NetworkExample example={{ code: '11 22 12' }} />);
    expect(screen.getByRole('link', { name: 'Edit and share this network' })).toHaveAttribute(
      'href',
      '/network/?code=112212',
    );
  });
});

describe('the address keeps the network and its picture (issue #17)', () => {
  it('reads and writes the code and the changed options', () => {
    expect(readNetwork('').links).toEqual(decode(DEFAULT_CODE));
    expect(readNetwork('?code=0130').links).toEqual(decode(DEFAULT_CODE));
    const { links, style } = readNetwork('?code=0120&card=false&end=dot');
    expect(links).toEqual(decode('01 20'));
    expect(style).toEqual(normalizeStyle({ card: false, end: 'dot' }));
    expect(networkQuery(links, style)).toBe('?code=0120&end=dot&card=false');
    expect(networkQuery(links, STYLE_DEFAULTS)).toBe('?code=0120');
  });

  it('steps through the networks and draws random ones of the same size', () => {
    expect(stepped(decode('22 22'), 1)).toEqual(decode('00 00'));
    expect(stepped(decode('00 00'), -1)).toEqual(decode('22 22'));
    expect(stepped(decode('01 20'), 1)).toEqual(decode('01 21'));
    expect(randomLinks(3, () => 0.99)).toEqual(decode('33 33 33'));
  });
});

describe('NetworkPage (issue #17)', () => {
  it('opens the network of the address and shows it in every notation', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Links network 01₃ 20₃');
    expect(field('Math notation (the links theory)')).toHaveValue('λ = {1 ↦ (0, 1), 2 ↦ (2, 0)}');
    expect(field('Pairs with the base')).toHaveValue('01₃ 20₃');
    expect(field('N-ary number')).toHaveValue('0120₃');
    expect(field('The same number in decimal')).toHaveValue('15');
    expect(field('Links notation')).toHaveValue('(1: 0 1) (2: 2 0)');
    expect(preview().innerHTML).toContain('<svg');
    ['notations', 'links', 'style', 'share'].forEach((id) => expect(document.getElementById(id)).toBeTruthy());
    // Every label points to one control: no id is used twice.
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('changes every notation, the picture and the address when one notation is edited', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    fireEvent.change(field('N-ary number'), { target: { value: '012011₄' } });
    expect(field('Links notation')).toHaveValue('(1: 0 1) (2: 2 0) (3: 1 1)');
    expect(field('Math notation (the links theory)')).toHaveValue('λ = {1 ↦ (0, 1), 2 ↦ (2, 0), 3 ↦ (1, 1)}');
    // The field being typed in keeps its text.
    expect(field('N-ary number')).toHaveValue('012011₄');
    expect(window.location.search).toBe('?code=012011');
    expect(within(preview()).getByRole('img')).toHaveAccessibleName('Links network 01₄ 20₄ 11₄');

    fireEvent.change(field('Links notation'), { target: { value: '(1: 1 1)' } });
    expect(field('Pairs with the base')).toHaveValue('11₂');
    expect(window.location.search).toBe('?code=11');
  });

  it('keeps an invalid text, says what is wrong and leaves the network as it was', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    fireEvent.change(field('N-ary number'), { target: { value: '0130' } });
    expect(field('N-ary number')).toHaveValue('0130');
    expect(field('N-ary number')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('A link refers to 3, but there are only the links 0…2.');
    expect(field('Links notation')).toHaveValue('(1: 0 1) (2: 2 0)');
  });

  it('edits the links one by one: references, colours, turns, adding and removing', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    fireEvent.change(screen.getByLabelText('Link 2: target'), { target: { value: '2' } });
    expect(field('Pairs with the base')).toHaveValue('01₃ 22₃');
    fireEvent.click(screen.getByRole('button', { name: /Add a link/ }));
    expect(field('Pairs with the base')).toHaveValue('01₄ 22₄ 00₄');
    fireEvent.change(screen.getByLabelText('Link 3: colour'), { target: { value: '#ff0000' } });
    expect(preview().innerHTML).toContain('#ff0000');
    expect(window.location.search).toContain('palette=custom');
    fireEvent.change(screen.getByLabelText('Link 2: turn of the target, °'), { target: { value: '30' } });
    expect(new URLSearchParams(window.location.search).get('turns')).toBe('0 0,0 30');
    fireEvent.click(screen.getByRole('button', { name: 'Remove: Link 1' }));
    // Link 2 becomes link 1 and keeps its turn; references to the removed link become 0.
    expect(field('Pairs with the base')).toHaveValue('11₃ 00₃');
    expect(new URLSearchParams(window.location.search).get('turns')).toBe('0 30');
    fireEvent.click(screen.getByRole('button', { name: /Next network/ }));
    expect(field('Pairs with the base')).toHaveValue('11₃ 01₃');
  });

  it('switches between the card and a plain black background, and every option changes the picture', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    expect(preview().innerHTML).toContain(STYLE_DEFAULTS.cardColor);
    fireEvent.click(screen.getByRole('button', { name: 'Plain black' }));
    expect(preview().innerHTML).not.toContain(STYLE_DEFAULTS.cardColor);
    expect(preview().innerHTML).toContain('fill="#000000"');
    expect(window.location.search).toContain('card=false');
    fireEvent.click(screen.getByRole('button', { name: 'Card (as in the gallery)' }));
    expect(window.location.search).toBe('?code=0120');

    fireEvent.change(screen.getByLabelText('End of a link'), { target: { value: 'dot' } });
    expect(window.location.search).toContain('end=dot');
    fireEvent.change(screen.getByRole('combobox', { name: 'Background' }), { target: { value: 'transparent' } });
    expect(preview().className).toContain('is-transparent');
  });

  it('reduces overlaps of lines on request (experimental)', () => {
    go('/network/?code=221331');
    render(<NetworkPage />);
    fireEvent.click(screen.getByLabelText('Reduce overlaps automatically'));
    expect(screen.getByText(/overlaps \d+\.\d → \d+\.\d/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Write the turns into the table of links' }));
    expect(new URLSearchParams(window.location.search).get('turns')).toMatch(/-?\d+ -?\d+/);
    expect(screen.queryByText(/overlaps \d+\.\d → /)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all turns' }));
    expect(new URLSearchParams(window.location.search).get('turns')).toBeNull();
  });

  it('downloads, copies and links to the share dialogs with the address of the picture', () => {
    go('/network/?code=0120&end=dot');
    render(<NetworkPage />);
    const share = document.getElementById('share');
    ['⤓ SVG', '⤓ PNG', '⤓ JPEG', '⤓ WebP', '⤓ .lino'].forEach((name) =>
      expect(within(share).getByRole('button', { name })).toBeInTheDocument(),
    );
    expect(within(share).getByRole('button', { name: 'Copy the link' })).toBeInTheDocument();
    expect(within(share).getByLabelText('Link to this picture')).toHaveValue(
      `${window.location.origin}/network/?code=0120&end=dot`,
    );
    const telegram = share.querySelector('[data-share="telegram"]');
    expect(telegram.getAttribute('href')).toContain(encodeURIComponent('/network/?code=0120&end=dot'));
  });

  it('saves a style in the browser and applies it again', () => {
    go('/network/?code=0120');
    render(<NetworkPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Plain black' }));
    fireEvent.change(screen.getByLabelText('Name of the style'), { target: { value: 'Mine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save the style' }));
    expect(JSON.parse(localStorage.getItem('network.styles'))[0].name).toBe('Mine');
    fireEvent.click(screen.getByRole('button', { name: 'Card (as in the gallery)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mine' }));
    expect(window.location.search).toContain('card=false');
  });
});
