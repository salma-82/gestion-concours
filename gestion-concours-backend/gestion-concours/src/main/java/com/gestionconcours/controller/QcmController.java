package com.gestionconcours.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

@RestController
@RequestMapping("/api/qcm")
@CrossOrigin(origins = "*")
public class QcmController {
    private static final String UPLOAD_DIR = "uploads/";
    private static final String QCM_TRACKING_BRIDGE = """
            (() => {
              const messageType = 'econcourse-qcm-mistake';
              const saveActionType = 'econcourse-save-mistakes-action';
              const attemptId = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
              const sent = new Set();
              const mistakesMap = new Map();
              const textOf = (value) => String(value || '').replace(/\\s+/g, ' ').trim().slice(0, 5000);

              const recordMistake = (payload) => {
                const key = String(payload.questionId ?? payload.questionNumber ?? payload.questionText).trim();
                mistakesMap.set(key, payload);
              };
              const removeMistake = (questionId) => {
                const key = String(questionId ?? '').trim();
                if (key) mistakesMap.delete(key);
              };

              const publish = (payload) => {
                const key = [payload.questionId, payload.selectedChoiceLabel, payload.selectedChoiceText].join(':');
                if (sent.has(key)) return;
                sent.add(key);
                if (!payload.isCorrect) {
                  recordMistake(payload);
                } else {
                  removeMistake(payload.questionId ?? payload.questionNumber);
                }
                const questionCount = Array.isArray(getData()?.questions)
                  ? getData().questions.length
                  : getLegacyQuestions().length || null;
                window.parent.postMessage({ type: messageType, attemptId, totalQuestions: questionCount, mistake: payload }, '*');
              };

              const getData = () => typeof QCM_DATA !== 'undefined' ? QCM_DATA : window.QCM_DATA;
              const getState = () => typeof S !== 'undefined' ? S : window.S;
              const getLegacyQuestions = () => {
                try { return typeof Q !== 'undefined' && Array.isArray(Q) ? Q : []; } catch { return []; }
              };
              const getLegacyAnswers = () => {
                try { return typeof ans !== 'undefined' && Array.isArray(ans) ? ans : []; } catch { return []; }
              };
              const getLegacyCurrentIndex = () => {
                try { return typeof cur !== 'undefined' && Number.isInteger(cur) ? cur : 0; } catch { return 0; }
              };
              const getLegacyExplanation = (question) => textOf([
                question?.rappel ? 'Rappel de cours : ' + question.rappel : '',
                question?.flash ? 'Réflexe concours : ' + question.flash : '',
                Array.isArray(question?.steps) && question.steps.length ? 'Méthode académique : ' + question.steps.join(' ') : '',
                question?.trap ? 'Piège classique : ' + question.trap : ''
              ].filter(Boolean).join(' '));
              const getChoiceLabel = (choice) => String(choice?.k ?? choice?.choiceLabel ?? choice?.label ?? choice?.id ?? '').trim().toUpperCase();
              const getChoiceText = (choice) => textOf(choice?.t ?? choice?.choiceText ?? choice?.text ?? choice?.label ?? '');
              const formatChoices = (choices) => (Array.isArray(choices) ? choices : [])
                .map((choice, index) => `${String.fromCharCode(65 + index)}. ${getChoiceText(choice) || textOf(choice)}`)
                .filter((choice) => !/^[A-Z]\\.\\s*$/.test(choice))
                .join('\\n');

              const collectAllCurrentMistakes = () => {
                const data = getData();
                const state = getState();
                if (Array.isArray(data?.questions) && state?.answers) {
                  data.questions.forEach((q, idx) => {
                    const ans = state.answers[q.id];
                    const correctLabel = String(q.correct ?? q.correctChoiceLabel ?? q.answer ?? '').trim().toUpperCase();
                    if (ans && ans !== correctLabel) {
                      const options = q.options ?? q.choices ?? [];
                      const selOpt = options.find((c) => getChoiceLabel(c) === ans);
                      const corOpt = options.find((c) => getChoiceLabel(c) === correctLabel);
                      recordMistake({
                        questionId: q.id ?? q.questionNumber ?? idx + 1,
                        questionNumber: q.questionNumber ?? q.id ?? idx + 1,
                        questionText: textOf(q.enonce ?? q.questionText ?? q.text ?? ''),
                        choicesText: formatChoices(options),
                        selectedChoiceLabel: ans,
                        selectedChoiceText: textOf(selOpt?.t ?? selOpt?.choiceText ?? selOpt?.text ?? ans),
                        correctChoiceLabel: correctLabel,
                        isCorrect: false,
                        correctChoiceText: getChoiceText(corOpt),
                        explanation: textOf(Array.isArray(q.explication) ? q.explication.join(' ') : (q.explication ?? q.explanation ?? '')),
                        chapter: textOf(data.chapitre ?? data.chapter ?? '')
                      });
                    }
                  });
                }

                const legacyQuestions = getLegacyQuestions();
                const legacyAnswers = getLegacyAnswers();
                if (legacyQuestions.length && Array.isArray(legacyAnswers)
                  && legacyQuestions.every((question) => Array.isArray(question?.o) && Number.isInteger(question?.a))) {
                  legacyQuestions.forEach((question, index) => {
                    const rawAnswer = legacyAnswers[index];
                    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') {
                      removeMistake(index + 1);
                      return;
                    }
                    const selectedIndex = Number(rawAnswer);
                    const correctIndex = Number(question.a);
                    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.o.length) return;
                    if (selectedIndex === correctIndex) {
                      removeMistake(index + 1);
                      return;
                    }
                    const selectedLabel = String.fromCharCode(65 + selectedIndex);
                    const correctLabel = String.fromCharCode(65 + correctIndex);
                    recordMistake({
                      questionId: index + 1,
                      questionNumber: index + 1,
                      questionText: textOf(question.q ?? question.questionText ?? question.text ?? ''),
                      choicesText: formatChoices(question.o),
                      selectedChoiceLabel: selectedLabel,
                      selectedChoiceText: textOf(question.o[selectedIndex]),
                      correctChoiceLabel: correctLabel,
                      correctChoiceText: textOf(question.o[correctIndex]),
                      explanation: getLegacyExplanation(question),
                      chapter: textOf(question.t ?? '')
                    });
                  });
                }
                // Some uploaded QCMs keep answer state in a private closure. Recover
                // those answers from the correction already rendered on screen.
                document.querySelectorAll('.corr.ko').forEach((card, index) => {
                  const qhead = card.querySelector('.qhead')?.innerText || '';
                  const qtext = card.querySelector('.qtext, .question-text, .statement, [data-question-text]')?.innerText || '';
                  const note = textOf(card.querySelector('.note')?.innerText || '');
                  const explanationNode = card.querySelector('.expl, .explanation, .explication, .fb.ko');
                  const explanation = textOf(explanationNode?.innerText || '');
                  const numberMatch = qhead.match(/\\d+/);
                  const questionNumber = numberMatch ? Number(numberMatch[0]) : index + 1;
                  const question = Array.isArray(data?.questions)
                    ? data.questions.find((item, questionIndex) => String(item.questionNumber ?? item.id ?? questionIndex + 1) === String(questionNumber)) || data.questions[questionNumber - 1]
                    : null;
                  const options = question?.options ?? question?.choices ?? [];
                  const selectedNode = card.querySelector('.copt.bad, .bad, .incorrect, [data-correct="false"]');
                  const correctNode = card.querySelector('.copt.good, .good, .correct, [data-correct="true"]');
                  const labelFromNode = (node) => textOf(node?.querySelector('.k')?.innerText || node?.dataset?.k || node?.dataset?.answer || '').toUpperCase();
                  const textFromNode = (node) => {
                    if (!node) return '';
                    const clone = node.cloneNode(true);
                    clone.querySelectorAll('.k, .tag').forEach((child) => child.remove());
                    return textOf(clone.innerText || clone.textContent || '');
                  };
                  const selectedFromNote = note.match(/Votre réponse\\s*:\\s*([A-Za-z0-9_-]+)/i)?.[1] || '';
                  const correctFromNote = note.match(/Bonne réponse(?:\\s*\\([^)]*\\))?\\s*:\\s*([A-Za-z0-9_-]+)/i)?.[1] || '';
                  const selectedLabel = String(labelFromNode(selectedNode) || state?.answers?.[question?.id] || selectedFromNote).toUpperCase();
                  const correctLabel = String(labelFromNode(correctNode) || question?.correct || question?.correctChoiceLabel || question?.answer || correctFromNote).toUpperCase();
                  const optionLabel = (choice) => String(choice?.k ?? choice?.choiceLabel ?? choice?.label ?? choice?.id ?? '').trim().toUpperCase();
                  const selectedOption = options.find((choice) => optionLabel(choice) === selectedLabel);
                  const correctOption = options.find((choice) => optionLabel(choice) === correctLabel);
                  recordMistake({
                    questionId: question?.id ?? question?.questionNumber ?? questionNumber,
                    questionNumber: Number(question?.questionNumber ?? questionNumber) || questionNumber,
                    questionText: textOf(question?.enonce ?? question?.questionText ?? question?.text ?? qtext),
                    choicesText: formatChoices(options),
                    selectedChoiceLabel: selectedLabel,
                    selectedChoiceText: textOf(textFromNode(selectedNode) || selectedOption?.t || selectedOption?.choiceText || selectedOption?.text || ''),
                    correctChoiceLabel: correctLabel,
                    correctChoiceText: textOf(textFromNode(correctNode) || correctOption?.t || correctOption?.choiceText || correctOption?.text || ''),
                    explanation: textOf(Array.isArray(question?.explication) ? question.explication.join(' ') : (question?.explication || question?.explanation || explanation)),
                    chapter: textOf(data?.chapitre ?? data?.chapter ?? '')
                  });
                });
                return Array.from(mistakesMap.values());
              };

              const sendSaveAllMistakes = (btnElement) => {
                const list = collectAllCurrentMistakes();
                window.parent.postMessage({
                  type: saveActionType,
                  attemptId,
                  mistakes: list
                }, '*');

                if (btnElement) {
                  const originalHtml = btnElement.innerHTML;
                  btnElement.innerHTML = '✓ Erreurs sauvegardées !';
                  btnElement.style.background = '#059669';
                  btnElement.style.borderColor = '#059669';
                  btnElement.style.color = '#ffffff';
                  setTimeout(() => {
                    btnElement.innerHTML = '✓ Sauvegardé';
                  }, 2500);
                }
              };

              window.addEventListener('message', (event) => {
                if (event.source !== window.parent || event.data?.type !== 'econcourse-request-save-mistakes') return;
                sendSaveAllMistakes(null);
              });

              const injectSaveButtons = () => {
                // 1. Bouton principal dans les actions de fin de test
                const actions = document.querySelector('.actions');
                if (actions && !document.getElementById('saveMistakesBtn')) {
                  const saveBtn = document.createElement('button');
                  saveBtn.id = 'saveMistakesBtn';
                  saveBtn.type = 'button';
                  saveBtn.className = 'btn';
                  saveBtn.innerHTML = '💾 Sauvegarder mes erreurs';
                  saveBtn.style.cssText = 'background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: 0; padding: 11px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.25); transition: 0.2s; font-family: inherit; font-size: 1rem;';
                  saveBtn.onclick = () => sendSaveAllMistakes(saveBtn);
                  actions.appendChild(saveBtn);
                }

                // 2. Bouton individuel sur chaque bloc de correction ko
                document.querySelectorAll('.corr.ko').forEach((card) => {
                  if (card.querySelector('.btn-save-single-mistake')) return;
                  const singleBtn = document.createElement('button');
                  singleBtn.className = 'btn-save-single-mistake';
                  singleBtn.type = 'button';
                  singleBtn.innerHTML = '💾 Sauvegarder cette erreur';
                  singleBtn.style.cssText = 'margin-top: 10px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px;';
                  singleBtn.onclick = () => {
                    const qhead = card.querySelector('.qhead')?.innerText || '';
                    const qtext = card.querySelector('.qtext, .question-text, .statement, [data-question-text]')?.innerText || '';
                    const note = card.querySelector('.note')?.innerText || '';
                    const expl = card.querySelector('.expl, .explanation, .explication, .fb.ko')?.innerText || '';
                    const qIdMatch = qhead.match(/\\d+/);
                    const qNum = qIdMatch ? parseInt(qIdMatch[0], 10) : 1;
                    const data = getData();
                    const state = getState();
                    const questions = Array.isArray(data?.questions) ? data.questions : [];
                    const question = questions.find((item, index) => String(item.questionNumber ?? item.id ?? index + 1) === String(qNum)) || questions[qNum - 1];
                    const options = question?.options ?? question?.choices ?? [];
                    const noteText = textOf(note);
                    const selectedInNote = noteText.match(/Votre réponse\\s*:\\s*([A-Za-z0-9_-]+)/i)?.[1] || '';
                    const correctInNote = noteText.match(/Bonne réponse(?:\\s*\\([^)]*\\))?\\s*:\\s*([A-Za-z0-9_-]+)/i)?.[1] || '';
                    const choiceLabel = (choice) => String(choice?.k ?? choice?.choiceLabel ?? choice?.label ?? choice?.id ?? '').trim().toUpperCase();
                    const cardChoiceLabel = (selectors) => {
                      const node = card.querySelector(selectors);
                      return textOf(node?.querySelector('.k')?.innerText || node?.dataset?.k || node?.dataset?.answer || '').toUpperCase();
                    };
                    const selectedLabel = String((question && state?.answers?.[question.id]) || selectedInNote || cardChoiceLabel('.copt.bad, .bad, .incorrect, [data-correct="false"]')).trim().toUpperCase();
                    const correctLabel = String(question?.correct || question?.correctChoiceLabel || question?.answer || correctInNote || cardChoiceLabel('.copt.good, .good, .correct, [data-correct="true"]')).trim().toUpperCase();
                    const selectedChoice = options.find((choice) => choiceLabel(choice) === selectedLabel);
                    const correctChoice = options.find((choice) => choiceLabel(choice) === correctLabel);
                    const cardChoiceText = (selectors) => {
                      const node = card.querySelector(selectors);
                      if (!node) return '';
                      const clone = node.cloneNode(true);
                      clone.querySelectorAll('.k, .tag').forEach((child) => child.remove());
                      return textOf(clone.innerText || '');
                    };
                    const mistake = {
                      questionId: question?.id ?? question?.questionNumber ?? qNum,
                      questionNumber: Number(question?.questionNumber ?? qNum) || qNum,
                      questionText: textOf(question?.enonce ?? question?.questionText ?? question?.text ?? qtext),
                      selectedChoiceLabel: selectedLabel || 'Réponse choisie',
                      selectedChoiceText: textOf(selectedChoice?.t ?? selectedChoice?.choiceText ?? selectedChoice?.text ?? cardChoiceText('.copt.bad, .bad, .incorrect, [data-correct="false"]')),
                      correctChoiceLabel: correctLabel || 'Bonne réponse',
                      correctChoiceText: textOf(correctChoice?.t ?? correctChoice?.choiceText ?? correctChoice?.text ?? cardChoiceText('.copt.good, .good, .correct, [data-correct="true"]')),
              choicesText: formatChoices(options),
                      explanation: textOf((Array.isArray(question?.explication) ? question.explication.join(' ') : (question?.explication || question?.explanation)) || expl),
                      chapter: textOf(data?.chapitre ?? data?.chapter ?? '')
                    };
                    window.parent.postMessage({
                      type: saveActionType,
                      attemptId,
                      mistakes: [mistake]
                    }, '*');
                    singleBtn.innerHTML = '✓ Erreur sauvegardée !';
                    singleBtn.style.background = '#dcfce7';
                    singleBtn.style.color = '#059669';
                    singleBtn.style.borderColor = '#86efac';
                  };
                  card.appendChild(singleBtn);
                });
              };

              document.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-k], button[data-answer], [data-choice], button.opt');
                if (!button) return;
                const data = getData();
                const state = getState();
                if (!Array.isArray(data?.questions)) {
                  const questions = getLegacyQuestions();
                  const index = getLegacyCurrentIndex();
                  const question = questions[index];
                  if (!question || !Array.isArray(question.o) || !Number.isInteger(question.a)) return;
                  const selectedLabel = String(button.querySelector('.l')?.innerText || '').trim().toUpperCase();
                  const selectedIndex = selectedLabel.charCodeAt(0) - 65;
                  if (!selectedLabel || selectedIndex < 0 || selectedIndex >= question.o.length) return;
                  const correctIndex = Number(question.a);
                  publish({
                    questionId: index + 1,
                    questionNumber: index + 1,
                    questionText: textOf(question.q ?? question.questionText ?? question.text ?? ''),
            choicesText: formatChoices(question.o),
                    selectedChoiceLabel: selectedLabel,
                    selectedChoiceText: textOf(question.o[selectedIndex]),
                    correctChoiceLabel: String.fromCharCode(65 + correctIndex),
                    correctChoiceText: textOf(question.o[correctIndex]),
                    explanation: getLegacyExplanation(question),
                    chapter: textOf(question.t ?? ''),
                    isCorrect: selectedIndex === correctIndex
                  });
                  return;
                }
                const index = Number.isInteger(state?.cur) ? state.cur : 0;
                const question = data.questions[index];
                if (!question) return;
                const selectedLabel = String(button.dataset.k ?? button.dataset.answer ?? button.dataset.choice ?? '').trim().toUpperCase();
                const correctLabel = String(question.correct ?? question.correctChoiceLabel ?? question.answer ?? '').trim().toUpperCase();
                if (!selectedLabel || !correctLabel) return;
                const options = question.options ?? question.choices ?? [];
                const selected = options.find((choice) => getChoiceLabel(choice) === selectedLabel);
                const correct = options.find((choice) => getChoiceLabel(choice) === correctLabel);
                const isCorrect = selectedLabel === correctLabel;
                const payload = {
                  questionId: question.id ?? question.questionNumber ?? index + 1,
                  questionNumber: question.questionNumber ?? question.id ?? index + 1,
                  questionText: textOf(question.enonce ?? question.questionText ?? question.text ?? ''),
          choicesText: formatChoices(options),
                  selectedChoiceLabel: selectedLabel,
                  selectedChoiceText: textOf(selected?.t ?? selected?.choiceText ?? selected?.text ?? button.innerText),
                  correctChoiceLabel: correctLabel,
                  isCorrect: isCorrect,
                  correctChoiceText: getChoiceText(correct),
                  explanation: textOf(Array.isArray(question.explication) ? question.explication.join(' ') : (question.explication ?? question.explanation ?? '')),
                  chapter: textOf(data.chapitre ?? data.chapter ?? '')
                };
                window.setTimeout(() => {
                  if (state?.answers && state.answers[question.id] !== selectedLabel) return;
                  publish(payload);
                }, 0);
              }, true);

              // Observer pour détecter la fin de test et injecter les boutons de sauvegarde
              const observer = new MutationObserver(() => {
                injectSaveButtons();

                if (Array.isArray(getData()?.questions) || getLegacyQuestions().length) return;
                document.querySelectorAll('.bad, .incorrect, .wrong, .is-wrong, [data-correct="false"]').forEach((wrong) => {
                  if (wrong.dataset.econcourseTracked) return;
                  const container = wrong.closest('[data-question], .question, .qcm-question, .qbox, #qBody') || wrong.parentElement?.parentElement;
                  if (!container) return;
                  const correct = container.querySelector('.good, .correct, .is-correct, [data-correct="true"]');
                  if (!correct) return;
                  wrong.dataset.econcourseTracked = 'true';
                  const questionText = container.querySelector('.qtext, .question-text, .statement, [data-question-text]')?.innerText || '';
                  const selectedChoiceLabel = wrong.dataset.k ?? wrong.dataset.answer ?? '';
                  const correctChoiceLabel = correct.dataset.k ?? correct.dataset.answer ?? '';
                  publish({
                    questionId: container.dataset.questionId ?? container.dataset.id ?? textOf(questionText).slice(0, 80),
                    questionNumber: container.dataset.questionNumber ?? '',
                    questionText: textOf(questionText),
            choicesText: Array.from(container.querySelectorAll('.choice, .option, .opt, [data-choice]'))
              .map((choice, index) => `${String.fromCharCode(65 + index)}. ${textOf(choice.innerText)}`).join('\\n'),
                    selectedChoiceLabel: String(selectedChoiceLabel || 'Réponse choisie').toUpperCase(),
                    selectedChoiceText: textOf(wrong.innerText),
                    correctChoiceLabel: String(correctChoiceLabel || 'Bonne réponse').toUpperCase(),
                    correctChoiceText: textOf(correct.innerText),
                    explanation: textOf(container.querySelector('.explanation, .explication, .fb.ko')?.innerText || ''),
                    chapter: '',
                    isCorrect: false
                  });
                });
              });
              observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-correct'] });

              window.addEventListener('message', (event) => {
                if (event.data?.type === 'econcourse-mistakes-saved-ack') {
                  const btn = document.getElementById('saveMistakesBtn');
                  if (btn) {
                    btn.innerHTML = '✓ Erreurs sauvegardées !';
                    btn.style.background = '#059669';
                    btn.style.borderColor = '#059669';
                    btn.style.color = '#ffffff';
                  }
                }
              });
            })();
            """;

