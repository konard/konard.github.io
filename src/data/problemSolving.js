// The universal problem solving algorithm (issues #1 and #9), shown on the home and research pages.
export const problemSolving = [
  {
    step: 'Problem formulation',
    text: 'Understand and define the problem, decompose it into tasks until every task can be checked, and express every task as a failing test. The tests are the definition of done.',
    url: 'https://github.com/konard/problem-solving/blob/main/problem-solving/problem-formulation/problem-formulation.md',
  },
  {
    step: 'Solution implementation',
    text: 'Draft solutions for every test, select the drafts that pass with just enough code and compose them into the solution of the parent task, then debug, refactor and document. When no reasonable solution exists, return to problem formulation.',
    url: 'https://github.com/konard/problem-solving/blob/main/problem-solving/solution-implementation/solution-implementation.md',
  },
];

/** What makes the algorithm reusable (issue #9): each claim is kept as precise as the algorithm itself. */
export const problemSolvingNotes = [
  {
    title: 'Recursive',
    text: 'Every task is a problem of its own, so both steps apply to it again. Decomposition stops at tasks small enough to be checked by one test and solved directly; composition walks back up the same tree, and every composed solution has to pass the tests of its parent task.',
  },
  {
    title: 'Applicable to itself',
    text: 'Applied to the problem “how do we solve this problem?”, the algorithm returns its tree of tasks and tests, which is a plan. When decomposition goes deep enough that every leaf is an elementary, checkable step, the plan is an algorithm that can be written down as code, and that code can be solved for in the same way.',
  },
  {
    title: 'Returns to formulation',
    text: 'When the search for drafts or the implementation shows that the task, as formulated, has no reasonable or appropriate solution, or that it was defined wrongly, the algorithm goes back to the first step: the requirements are questioned and made less dumb, and the task is decomposed again. In practice this rarely means redoing everything: only the affected part of the tree is formulated again, and the tests and solutions that still hold are kept.',
  },
  {
    title: 'Self-improving',
    text: 'The formulation is an output of the algorithm too: it is tested by the attempts to solve it and revised when they fail. So every pass improves the problem as well as the solution, until the problem has a solution worth implementing.',
  },
  {
    title: 'Implemented',
    text: 'The algorithm runs in code, not only on paper.',
    links: [
      [
        'link-assistant/hive-mind',
        'AI agents solve GitHub issues with it: an issue becomes requirements and failing tests, the solution is drafted in a pull request and checked by CI and review, and unclear requirements go back to the issue as questions.',
      ],
      [
        'link-assistant/formal-ai',
        'a symbolic assistant whose solver runs the same loop for every prompt: formalization, decomposition, tests, candidate drafts, selection of the smallest sufficient one, verification and composition.',
      ],
    ],
  },
];
