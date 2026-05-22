import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectManagementDir = path.resolve(__dirname, '..');
const dataPath = path.join(projectManagementDir, 'scrum-data.json');
const outputPath = path.join(projectManagementDir, 'scrum-view.md');

const STATUS_ORDER = ['in-progress', 'blocked', 'todo', 'done', 'cut'];
const PRIORITY_ORDER = ['must', 'should', 'could', "won't"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function compareStrings(a, b) {
  return String(a).localeCompare(String(b));
}

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const leftDay = Number(left.dayNumber ?? Number.MAX_SAFE_INTEGER);
    const rightDay = Number(right.dayNumber ?? Number.MAX_SAFE_INTEGER);

    if (leftDay !== rightDay) {
      return leftDay - rightDay;
    }

    const leftStatus = STATUS_ORDER.indexOf(left.status);
    const rightStatus = STATUS_ORDER.indexOf(right.status);

    if (leftStatus !== rightStatus) {
      return (leftStatus === -1 ? Number.MAX_SAFE_INTEGER : leftStatus) - (rightStatus === -1 ? Number.MAX_SAFE_INTEGER : rightStatus);
    }

    const leftPriority = PRIORITY_ORDER.indexOf(left.priority);
    const rightPriority = PRIORITY_ORDER.indexOf(right.priority);

    if (leftPriority !== rightPriority) {
      return (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority) - (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority);
    }

    return compareStrings(left.id, right.id);
  });
}

function formatList(items, fallback = '- None') {
  const normalized = asArray(items).filter(Boolean);

  if (!normalized.length) {
    return fallback;
  }

  return normalized.map((item) => `- ${item}`).join('\n');
}

function formatTask(task) {
  const acceptance = asArray(task.acceptanceCriteria);
  const notes = asArray(task.notes);
  const dependencies = asArray(task.dependencies);
  const dayContext = task.dayNumber ? `Day ${task.dayNumber} — ${asString(task.dayName, 'Unscheduled')}` : 'Backlog';

  return [
    `- [${asString(task.status, 'todo')}] [${asString(task.priority, 'must')}] ${asString(task.id, 'TASK-???')} — ${asString(task.title, 'Untitled task')}`,
    `  - Area: ${asString(task.area, 'unassigned')}`,
    `  - Day: ${dayContext}`,
    `  - Description: ${asString(task.description, 'No description provided.')}`,
    `  - Acceptance: ${acceptance.length ? acceptance.join('; ') : 'None listed.'}`,
    `  - Dependencies: ${dependencies.length ? dependencies.join(', ') : 'None'}`,
    `  - Notes: ${notes.length ? notes.join('; ') : 'None'}`
  ].join('\n');
}

function formatGate(gate) {
  const criteria = asArray(gate.criteria);
  const lines = [`- [${asString(gate.status, 'pending')}] ${asString(gate.id, 'QG-???')} — ${asString(gate.name, 'Unnamed quality gate')}`];

  if (criteria.length) {
    lines.push(...criteria.map((criterion) => `  - ${criterion}`));
  } else {
    lines.push('  - No criteria listed.');
  }

  return lines.join('\n');
}

function formatRisk(risk) {
  return [
    `- [${asString(risk.status, 'open')}] [${asString(risk.severity, 'unknown')}] ${asString(risk.id, 'RISK-???')} — ${asString(risk.title, 'Unnamed risk')}`,
    `  - Mitigation: ${asString(risk.mitigation, 'No mitigation documented.')}`
  ].join('\n');
}

function formatPrinciple(principle) {
  return `- ${asString(principle.id, 'ARCH-???')} — **${asString(principle.name, 'Unnamed principle')}**: ${asString(principle.description, 'No description provided.')}`;
}

function formatDecision(decision) {
  return `- ${asString(decision.date, 'undated')} — ${asString(decision.id, 'ADR-????')} — **${asString(decision.title, 'Untitled decision')}** (${asString(decision.status, 'accepted')}): ${asString(decision.summary, 'No summary provided.')}`;
}

function formatTalkingPoint(point) {
  if (typeof point === 'string') {
    return `- ${point}`;
  }

  return `- **${asString(point.section, 'Talking Point')}** — ${asString(point.title, 'Untitled')}: ${asString(point.note, 'No note provided.')}`;
}

function formatDeploymentEnvironmentVariable(variable) {
  const targets = asArray(variable.targets);
  const required = variable.required === false ? 'optional' : 'required';
  return `- ${asString(variable.name, 'UNKNOWN_VAR')} (${required}; ${targets.length ? targets.join(', ') : 'target unspecified'}) — ${asString(variable.description, 'No description provided.')}`;
}

