import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateStudentActivityEvents,
  buildActivityTrend,
  filterDashboardActivities,
  summarizeDashboardActivities
} from './studentDashboardStats.js';

const at = (day) => `2026-10-${String(day).padStart(2, '0')}T12:00:00`;

test('aggregates database events by resource and keeps the latest completion state', () => {
  const activities = aggregateStudentActivityEvents([
    { type: 'COURS', resourceId: '8', title: 'Fonctions', subject: 'Mathématiques', eventType: 'UNCOMPLETE', occurredAt: at(3) },
    { type: 'COURS', resourceId: '8', title: 'Fonctions', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(1) },
    { type: 'COURS', resourceId: '8', title: 'Fonctions', subject: 'Mathématiques', eventType: 'COMPLETE', occurredAt: at(2) },
    { type: 'COURS', resourceId: '8', title: 'Fonctions', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(3) },
    { type: 'COURS', resourceId: '8', title: 'Fonctions', subject: 'Mathématiques', eventType: 'DURATION', durationSeconds: 125, occurredAt: at(3) }
  ]);
  assert.equal(activities.length, 1);
  assert.equal(activities[0].visits, 2);
  assert.equal(activities[0].completed, false);
  assert.equal(activities[0].durationSeconds, 125);
  assert.equal(activities[0].firstViewedAt, at(1));
});

test('recognizes all five tracked content categories and filters each dashboard', () => {
  const events = [
    ['CONCOURS', 'Concours'], ['CONCOURS_BLANC', 'Concours blanc'], ['COURS', 'Cours'],
    ['EXAMEN', 'Examen national'], ['RESUME', 'Résumé']
  ].map(([type], index) => ({ type, resourceId: String(index + 1), eventType: 'VIEW', occurredAt: at(index + 1), subject: 'Mathématiques', title: `Ressource ${index + 1}` }));
  const activities = aggregateStudentActivityEvents(events);
  const modes = ['contests', 'mock-exams', 'courses', 'exams', 'summaries'];
  assert.deepEqual(modes.map((mode) => filterDashboardActivities(activities, { mode }).length), [1, 1, 1, 1, 1]);
  assert.deepEqual(activities.map((item) => item.type).sort(), ['Concours', 'Concours blanc', 'Cours', 'Examen national', 'Résumé'].sort());
});

test('calculates real totals and returns no scores or groups for empty activity data', () => {
  const empty = summarizeDashboardActivities([]);
  assert.deepEqual({ resources: empty.resources, completed: empty.completed, visits: empty.visits, completionRate: empty.completionRate, strength: empty.strength, difficulty: empty.difficulty }, {
    resources: 0, completed: 0, visits: 0, completionRate: null, strength: null, difficulty: null
  });
  const activities = aggregateStudentActivityEvents([
    { type: 'RESUME', resourceId: '4', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(1) },
    { type: 'RESUME', resourceId: '4', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(2) },
    { type: 'RESUME', resourceId: '5', subject: 'Physique', eventType: 'VIEW', occurredAt: at(2) },
    { type: 'RESUME', resourceId: '5', subject: 'Physique', eventType: 'COMPLETE', occurredAt: at(2) }
  ]);
  const summary = summarizeDashboardActivities(activities);
  assert.equal(summary.resources, 2);
  assert.equal(summary.completed, 1);
  assert.equal(summary.visits, 3);
  assert.equal(summary.completionRate, 50);
  assert.equal(summary.strength.name, 'Physique');
  assert.equal(summary.difficulty.name, 'Mathématiques');
});

test('applies category, subject and date filters and updates after a new event', () => {
  const events = [
    { type: 'COURS', resourceId: '1', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: '2026-09-01T12:00:00' },
    { type: 'COURS', resourceId: '2', subject: 'Physique', eventType: 'VIEW', occurredAt: at(29) },
    { type: 'RESUME', resourceId: '3', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(29) }
  ];
  const initial = aggregateStudentActivityEvents(events);
  assert.equal(filterDashboardActivities(initial, { mode: 'courses', subject: 'Physique', period: '30', now: new Date(at(30)).getTime() }).length, 1);
  assert.equal(filterDashboardActivities(initial, { mode: 'courses', subject: 'Mathématiques', period: '30', now: new Date(at(30)).getTime() }).length, 0);
  const updated = aggregateStudentActivityEvents([...events, { type: 'COURS', resourceId: '1', subject: 'Mathématiques', eventType: 'VIEW', occurredAt: at(30) }]);
  assert.equal(filterDashboardActivities(updated, { mode: 'courses', subject: 'Mathématiques', period: '30', now: new Date(at(30)).getTime() }).length, 1);
  assert.equal(updated.find((item) => item.id === 'Cours:1').visits, 2);
});

test('builds weekly chart buckets only from recorded events', () => {
  const trend = buildActivityTrend([
    { type: 'COURS', eventType: 'VIEW', occurredAt: at(26) },
    { type: 'COURS', eventType: 'COMPLETE', occurredAt: at(26) },
    { type: 'RESUME', eventType: 'VIEW', occurredAt: at(26) }
  ], { weeks: 4, now: new Date(at(30)).getTime(), mode: 'courses' });
  assert.equal(trend.length, 4);
  assert.equal(trend.reduce((sum, week) => sum + week.views, 0), 1);
  assert.equal(trend.reduce((sum, week) => sum + week.completions, 0), 1);
});
