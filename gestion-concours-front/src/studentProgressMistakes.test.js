import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteStudentMistake,
  readStudentMistakes,
  recordStudentMistake,
  resolveStudentMistakes,
  saveStudentMistakesManually
} from './studentProgress.js';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const setupBrowserMocks = () => {
  globalThis.localStorage = new MemoryStorage();
  localStorage.setItem('user', JSON.stringify({ id: 12 }));
  localStorage.setItem('authToken', 'student-token');
  globalThis.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };
  globalThis.window = { dispatchEvent() {} };
};

test('manual saves are authenticated, deduplicated across attempts, and independent from automatic errors', async () => {
  setupBrowserMocks();
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({ savedCount: 1, mistakes: [{ id: 301 }] })
    };
  };

  const automatic = {
    sourceType: 'Cours', resourceId: 'course-4', questionId: 'q-2', attemptId: 'automatic-1',
    questionText: 'Question de cours', selectedChoiceLabel: 'B', correctChoiceLabel: 'A',
    savedManually: false, savedForReview: true
  };
  recordStudentMistake(automatic);

  const first = await saveStudentMistakesManually({
    sourceType: 'Exercice', resourceId: 'course-4', resourceTitle: 'Suites', subject: 'Mathématiques',
    chapter: 'Suites', attemptId: 'manual-1',
    mistakes: [{ questionId: 'q-2', questionText: 'Question de cours', explanation: 'Correction' }]
  });
  await saveStudentMistakesManually({
    sourceType: 'Exercice', resourceId: 'course-4', resourceTitle: 'Suites', subject: 'Mathématiques',
    chapter: 'Suites', attemptId: 'manual-2',
    mistakes: [{ questionId: 'q-2', questionText: 'Question de cours', explanation: 'Correction mise à jour' }]
  });

  assert.equal(first.savedCount, 1);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.headers.Authorization, 'Bearer student-token');
  const sentBody = JSON.parse(requests[0].options.body);
  assert.equal(sentBody.studentId, undefined);
  assert.equal(sentBody.mistakes[0].savedManually, true);

  const records = readStudentMistakes();
  const manual = records.filter((item) => item.savedManually === true);
  const auto = records.filter((item) => item.savedManually === false);
  assert.equal(manual.length, 1);
  assert.equal(auto.length, 1);
  assert.equal(manual[0].databaseId, 301);
  assert.equal(manual[0].attemptId, 'manual-2');
  assert.equal(manual[0].explanation, 'Correction mise à jour');

  resolveStudentMistakes('course-4', 'q-2', 'Cours');
  const afterCorrection = readStudentMistakes();
  assert.equal(afterCorrection.find((item) => item.savedManually === false).savedForReview, false);
  assert.equal(afterCorrection.find((item) => item.savedManually === true).savedForReview, true);
});

test('manual course errors with no recorded choice labels remain locally visible after server save', async () => {
  setupBrowserMocks();
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ savedCount: 1, mistakes: [{ id: 302 }] }) });

  await saveStudentMistakesManually({
    sourceType: 'Cours', resourceId: 'course-7', resourceTitle: 'Limites',
    mistakes: [{ questionId: 'q-1', questionText: 'Déterminer la limite', explanation: 'Par encadrement.' }]
  });

  const saved = readStudentMistakes().find((item) => item.savedManually === true);
  assert.equal(saved.questionText, 'Déterminer la limite');
  assert.equal(saved.selectedChoiceLabel || '', '');
  assert.equal(saved.correctChoiceLabel || '', '');
  assert.equal(saved.explanation, 'Par encadrement.');
});

test('manual deletion calls the authenticated API before removing the local copy', async () => {
  setupBrowserMocks();
  recordStudentMistake({
    sourceType: 'Cours', resourceId: 'course-2', questionId: 'q-1', questionText: 'À réviser',
    savedManually: true, savedForReview: true, databaseId: 303, selectedChoiceLabel: '', correctChoiceLabel: ''
  });
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true };
  };

  await deleteStudentMistake(303);

  assert.equal(requests[0].url, '/api/student-mistakes/303');
  assert.equal(requests[0].options.method, 'DELETE');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer student-token');
  assert.equal(readStudentMistakes().length, 0);
});
