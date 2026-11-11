import test from 'node:test';
import assert from 'node:assert/strict';
import {quizCardStep} from '../src/lib/quiz-card.ts';

const lesson = (changes = {}) => ({
 isUnlocked: true,
 status: 'not-started',
 signTest: {hasModel: true, available: false, best: null},
 ...changes,
});

test('the one button is always the next step: quiz, then Sign test, then play again',()=>{
 assert.equal(quizCardStep(lesson({isUnlocked: false})), 'locked');
 assert.equal(quizCardStep(lesson()), 'quiz');
 assert.equal(quizCardStep(lesson({status: 'completed', signTest: {hasModel: true, available: true, best: null}})), 'sign');
 // A Sign test that wasn't passed yet is still the next step.
 assert.equal(quizCardStep(lesson({status: 'completed', signTest: {hasModel: true, available: true, best: {score: 2, total: 5, passed: false}}})), 'sign');
 assert.equal(quizCardStep(lesson({status: 'completed', signTest: {hasModel: true, available: true, best: {score: 5, total: 5, passed: true}}})), 'again');
});
test('lessons the camera cannot check go straight from the quiz to play again',()=>{
 const noModel = {hasModel: false, available: false, best: null};
 assert.equal(quizCardStep(lesson({signTest: noModel})), 'quiz');
 assert.equal(quizCardStep(lesson({status: 'completed', signTest: noModel})), 'again');
});