    @GetMapping(value = "/tracking-bridge.js", produces = "application/javascript")
    public ResponseEntity<String> getTrackingBridge() {
        return ResponseEntity.ok(QCM_TRACKING_BRIDGE);
    }

    @GetMapping(value = "/tracked-html/{fileName:.+}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<?> getTrackedHtml(@PathVariable String fileName) {
        if (fileName == null || !fileName.matches("(?i)[a-z0-9._-]+\\.html?")) {
            return ResponseEntity.badRequest().body("Nom de fichier HTML invalide.");
        }

        try {
            Path uploadRoot = Path.of(UPLOAD_DIR).toAbsolutePath().normalize();
            Path htmlPath = uploadRoot.resolve(fileName).normalize();
            if (!htmlPath.startsWith(uploadRoot) || !Files.isRegularFile(htmlPath)) {
                return ResponseEntity.notFound().build();
            }

            String html = Files.readString(htmlPath);
            if (!html.toLowerCase(Locale.ROOT).contains("<html")) {
                return ResponseEntity.badRequest().body("Le fichier n'est pas une page HTML.");
            }
            if (!html.toLowerCase(Locale.ROOT).contains("<base ")) {
                html = html.replaceFirst("(?i)<head([^>]*)>", "<head$1><base href=\"/uploads/\">");
            }
            if (!html.contains("econcourse-qcm-mistake")) {
                String bridgeTag = "<script defer src=\"/api/qcm/tracking-bridge.js\"></script>";
                if (html.matches("(?is).*?</body\\s*>.*")) {
                    html = html.replaceFirst("(?i)</body\\s*>", bridgeTag + "</body>");
                } else {
                    html += bridgeTag;
                }
            }
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Impossible d'ouvrir le fichier QCM suivi.");
        }
    }
}