function formatDeploymentChecklistItem(item) {
  return `- [${asString(item.status, 'todo')}] ${asString(item.id, 'DEP-???')} — ${asString(item.item, 'Unnamed deployment checklist item')}`;
}

function findFocusDay(days) {
  return days.find((day) =>
    asArray(day.tasks).some((task) => !['done', 'cut'].includes(asString(task.status, 'todo')))
  ) ?? days[0] ?? null;
}

async function main() {
  const raw = await readFile(dataPath, 'utf8');
  const data = JSON.parse(raw);

  const project = data.project ?? {};
  const sprints = asArray(data.sprints);
  const currentSprint = sprints.find((sprint) => sprint.id === project.currentSprintId) ?? sprints[0] ?? null;
  const sprintDays = asArray(currentSprint?.days).sort((left, right) => Number(left.dayNumber ?? 0) - Number(right.dayNumber ?? 0));
  const sprintTasks = sortTasks(
    sprintDays.flatMap((day) =>
      asArray(day.tasks).map((task) => ({
        ...task,
        dayNumber: day.dayNumber,
        dayName: day.name,
        dayDate: day.date
      }))
    )
  );

  const inProgressTasks = sprintTasks.filter((task) => task.status === 'in-progress');
  const blockedTasks = sprintTasks.filter((task) => task.status === 'blocked');
  const doneTasks = sprintTasks.filter((task) => task.status === 'done');
  const todoTasks = sprintTasks.filter((task) => task.status === 'todo');
  const activeTasks = sprintTasks.filter((task) => task.status !== 'cut');
  const completedCount = activeTasks.filter((task) => task.status === 'done').length;
  const completionPercent = activeTasks.length ? Math.round((completedCount / activeTasks.length) * 100) : 0;
  const focusDay = findFocusDay(sprintDays);
  const focusTasks = sortTasks(
    asArray(focusDay?.tasks)
      .filter((task) => ['in-progress', 'todo', 'blocked'].includes(asString(task.status, 'todo')))
      .map((task) => ({
        ...task,
        dayNumber: focusDay?.dayNumber,
        dayName: focusDay?.name,
        dayDate: focusDay?.date
      }))
  );

  const backlogByPriority = {
    must: [],
    should: [],
    could: [],
    "won't": []
  };

  for (const item of asArray(data.backlog)) {
    const priority = asString(item.priority, 'must');
    const bucket = backlogByPriority[priority] ?? backlogByPriority.must;
    bucket.push({ ...item, dayName: 'Backlog' });
  }

  for (const key of Object.keys(backlogByPriority)) {
    backlogByPriority[key] = sortTasks(backlogByPriority[key]);
  }

  const sprintSummaryLines = sprintDays.length
    ? sprintDays.map((day) => {
        const dayTasks = asArray(day.tasks);
        const dayDone = dayTasks.filter((task) => task.status === 'done').length;
        const dayInProgress = dayTasks.filter((task) => task.status === 'in-progress').length;
        const dayBlocked = dayTasks.filter((task) => task.status === 'blocked').length;
        const dayTodo = dayTasks.filter((task) => task.status === 'todo').length;

        return `- Day ${day.dayNumber} — ${asString(day.name, 'Unnamed day')} (${asString(day.date, 'date TBD')}): ${dayDone} done, ${dayInProgress} in progress, ${dayBlocked} blocked, ${dayTodo} todo`;
      }).join('\n')
    : '- No sprint days defined.';

  const lines = [
    '# MERN Real-Time Chat PWA — Scrum View',
    '',
    '> Generated from `project-management/scrum-data.json` by `project-management/scripts/update-scrum-view.mjs`.',
    '',
    '## Mission',
    '',
    asString(project.mission, 'Mission not defined.'),
    '',
    `**Positioning:** ${asString(project.positioning, 'Positioning not defined.')}`,
    '',
    '## Current Sprint',
    '',
    currentSprint
      ? [
          `- **Name:** ${asString(currentSprint.name, 'Unnamed sprint')}`,
          `- **Status:** ${asString(currentSprint.status, 'unknown')}`,
          `- **Dates:** ${asString(currentSprint.startDate, 'TBD')} → ${asString(currentSprint.endDate, 'TBD')}`,
          `- **Goal:** ${asString(currentSprint.goal, 'No sprint goal defined.')}`,
          `- **Active focus day:** ${focusDay ? `Day ${focusDay.dayNumber} — ${asString(focusDay.name, 'Unnamed day')} (${asString(focusDay.date, 'date TBD')})` : 'No focus day identified'}`
        ].join('\n')
      : '- No sprint is defined.',
    '',
    '## Sprint Progress',
    '',
    `- **Completion:** ${completedCount}/${activeTasks.length} active sprint tasks done (${completionPercent}%)`,
    `- **In Progress:** ${inProgressTasks.length}`,
    `- **Blocked:** ${blockedTasks.length}`,
    `- **Todo:** ${todoTasks.length}`,
    `- **Done:** ${doneTasks.length}`,
    '',
    sprintSummaryLines,
    '',
    '## Quality Gates',
    '',
    asArray(data.qualityGates).length ? asArray(data.qualityGates).map(formatGate).join('\n') : '- No quality gates defined.',
    '',
    '## Today / Next Focus',
    '',
    focusDay
      ? [
          `**Day ${focusDay.dayNumber} — ${asString(focusDay.name, 'Unnamed day')} (${asString(focusDay.date, 'date TBD')})**`,
          '',
          `Goal: ${asString(focusDay.goal, 'No goal defined.')}`,
          '',
          'Tasks:',
          focusTasks.length ? focusTasks.map(formatTask).join('\n') : '- No active tasks for the focus day.',
          '',
          'Day acceptance criteria:',
          formatList(focusDay.acceptanceCriteria),
          '',
          'Day notes:',
          formatList(focusDay.notes)
        ].join('\n')
      : 'No focus day available.',
    '',
    '## In Progress',
    '',
    inProgressTasks.length ? inProgressTasks.map(formatTask).join('\n') : '- No tasks currently in progress.',
    '',
    '## Blocked',
    '',
    blockedTasks.length ? blockedTasks.map(formatTask).join('\n') : '- No blocked tasks right now.',
    '',
    '## Done',
    '',
    doneTasks.length ? doneTasks.map(formatTask).join('\n') : '- No tasks have been completed yet.',
    '',
    '## Backlog',
    '',
    '### Must',
    '',
    backlogByPriority.must.length ? backlogByPriority.must.map(formatTask).join('\n') : '- No must backlog items.',
    '',
    '### Should',
    '',
    backlogByPriority.should.length ? backlogByPriority.should.map(formatTask).join('\n') : '- No should backlog items.',
    '',
    '### Could',
    '',
    backlogByPriority.could.length ? backlogByPriority.could.map(formatTask).join('\n') : '- No could backlog items.',
    '',
    '### Won\'t for MVP',
    '',
    backlogByPriority["won't"].length ? backlogByPriority["won't"].map(formatTask).join('\n') : '- No cut backlog items.',
    '',
    '## Risks',
    '',
    asArray(data.risks).length ? asArray(data.risks).map(formatRisk).join('\n') : '- No risks defined.',
    '',
    '## Architecture Principles',
    '',
    asArray(data.architecturePrinciples).length ? asArray(data.architecturePrinciples).map(formatPrinciple).join('\n') : '- No architecture principles defined.',
    '',
    '## Deployment Status',
    '',
    `- **Status:** ${asString(data.deployment?.status, 'unknown')}`,
    `- **Frontend URL:** ${asString(data.deployment?.frontendUrl, 'TBD') || 'TBD'}`,
    `- **Server URL:** ${asString(data.deployment?.serverUrl ?? data.deployment?.backendUrl, 'TBD') || 'TBD'}`,
    `- **Database Provider:** ${asString(data.deployment?.databaseProvider, 'TBD')}`,
    '',
    'Environment variables:',
    asArray(data.deployment?.environmentVariables).length
      ? asArray(data.deployment.environmentVariables).map(formatDeploymentEnvironmentVariable).join('\n')
      : '- No environment variables documented.',
    '',
    'Deployment checklist:',
    asArray(data.deployment?.checklist).length
      ? asArray(data.deployment.checklist).map(formatDeploymentChecklistItem).join('\n')
      : '- No deployment checklist items documented.',
    '',
    '## Recent Decisions',
    '',
    asArray(data.decisions).length ? asArray(data.decisions).map(formatDecision).join('\n') : '- No decisions documented.'
  ];

  await writeFile(outputPath, `${lines.join('\n').trim()}\n`, 'utf8');
}

main().catch((error) => {
  console.error('Failed to generate scrum view.');
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});

