// The sound design of issue #15: the patches, the engine with a fake Web
// Audio context, which interaction plays which sound, the settings and the
// switch in the top bar.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SOUND_SPECS } from './library';
import { chooseSounds, createPlayer, playSpec, TONE_SHELF } from './engine';
import { clickEvent, startSound } from './interactions';
import { cue, soundOptions } from './options';
import PrefSwitches from '../components/PrefSwitches';
import SettingsPage from '../pages/SettingsPage';
import { DEFAULTS, FIELDS, SECTIONS } from '../settings/schema';
import { SOUND_EVENTS, SOUND_IDS, SOUND_TABS } from '../settings/schema.sound';
import { getSettings, setSettings } from '../settings/store';

/** An AudioParam that records its automation. */
const param = (value = 0) => {
  const calls = [];
  const record =
    (name) =>
    (...args) => {
      calls.push([name, ...args]);
      return undefined;
    };
  return {
    value,
    calls,
    setValueAtTime: record('set'),
    linearRampToValueAtTime: record('linear'),
    exponentialRampToValueAtTime: record('exp'),
    setTargetAtTime: record('target'),
  };
};

/** A fake AudioContext that records every node it makes. */
class FakeAudio {
  static made = [];
  constructor() {
    this.currentTime = 1;
    this.sampleRate = 8000;
    this.state = 'running';
    this.nodes = [];
    this.destination = this.node('destination');
    this.closed = false;
    FakeAudio.made.push(this);
  }
  node(kind, extra = {}) {
    const node = {
      kind, // not `type`, which the engine sets (oscillator waves, filter types)
      outputs: [],
      connect(target) {
        node.outputs.push(target);
        return target;
      },
      start: vi.fn(),
      stop: vi.fn(),
      ...extra,
    };
    this.nodes.push(node);
    return node;
  }
  createGain() {
    return this.node('gain', { gain: param(1) });
  }
  createBiquadFilter() {
    return this.node('filter', { frequency: param(), Q: param(), gain: param() });
  }
  createDynamicsCompressor() {
    return this.node('compressor', {
      threshold: param(),
      knee: param(),
      ratio: param(),
      attack: param(),
      release: param(),
    });
  }
  createConvolver() {
    return this.node('convolver');
  }
  createOscillator() {
    return this.node('oscillator', { frequency: param(), detune: param() });
  }
  createBufferSource() {
    return this.node('buffer');
  }
  createStereoPanner() {
    return this.node('panner', { pan: param() });
  }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { sampleRate, length, getChannelData: (channel) => data[channel] };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

const OPTIONS = soundOptions({ ...DEFAULTS, 'sound.on': true });

afterEach(() => {
  FakeAudio.made = [];
});

describe('the sounds (issue #15)', () => {
  it('has a patch for every sound of the settings and a setting for every patch', () => {
    expect(Object.keys(SOUND_SPECS).sort()).toEqual([...SOUND_IDS].sort());
    expect(SOUND_IDS).toHaveLength(31);
  });

  it('keeps every patch short, quiet and well formed', () => {
    for (const [id, spec] of Object.entries(SOUND_SPECS)) {
      expect(spec.voices.length, id).toBeGreaterThan(0);
      for (const voice of spec.voices) {
        expect(voice.duration, id).toBeGreaterThan(0);
        expect(voice.duration + (voice.delay ?? 0), id).toBeLessThanOrEqual(1.5);
        expect(voice.gain, id).toBeGreaterThan(0);
        expect(voice.gain, id).toBeLessThanOrEqual(0.1);
        if (voice.kind === 'tone') expect(['sine', 'square', 'triangle', 'sawtooth'], id).toContain(voice.wave);
        else expect(voice.filter, id).toBeTruthy();
      }
    }
  });

  it('defaults to a sound for every interaction but typing', () => {
    for (const [event, , , sounds] of SOUND_EVENTS) {
      expect(OPTIONS.effects[event], event).toEqual(sounds);
      for (const id of sounds) expect(SOUND_IDS).toContain(id);
    }
    expect(OPTIONS.effects.type).toEqual([]);
  });

  it('reads the sounds of an interaction up to the first empty slot', () => {
    const options = soundOptions({
      ...DEFAULTS,
      'sound.hover1': 'ion',
      'sound.hover2': 'none',
      'sound.hover3': 'halo',
      'sound.hoverLevel': 0.5,
    });
    expect(options.effects.hover).toEqual(['ion']);
    expect(options.levels.hover).toBe(0.5);
  });
});

describe('the engine', () => {
  it('plays one of the sounds at random but never the same twice in a row, each in turn, or all together', () => {
    const list = ['a', 'b', 'c'];
    expect(chooseSounds([], 'random', 0)).toEqual([]);
    expect(chooseSounds(list, 'layer', 0)).toEqual(list);
    expect([0, 1, 2, 3].map((turn) => chooseSounds(list, 'cycle', turn)[0])).toEqual(['a', 'b', 'c', 'a']);
    expect(chooseSounds(list, 'random', 0, () => 0)).toEqual(['a']);
    expect(chooseSounds(list, 'random', 0, () => 0, 'a')).toEqual(['b']);
    expect(chooseSounds(list, 'random', 0, () => 0.99, 'c')).toEqual(['b']);
    expect(chooseSounds(['a'], 'random', 0, () => 0, 'a')).toEqual(['a']);
  });

  it('schedules a patch with envelopes that end in silence, filters, FM and panning', () => {
    const audio = new FakeAudio();
    const output = audio.createGain();
    const spec = {
      repeat: 2,
      gap: 0.1,
      repeatDecay: 0.5,
      voices: [
        {
          kind: 'tone',
          wave: 'sine',
          freq: { from: 400, to: 800 },
          duration: 0.2,
          gain: 0.02,
          fm: { ratio: 2, index: 1 },
        },
        { kind: 'noise', filter: { type: 'bandpass', freq: { from: 900, to: 900 }, q: 3 }, duration: 0.1, gain: 0.01 },
      ],
    };
    const end = playSpec(spec, audio, output, { gain: 1, detune: 12, pan: 0.5, at: 2 });
    expect(end).toBeCloseTo(2 + 0.1 + 0.2 + 0.02);
    const amps = audio.nodes.filter((node) => node.kind === 'gain' && node !== output && node.gain.calls.length === 4);
    expect(amps).toHaveLength(4);
    for (const amp of amps) {
      // Silent before its first event too: a gain is 1 until then, and a source starting a
      // sample early let one sample of full-scale noise through (the repeats of mica peaked at 0.68).
      expect(amp.gain.value).toBe(0);
      expect(amp.gain.calls[0]).toEqual(['set', 0, expect.any(Number)]);
      expect(amp.gain.calls.at(-1)[0]).toBe('linear');
      expect(amp.gain.calls.at(-1)[1]).toBe(0);
    }
    // The second repeat is half as loud.
    expect(amps[2].gain.calls[1][1]).toBeCloseTo(amps[0].gain.calls[1][1] / 2);
    const oscillators = audio.nodes.filter((node) => node.kind === 'oscillator');
    expect(oscillators).toHaveLength(4); // two carriers and two modulators
    const carrier = oscillators.find((node) => node.frequency.calls.length && node.frequency.calls[0][1] === 400);
    expect(carrier.detune.value).toBe(12);
    expect(carrier.frequency.calls[1]).toEqual(['exp', 800, 2.2]);
    expect(audio.nodes.filter((node) => node.kind === 'filter')[0].Q.value).toBe(3);
    const panners = audio.nodes.filter((node) => node.kind === 'panner');
    expect(panners).toHaveLength(4);
    expect(panners[0].pan.value).toBe(0.5);
    expect(panners.every((panner) => panner.outputs[0] === output)).toBe(true);
  });

  it('schedules every patch of the library without errors', () => {
    const audio = new FakeAudio();
    for (const spec of Object.values(SOUND_SPECS)) {
      expect(playSpec(spec, audio, audio.destination)).toBeGreaterThan(audio.currentTime);
    }
  });

  it('plays the sounds of an interaction at its level, a stack of sounds no louder than one', () => {
    const player = createPlayer(
      { ...OPTIONS, mode: 'layer', pitch: 0, levels: { ...OPTIONS.levels, activate: 0.5 } },
      { Audio: FakeAudio, random: () => 0.5 },
    );
    expect(player.trigger('activate')).toEqual(['cobalt', 'relay']);
    const [audio] = FakeAudio.made;
    expect(audio).toBeTruthy();
    const first = SOUND_SPECS.cobalt.voices[0];
    const peaks = audio.nodes
      .filter((node) => node.kind === 'gain' && node.gain.calls.length === 4)
      .map((node) => node.gain.calls[1][1]);
    expect(peaks[0]).toBeCloseTo((first.gain * 0.5) / Math.SQRT2);
    expect(player.trigger('type')).toEqual([]);
  });

  it('sets the volume, the tone and the echo on the bus and rebuilds the room when its size changes', () => {
    const player = createPlayer(OPTIONS, { Audio: FakeAudio });
    player.play('ion');
    const [audio] = FakeAudio.made;
    const convolver = audio.nodes.find((node) => node.kind === 'convolver');
    const room = convolver.buffer;
    expect(room.length).toBe(Math.ceil(audio.sampleRate * OPTIONS.room));
    player.configure({ ...OPTIONS, volume: 0.3, tone: 'bright', reverb: 0.5, room: 3 });
    expect(convolver.buffer).not.toBe(room);
    expect(convolver.buffer.length).toBe(audio.sampleRate * 3);
    const [input, ...gains] = audio.nodes.filter((node) => node.kind === 'gain');
    expect(input.gain.calls.at(-1)).toEqual(['target', 0.3, 1, 0.02]);
    const shelf = audio.nodes.find((node) => node.kind === 'filter');
    expect(shelf.gain.calls.at(-1)[1]).toBe(TONE_SHELF.bright);
    expect(gains[0].gain.calls.at(-1)[1]).toBeCloseTo(0.45);
  });

  it('is silent without Web Audio, at zero volume, before the first gesture, and closes its context', () => {
    expect(createPlayer(OPTIONS, { Audio: undefined }).trigger('hover')).toEqual([]);
    expect(createPlayer({ ...OPTIONS, volume: 0 }, { Audio: FakeAudio }).trigger('hover')).toEqual([]);
    expect(FakeAudio.made).toHaveLength(0);
    const activation = Object.getOwnPropertyDescriptor(navigator, 'userActivation');
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: false }, configurable: true });
    try {
      expect(createPlayer(OPTIONS, { Audio: FakeAudio }).trigger('hover')).toEqual([]);
      expect(FakeAudio.made).toHaveLength(0);
    } finally {
      if (activation) Object.defineProperty(navigator, 'userActivation', activation);
      else delete navigator.userActivation;
    }
    const player = createPlayer(OPTIONS, { Audio: FakeAudio });
    expect(player.trigger('hover')).toEqual(['quartz']);
    player.suspend();
    expect(FakeAudio.made[0].state).toBe('suspended');
    player.trigger('hover');
    expect(FakeAudio.made[0].state).toBe('running');
    player.close();
    expect(FakeAudio.made[0].closed).toBe(true);
  });

  it('pans a sound towards the pointer only when stereo is on, by the stereo width', () => {
    const pans = (options) => {
      FakeAudio.made = [];
      const player = createPlayer({ ...options, pitch: 0 }, { Audio: FakeAudio });
      player.setPan(2);
      player.play('ion');
      return FakeAudio.made[0].nodes.filter((node) => node.kind === 'panner').map((node) => node.pan.value);
    };
    expect(pans(OPTIONS)).toEqual([OPTIONS.width]);
    expect(pans({ ...OPTIONS, stereo: false })).toEqual([]);
  });
});

