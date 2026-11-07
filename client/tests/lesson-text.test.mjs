import test from 'node:test';
import assert from 'node:assert/strict';
import {readingParts} from '../src/lib/lesson-text.ts';

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
