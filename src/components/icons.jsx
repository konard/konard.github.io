// SVG icons of the site (issue #47: "use high-quality SVG icons for social
// networks, and SVG instead of emojis everywhere"). Emojis and symbol glyphs
// look different in every font and system, often do not follow the text
// colour and are read aloud by screen readers; SVG icons are the same
// everywhere, take the colour of the text and are hidden from assistive
// technology (the label next to them is read instead).
//
// Brand marks come from Simple Icons (CC0, https://simpleicons.org), interface
// icons from Lucide (ISC, https://lucide.dev). Both are imported by name, so
// only the icons used here end up in the bundle.
import {
  siCodersrank,
  siDiscord,
  siGithub,
  siHabr,
  siNpm,
  siNuget,
  siRust,
  siStackoverflow,
  siTelegram,
  siVk,
  siX,
  siYoutube,
} from 'simple-icons';
import {
  Atom,
  BriefcaseBusiness,
  Circle,
  CodeXml,
  Cog,
  Database,
  Diamond,
  Flame,
  Heart,
  Hexagon,
  Keyboard,
  Mail,
  Sparkle,
  Sparkles,
  Spline,
  Star,
} from 'lucide-react';

/**
 * LinkedIn is in neither library (both removed it at the trademark owner's
 * request), so a plain "in" in a rounded square is drawn here instead of the logo.
 */
const LINKEDIN = {
  title: 'LinkedIn',
  path: 'M4 1h16a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3zm1.6 7.2V19h3.4V8.2zm1.7-5.1a1.95 1.95 0 1 0 0 3.9 1.95 1.95 0 0 0 0-3.9zM10.8 8.2V19h3.4v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V19h3.4v-6.1c0-3-.6-5.2-4.1-5.2-1.7 0-2.8.9-3.2 1.8h-.1V8.2z',
};

/** The brand mark of every contact (`socials[].id` of src/data/profile.js). */
export const BRANDS = {
  github: siGithub,
  telegram: siTelegram,
  x: siX,
  youtube: siYoutube,
  vk: siVk,
  discord: siDiscord,
  stackoverflow: siStackoverflow,
  codersrank: siCodersrank,
  habr: siHabr,
  linkedin: LINKEDIN,
  npm: siNpm,
  nuget: siNuget,
  crates: siRust,
};

/** Contacts without a brand mark of their own. */
const PLAIN = { email: Mail, habrcareer: BriefcaseBusiness };

/** Whether a contact has an icon of its own. */
export const hasContactIcon = (id) => id in BRANDS || id in PLAIN;

/** The icon of a contact: its brand mark, a plain icon, or null when there is none. */
export function ContactIcon({ id, className = 'icon' }) {
  const brand = BRANDS[id];
  if (brand)
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <path d={brand.path} />
      </svg>
    );
  const Plain = PLAIN[id];
  return Plain ? <Plain className={className} aria-hidden="true" focusable="false" /> : null;
}

/** Props shared by the Lucide icons of the site: the size and colour of the text around them. */
export const iconProps = { className: 'icon', size: '1em', strokeWidth: 2, 'aria-hidden': true, focusable: false };

/** The star of GitHub stars and favourite languages (was the ★ glyph). */
export const StarMark = () => <Star {...iconProps} fill="currentColor" strokeWidth={1.5} />;

/** A round mark in the colour of the text: the Stack Overflow badges (was the ● glyph). */
export const Dot = () => <Circle {...iconProps} fill="currentColor" strokeWidth={0} />;

/** Icons of the skill groups (`skills[].icon` of src/data/profile.js); they were symbol glyphs (⌨ ◇ ⛁ ⚛ ◈ ⚙ ⬢ ✺ ⟿ ✦). */
export const SKILL_ICONS = {
  keyboard: Keyboard,
  'code-xml': CodeXml,
  database: Database,
  atom: Atom,
  diamond: Diamond,
  cog: Cog,
  hexagon: Hexagon,
  sparkles: Sparkles,
  spline: Spline,
  sparkle: Sparkle,
};

/** The icon of a skill group by its name, nothing for an unknown name. */
export function SkillIcon({ name }) {
  const Icon = SKILL_ICONS[name];
  return Icon ? <Icon {...iconProps} /> : null;
}

/** Words of the bio drawn as icons, with what a screen reader says instead (they were ❤️‍🔥 and 🥰). */
const BIO_ICONS = {
  passion: [Flame, 'icon icon--passion', { en: 'love', ru: 'люблю' }],
  love: [Heart, 'icon icon--love', { en: 'love', ru: 'обожаю' }],
};

/** A bio line with its {passion} and {love} words drawn as SVG icons. */
export function BioText({ text, lang }) {
  return text.split(/\{(\w+)\}/).map((part, i) => {
    if (i % 2 === 0) return part;
    const [Icon, className, label] = BIO_ICONS[part] || [];
    if (!Icon) return `{${part}}`;
    return (
      <Icon
        key={i}
        {...iconProps}
        className={className}
        fill="currentColor"
        aria-hidden={false}
        role="img"
        aria-label={label[lang] || label.en}
      />
    );
  });
}