describe('the interactions', () => {
  const element = (html) => {
    document.body.innerHTML = html;
    return document.body.firstElementChild;
  };

  it('knows the sound of a click on each kind of control', () => {
    expect(clickEvent(element('<a href="/">x</a>'))).toBe('activate');
    expect(clickEvent(element('<button><span>x</span></button>').firstElementChild)).toBe('activate');
    expect(clickEvent(element('<button aria-pressed="false">x</button>'))).toBe('toggle');
    expect(clickEvent(element('<button data-sound="open">x</button>'))).toBe('open');
    expect(clickEvent(element('<button disabled>x</button>'))).toBe(null);
    expect(clickEvent(element('<input type="checkbox">'))).toBe('toggle');
    expect(clickEvent(element('<input type="radio">'))).toBe('select');
    expect(clickEvent(element('<input type="range">'))).toBe(null);
    expect(clickEvent(element('<div role="tab">x</div>'))).toBe('select');
    expect(clickEvent(element('<details><summary>x</summary></details>').firstElementChild)).toBe(null);
    expect(clickEvent(element('<p>x</p>'))).toBe(null);
    expect(clickEvent(null)).toBe(null);
  });

  it('sounds pointing, clicks, sliders, typing, choices, details and cues, and stops listening when stopped', () => {
    let time = 0;
    const player = {
      trigger: vi.fn(),
      setPan: vi.fn(),
      configure: vi.fn(),
      play: vi.fn(),
      suspend: vi.fn(),
      close: vi.fn(),
    };
    const session = startSound(OPTIONS, { player, now: () => time });
    document.body.innerHTML = `
      <button id="b">b</button><a id="a" href="/">a</a>
      <input id="r" type="range"><input id="t" type="text"><select id="s"><option>1</option></select>
      <details id="d"><summary>d</summary></details><div data-tooltip-root id="c"></div>`;
    const $ = (id) => document.getElementById(id);
    const events = () => player.trigger.mock.calls.map(([event]) => event);

    fireEvent.pointerOver($('b'), { pointerType: 'mouse' });
    fireEvent.pointerOver($('b'), { pointerType: 'mouse' }); // still on it
    time += 10;
    fireEvent.pointerOver($('a'), { pointerType: 'mouse' }); // within the gap
    time += 100;
    fireEvent.pointerOver($('b'), { pointerType: 'mouse' });
    fireEvent.pointerOver($('a'), { pointerType: 'touch' });
    expect(events()).toEqual(['hover', 'hover']);

    player.trigger.mockClear();
    fireEvent.click($('a'), { clientX: 0 });
    expect(player.setPan).toHaveBeenLastCalledWith(-1);
    fireEvent.input($('r'));
    fireEvent.input($('r')); // a slider sounds at most every 70 ms
    fireEvent.input($('t'));
    fireEvent.change($('s'));
    $('d').open = true;
    fireEvent($('d'), new Event('toggle'));
    $('d').open = false;
    fireEvent($('d'), new Event('toggle'));
    fireEvent.pointerMove($('c'), { clientX: 0 });
    fireEvent.pointerMove($('c'), { clientX: 0 }); // a chart sounds at most every 90 ms
    act(() => cue('notify'));
    expect(events()).toEqual(['activate', 'select', 'type', 'select', 'open', 'close', 'scan', 'notify']);

    session.update({ ...OPTIONS, volume: 0.5 });
    expect(player.configure).toHaveBeenCalledWith({ ...OPTIONS, volume: 0.5 });
    session.preview('prism');
    expect(player.play).toHaveBeenCalledWith('prism');

    session.stop();
    expect(player.close).toHaveBeenCalled();
    player.trigger.mockClear();
    time += 1000;
    fireEvent.click($('b'));
    act(() => cue('notify'));
    expect(player.trigger).not.toHaveBeenCalled();
  });
});

