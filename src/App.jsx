import github from './data/github.json';
import habr from './data/habr.json';
import { contributions, sourceLines } from './data/indicators.json';
import ContributionCalendar from './components/ContributionCalendar';
import SourceLines from './components/SourceLines';
import { DataMark } from './components/DataSources';
import {
  achievements,
  education,
  experience,
  favoriteLanguages,
  featuredProjects,
  problemSolving,
  profile,
  languages,
  positions,
  publications,
  skillGroups,
  socials,
} from './data/profile';
import { metaTheory } from './data/theory';
import Layout from './components/Layout';
import Section from './components/Section';
import Hero from './components/Hero';
import StatTiles from './components/StatTiles';
import Timeline from './components/Timeline';
import EcosystemMap from './components/EcosystemMap';
import ContributionsChart from './components/ContributionsChart';
import LanguagesChart from './components/LanguagesChart';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Registries from './components/Registries';
import { Education, Publications, StackOverflowCard } from './components/Community';
import ProblemSolving from './components/ProblemSolving';
import ProblemSolvingDiagram from './components/ProblemSolvingDiagram';
import MetaTheory from './components/MetaTheory';
import HabrCards from './components/HabrCards';
import LanguageCloud from './components/LanguageCloud';
import PageCards from './components/PageCards';
import Contacts from './components/Contacts';
import { plural } from './i18n/plural';
import { useLang } from './i18n/prefs';

const NAV = [
  ['experience', { en: 'Experience', ru: 'Опыт' }],
  ['theory', { en: 'Theory', ru: 'Теория' }],
  ['method', { en: 'Method', ru: 'Метод' }],
  ['ecosystem', { en: 'Ecosystem', ru: 'Экосистема' }],
  ['activity', { en: 'Activity', ru: 'Активность' }],
  ['skills', { en: 'Skills', ru: 'Навыки' }],
  ['projects', { en: 'Projects', ru: 'Проекты' }],
  ['packages', { en: 'Packages', ru: 'Пакеты' }],
  ['habr', { en: 'Articles', ru: 'Статьи' }],
  ['community', { en: 'Community', ru: 'Сообщество' }],
  ['explore', { en: 'Pages', ru: 'Страницы' }],
  ['contacts', { en: 'Contacts', ru: 'Контакты' }],
];

const languageSkills = skillGroups.find((g) => g.id === 'languages').items;

// Positions with their own experience page and CV (issue #11).
const CHOICES = positions.filter((p) => p.id !== 'all');

