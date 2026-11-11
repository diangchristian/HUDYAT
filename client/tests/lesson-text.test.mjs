import test from 'node:test';
import assert from 'node:assert/strict';
import {isEmoji, pictureKey, readingParts, usedPictures} from '../src/lib/lesson-text.ts';

const words = (parts) => parts.filter((p) => p.kind !== 'space').map((p) => `${p.kind}:${p.text}`);

test('splits text into words and spaces, keeping the whitespace',()=>{
 const parts = readingParts('Say hi to friends', 'hello');
 assert.equal(parts.map((p) => p.text).join(''), 'Say hi to friends');
 assert.deepEqual(words(parts), ['word:Say', 'word:hi', 'word:to', 'word:friends']);
});
test('keeps a multi-word sign name together and marks it, case-insensitively',()=>{
 assert.deepEqual(words(readingParts('We say good morning at school.', 'Good Morning')),
  ['word:We', 'word:say', 'sign:good morning', 'word:at', 'word:school.']);
});
test('sign names with regex characters are matched literally',()=>{
 assert.deepEqual(words(readingParts('What? means asking', 'What?')), ['sign:What?', 'word:means', 'word:asking']);
});
test('a picture key ignores case and punctuation, so "Morning," and "morning!" share one picture',()=>{
 assert.equal(pictureKey('Morning,'), 'morning');
 assert.equal(pictureKey('morning!'), 'morning');
 assert.equal(pictureKey("you're"), "you're");
 assert.equal(pictureKey('Good  Morning!'), 'good morning');
 assert.equal(pictureKey('—'), '');
});
test('only pictures whose word is still in the text are kept, including the sign name',()=>{
 const pictures = {morning: '☀️', 'good morning': '🌅', school: '🏫'};
 assert.deepEqual(usedPictures('Say Good morning in the morning.', 'Good Morning', pictures), {morning: '☀️', 'good morning': '🌅'});
 assert.deepEqual(usedPictures('', 'Hello', pictures), {});
});
test('a pasted picture must be emoji, matching the server rule',()=>{
 for (const ok of ['🌅', '☀️', '🧑‍🤝‍🧑', '1️⃣', '#️⃣', '🇵🇭', '👋🏽', '🍎🍎🍎']) assert.ok(isEmoji(ok), ok);
 for (const bad of ['hello', '123', '', '🌅 morning', '#', '🍎12', '⭐#']) assert.ok(!isEmoji(bad), bad);
});
test('the sign name is only matched as a whole word, so "A" does not split "Apple"',()=>{
 assert.deepEqual(words(readingParts('A is for Apple and Ant.', 'A')), ['sign:A', 'word:is', 'word:for', 'word:Apple', 'word:and', 'word:Ant.']);
 assert.deepEqual(words(readingParts('Say "a"!', 'A')), ['word:Say', 'word:"', 'sign:a', 'word:"!']);
});