describe('the settings of the sound', () => {
  const soundFields = () => SECTIONS.find((section) => section.id === 'sound').fields;

  it('has a section whose settings only scripts read', () => {
    expect(soundFields().length).toBeGreaterThan(40);
    expect(soundFields().every((field) => field.css === false)).toBe(true);
    expect(FIELDS.find((field) => field.key === 'sound.on').d).toBe(false);
  });

  it('shows the next sound of an interaction once the one before is chosen', () => {
    const shown = (settings) =>
      soundFields()
        .filter((field) => field.key.startsWith('sound.hover') && (!field.when || field.when(settings)))
        .map((field) => field.key);
    expect(shown({ ...DEFAULTS })).toEqual([]);
    const on = { ...DEFAULTS, 'sound.on': true };
    expect(shown(on)).toEqual(['sound.hover1', 'sound.hover2', 'sound.hoverLevel']);
    expect(shown({ ...on, 'sound.hover2': 'ion' })).toEqual([
      'sound.hover1',
      'sound.hover2',
      'sound.hover3',
      'sound.hoverLevel',
    ]);
    expect(shown({ ...on, 'sound.hover1': 'none' })).toEqual(['sound.hover1']);
  });

  it('puts every interaction in exactly one tab', () => {
    const tabbed = SOUND_TABS.flatMap(([, , , events]) => events);
    expect([...tabbed].sort()).toEqual(SOUND_EVENTS.map(([event]) => event).sort());
  });

  it('shows the tabs of the interactions only when the sound is on', () => {
    render(<SettingsPage />);
    const section = () => document.getElementById('sound');
    expect(section().querySelector('[role="tablist"]')).toBe(null);
    act(() => setSettings({ 'sound.on': true }));
    const tabs = [...section().querySelectorAll('[role="tab"]')].map((tab) => tab.textContent);
    expect(tabs).toEqual(['Pointing', 'Pressing', 'Panels and text', 'Messages']);
    expect(screen.queryByRole('combobox', { name: 'Pressing a button or a link' })).toBe(null);
    fireEvent.click(screen.getByRole('tab', { name: 'Pressing' }));
    expect(screen.getByRole('combobox', { name: 'Pressing a button or a link' }).value).toBe('cobalt');
    expect(screen.queryByRole('combobox', { name: 'Pointing at a link or a button' })).toBe(null);
    // The options of all the interactions stay on every tab.
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy();
  });

  it('has a ▶ for every chosen sound on the settings page', () => {
    setSettings({ ...DEFAULTS, 'sound.on': true });
    render(<SettingsPage />);
    const play = screen.getByRole('button', { name: 'Play: Pointing at a link or a button' });
    expect(play.disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Play: Pointing at a link or a button, sound 2' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Look at the background' }).dataset.sound).toBe('open');
  });

  it('switches the sound on and off from the top bar', () => {
    render(<PrefSwitches />);
    const button = screen.getByRole('button', { name: 'Sounds of the interface' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(getSettings()['sound.on']).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(getSettings()['sound.on']).toBe(false);
  });
});