function App() {
  const { t } = useLang();
  const lastYear = github.contributions[github.contributions.length - 1].year;
  return (
    <Layout page="home" sections={NAV}>
      <Hero profile={profile} github={github.profile} />
      <StatTiles github={github} codingSince={profile.codingSince} habr={habr} />

      <Section
        id="experience"
        kicker={{ en: '01 · Career', ru: '01 · Карьера' }}
        title={{ en: 'Companies & ventures', ru: 'Компании и проекты' }}
      >
        <Timeline items={experience} endYear={lastYear} />
        <p className="section__more">
          {t({
            en: 'Only one kind of experience is relevant? See it, and download its CV, by position:',
            ru: 'Нужен только один вид опыта? Смотрите его и скачивайте резюме по должности:',
          })}{' '}
          {CHOICES.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              <a href={`/experience/?role=${p.id}`}>{t(p.name)}</a>
            </span>
          ))}
          .
        </p>
      </Section>

      <Section
        id="theory"
        kicker={{ en: '02 · Theory', ru: '02 · Теория' }}
        title={{ en: 'Links meta-theory', ru: 'Метатеория связей' }}
      >
        <MetaTheory theory={metaTheory} />
        <p className="section__more">
          <a href="/research/">{t({ en: 'Research page', ru: 'Страница исследований' })}</a>
          {t({
            en: ': the theory in detail, formal proofs and other research repositories.',
            ru: ': теория подробно, формальные доказательства и другие исследовательские репозитории.',
          })}
        </p>
      </Section>

      <Section
        id="method"
        kicker={{ en: '03 · Method', ru: '03 · Метод' }}
        title={{ en: 'Universal problem solving algorithm', ru: 'Универсальный алгоритм решения задач' }}
      >
        <div className="method">
          <ProblemSolvingDiagram />
          <ProblemSolving steps={problemSolving} />
        </div>
        <p className="section__more">
          <a href="/research/#method">{t({ en: 'Research page', ru: 'Страница исследований' })}</a>
          {t({
            en: ': why the algorithm is recursive, applies to itself and improves its own requirements, and where it runs in code.',
            ru: ': почему алгоритм рекурсивен, применим к самому себе и улучшает собственные требования, и где он работает в коде.',
          })}
        </p>
      </Section>

      <Section
        id="ecosystem"
        kicker={{ en: '04 · Organizations', ru: '04 · Организации' }}
        title={{ en: 'Open-source ecosystem', ru: 'Экосистема open-source' }}
      >
        <div className="split">
          <EcosystemMap owners={github.owners} avatarUrl={github.profile.avatarUrl} />
          <ul className="orgs">
            {github.owners.map((o) => (
              <li key={o.login} className="org">
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="org__name">
                  {o.name}
                </a>
                <span className="org__meta">
                  {t({
                    en: `since ${o.createdAt.slice(0, 4)} · ${o.repositories} repos`,
                    ru: `с ${o.createdAt.slice(0, 4)} · репозиториев: ${o.repositories}`,
                  })}{' '}
                  · ★ {o.stars} <DataMark />
                </span>
                {o.description && <p className="org__desc">{o.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        <p className="section__more">
          <a href="/repositories/">
            {t({
              en: `All ${github.totals.ownRepositories} original repositories`,
              ru: `Все ${github.totals.ownRepositories} ${plural(github.totals.ownRepositories, 'ru', {
                ru: ['собственный репозиторий', 'собственных репозитория', 'собственных репозиториев'],
              })}`,
            })}
          </a>
          {t({ en: ', grouped by field and by IT profession.', ru: ', сгруппированные по областям и IT-профессиям.' })}{' '}
          <DataMark />
        </p>
      </Section>

      <Section
        id="activity"
        kicker={{ en: '05 · Activity', ru: '05 · Активность' }}
        title={{ en: 'Contributions & languages', ru: 'Вклад и языки' }}
      >
        <ContributionCalendar snapshot={contributions} />
        <div className="split split--wide">
          <ContributionsChart data={github.contributions} />
          <LanguagesChart languages={github.languages} favorites={favoriteLanguages} />
        </div>
        <LanguageCloud languages={github.languages} extra={languageSkills} favorites={favoriteLanguages} />
        <SourceLines data={sourceLines} />
      </Section>

      <Section
        id="skills"
        kicker={{ en: '06 · Stack', ru: '06 · Стек' }}
        title={{ en: 'Technologies', ru: 'Технологии' }}
      >
        <Skills groups={skillGroups} favorites={favoriteLanguages} />
      </Section>

      <Section
        id="projects"
        kicker={{ en: '07 · Work', ru: '07 · Работы' }}
        title={{ en: 'Featured projects', ru: 'Избранные проекты' }}
      >
        <Projects featured={featuredProjects} projects={github.projects} />
      </Section>

      <Section
        id="packages"
        kicker={{ en: '08 · Distribution', ru: '08 · Распространение' }}
        title={{ en: 'Published packages', ru: 'Опубликованные пакеты' }}
      >
        <Registries registries={github.registries} summary={github.packageRegistries} />
      </Section>

      <Section
        id="habr"
        kicker={{ en: '09 · Writing', ru: '09 · Статьи' }}
        title={{ en: 'Articles on Habr', ru: 'Статьи на Хабре' }}
      >
        <HabrCards snapshot={habr} />
      </Section>

      <Section
        id="community"
        kicker={{ en: '10 · Knowledge', ru: '10 · Знания' }}
        title={{ en: 'Community, writing & education', ru: 'Сообщество, публикации и образование' }}
      >
        <div className="cards">
          <StackOverflowCard so={github.stackOverflow} />
          <Publications items={publications} />
          <Education items={education} achievements={achievements} languages={languages} />
        </div>
      </Section>

      <Section
        id="explore"
        kicker={{ en: '11 · Explore', ru: '11 · Обзор' }}
        title={{ en: 'More pages', ru: 'Другие страницы' }}
      >
        <PageCards />
      </Section>

      <Section
        id="contacts"
        kicker={{ en: '12 · Links', ru: '12 · Ссылки' }}
        title={{ en: 'Contacts & social media', ru: 'Контакты и соцсети' }}
      >
        <Contacts socials={socials} />
      </Section>
    </Layout>
  );
}

export default App;
