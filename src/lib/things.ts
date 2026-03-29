import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

marked.use(markedKatex({ throwOnError: false }));

export { marked };

export const ratings = ['Unrated', 'Blank', 'Hard', 'Good', 'Easy'] as const;

export const studyStepTypes = [
	'milestone',
	'lesson',
	'assignment',
	'project',
	'exam',
	'review',
	'break'
] as const;

export type StudyStepType = (typeof studyStepTypes)[number];
