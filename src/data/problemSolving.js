// The universal problem solving algorithm (issues #1 and #9), shown on the home and research pages.
// Texts are `{ en, ru }` objects translated with useLang().t.
export const problemSolving = [
  {
    step: { en: 'Problem formulation', ru: 'Постановка задачи' },
    text: {
      en: 'Understand and define the problem, decompose it into tasks until every task can be checked, and express every task as a failing test. The tests are the definition of done.',
      ru: 'Понять и определить задачу, разбивать её на подзадачи, пока каждую из них нельзя будет проверить, и выразить каждую подзадачу в виде падающего теста. Тесты и есть критерий готовности.',
    },
    url: 'https://github.com/konard/problem-solving/blob/main/problem-solving/problem-formulation/problem-formulation.md',
  },
  {
    step: { en: 'Solution implementation', ru: 'Реализация решения' },
    text: {
      en: 'Draft solutions for every test, select the drafts that pass with just enough code and compose them into the solution of the parent task, then debug, refactor and document. When no reasonable solution exists, return to problem formulation.',
      ru: 'Набросать черновые решения для каждого теста, отобрать черновики, которые проходят тесты с минимально достаточным кодом, и собрать из них решение родительской подзадачи, затем отладить, отрефакторить и задокументировать. Если разумного решения нет, вернуться к постановке задачи.',
    },
    url: 'https://github.com/konard/problem-solving/blob/main/problem-solving/solution-implementation/solution-implementation.md',
  },
];

/** What makes the algorithm reusable (issue #9): each claim is kept as precise as the algorithm itself. */
export const problemSolvingNotes = [
  {
    title: { en: 'Recursive', ru: 'Рекурсивный' },
    text: {
      en: 'Every task is a problem of its own, so both steps apply to it again. Decomposition stops at tasks small enough to be checked by one test and solved directly; composition walks back up the same tree, and every composed solution has to pass the tests of its parent task.',
      ru: 'Каждая подзадача — самостоятельная задача, поэтому к ней снова применимы оба шага. Декомпозиция останавливается на подзадачах, достаточно малых, чтобы их проверял один тест и решались напрямую; композиция поднимается обратно по тому же дереву, и каждое собранное решение должно пройти тесты своей родительской подзадачи.',
    },
  },
  {
    title: { en: 'Applicable to itself', ru: 'Применим к самому себе' },
    text: {
      en: 'Applied to the problem “how do we solve this problem?”, the algorithm returns its tree of tasks and tests, which is a plan. When decomposition goes deep enough that every leaf is an elementary, checkable step, the plan is an algorithm that can be written down as code, and that code can be solved for in the same way.',
      ru: 'Применённый к задаче «как нам решить эту задачу?», алгоритм возвращает своё дерево подзадач и тестов, то есть план. Когда декомпозиция заходит так глубоко, что каждый лист становится элементарным проверяемым шагом, план превращается в алгоритм, который можно записать в виде кода, а этот код можно получить тем же способом.',
    },
  },
  {
    title: { en: 'Returns to formulation', ru: 'Возвращается к постановке' },
    text: {
      en: 'When the search for drafts or the implementation shows that the task, as formulated, has no reasonable or appropriate solution, or that it was defined wrongly, the algorithm goes back to the first step: the requirements are questioned and made less dumb, and the task is decomposed again. In practice this rarely means redoing everything: only the affected part of the tree is formulated again, and the tests and solutions that still hold are kept.',
      ru: 'Когда поиск черновиков или реализация показывает, что у подзадачи в её текущей постановке нет разумного или подходящего решения или что она поставлена неверно, алгоритм возвращается к первому шагу: требования подвергаются сомнению и становятся менее глупыми, а задача заново разбивается на подзадачи. На практике это редко означает, что всё нужно переделать: заново ставится только затронутая часть дерева, а тесты и решения, которые остаются верными, сохраняются.',
    },
  },
  {
    title: { en: 'Self-improving', ru: 'Самосовершенствующийся' },
    text: {
      en: 'The formulation is an output of the algorithm too: it is tested by the attempts to solve it and revised when they fail. So every pass improves the problem as well as the solution, until the problem has a solution worth implementing.',
      ru: 'Постановка задачи — тоже результат работы алгоритма: её проверяют попытки её решить и пересматривают, когда они не удаются. Поэтому каждый проход улучшает не только решение, но и саму задачу, пока у задачи не появится решение, которое стоит реализовать.',
    },
  },
  {
    title: { en: 'Implemented', ru: 'Реализован' },
    text: {
      en: 'The algorithm runs in code, not only on paper.',
      ru: 'Алгоритм работает в коде, а не только на бумаге.',
    },
    links: [
      [
        'link-assistant/hive-mind',
        {
          en: 'AI agents solve GitHub issues with it: an issue becomes requirements and failing tests, the solution is drafted in a pull request and checked by CI and review, and unclear requirements go back to the issue as questions.',
          ru: 'ИИ-агенты решают с его помощью issues на GitHub: issue превращается в требования и падающие тесты, решение набрасывается в пул-реквесте и проверяется CI и ревью, а неясные требования возвращаются в issue в виде вопросов.',
        },
      ],
      [
        'link-assistant/formal-ai',
        {
          en: 'a symbolic assistant whose solver runs the same loop for every prompt: formalization, decomposition, tests, candidate drafts, selection of the smallest sufficient one, verification and composition.',
          ru: 'символьный помощник, решатель которого проходит тот же цикл для каждого запроса: формализация, декомпозиция, тесты, черновики-кандидаты, выбор наименьшего достаточного, проверка и композиция.',
        },
      ],
    ],
  },
];
