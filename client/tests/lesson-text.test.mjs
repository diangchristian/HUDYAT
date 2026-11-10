import { test, expect } from "vitest";
import {readingParts} from '../src/lib/lesson-text.ts';

const words = (parts) => parts.filter((p) => p.kind !== 'space').map((p) => `${p.kind}:${p.text}`);

test('splits text into words and spaces, keeping the whitespace',()=>{
 const parts = readingParts('Say hi to friends', 'hello');
 expect(parts.map((p) => p.text).join('')).toBe('Say hi to friends');
 expect(words(parts)).toStrictEqual(['word:Say', 'word:hi', 'word:to', 'word:friends']);
});
test('keeps a multi-word sign name together and marks it, case-insensitively',()=>{
 expect(words(readingParts('We say good morning at school.', 'Good Morning'))).toStrictEqual(['word:We', 'word:say', 'sign:good morning', 'word:at', 'word:school.']);
});
test('sign names with regex characters are matched literally',()=>{
 expect(words(readingParts('What? means asking', 'What?'))).toStrictEqual(['sign:What?', 'word:means', 'word:asking']);
});
