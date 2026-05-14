export type FunctionPlotSpec = {
	kind: 'function';
	expr: string;
	from: number;
	to: number;
	title?: string;
	xLabel?: string;
	yLabel?: string;
	points?: FunctionAnnotationPoint[];
};

export type BinomialPlotSpec = {
	kind: 'binomial';
	n: number;
	p: number;
	title?: string;
	xLabel?: string;
	yLabel?: string;
};

export type MathVizSpec = FunctionPlotSpec | BinomialPlotSpec;

export type TextSegment = { kind: 'markdown'; text: string } | { kind: 'viz'; spec: MathVizSpec };

export type FunctionPlotPoint = { x: number; y: number | null };

export type FunctionAnnotationPoint = {
	x: number;
	y: number;
	label?: string;
};

const safeIdentifierMap: Record<string, string> = {
	abs: 'Math.abs',
	acos: 'Math.acos',
	asin: 'Math.asin',
	atan: 'Math.atan',
	ceil: 'Math.ceil',
	cos: 'Math.cos',
	e: 'Math.E',
	exp: 'Math.exp',
	floor: 'Math.floor',
	ln: 'Math.log',
	log: 'Math.log10',
	max: 'Math.max',
	min: 'Math.min',
	pi: 'Math.PI',
	pow: 'Math.pow',
	round: 'Math.round',
	sin: 'Math.sin',
	sqrt: 'Math.sqrt',
	tan: 'Math.tan'
};

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function parseAttributes(source: string) {
	const attrs: Record<string, string> = {};
	const attrPattern = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
	let match: RegExpExecArray | null;

	while ((match = attrPattern.exec(source))) {
		attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
	}

	return attrs;
}

function getNumber(attrs: Record<string, string>, keys: string[], fallback: number) {
	for (const key of keys) {
		const raw = attrs[key];
		if (raw == null) continue;
		const value = Number(raw);
		if (Number.isFinite(value)) return value;
	}

	return fallback;
}

function getString(attrs: Record<string, string>, keys: string[]) {
	for (const key of keys) {
		const value = attrs[key]?.trim();
		if (value) return value;
	}

	return undefined;
}

function parseAnnotationPoints(raw: string | undefined): FunctionAnnotationPoint[] | undefined {
	if (!raw) return undefined;

	const points: FunctionAnnotationPoint[] = [];

	for (const entry of raw.split(/[;|]/)) {
		const trimmed = entry.trim();
		if (!trimmed) continue;

		const [labelSource, coordinateSource] = trimmed.includes(':')
			? trimmed.split(/:(.+)/, 2)
			: ['', trimmed];
		const [xSource, ySource] = coordinateSource.split(',').map((value) => value.trim());
		const x = Number(xSource);
		const y = Number(ySource);
		if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

		const label = labelSource.trim();
		points.push(label.length ? { x, y, label } : { x, y });
	}

	return points.length ? points : undefined;
}

function parseVizAttributes(source: string): MathVizSpec | null {
	const attrs = parseAttributes(source);
	const type = (attrs.type ?? attrs.kind ?? '').toLowerCase();

	if (type === 'function' || attrs.expr || attrs.expression || attrs.fn) {
		const expr = getString(attrs, ['expr', 'expression', 'fn', 'function']);
		if (!expr) return null;

		const from = getNumber(attrs, ['from', 'min', 'xmin'], -10);
		const to = getNumber(attrs, ['to', 'max', 'xmax'], 10);
		if (from === to) return null;

		return {
			kind: 'function',
			expr,
			from: Math.min(from, to),
			to: Math.max(from, to),
			title: getString(attrs, ['title']),
			xLabel: getString(attrs, ['x-label', 'xlabel']),
			yLabel: getString(attrs, ['y-label', 'ylabel']),
			points: parseAnnotationPoints(getString(attrs, ['points', 'markers', 'annotations']))
		};
	}

	if (type === 'binomial' || attrs.n || attrs.p) {
		const n = Math.round(getNumber(attrs, ['n', 'trials'], Number.NaN));
		const p = getNumber(attrs, ['p', 'probability'], Number.NaN);
		if (!Number.isFinite(n) || !Number.isFinite(p)) return null;

		return {
			kind: 'binomial',
			n: clamp(n, 1, 120),
			p: clamp(p, 0, 1),
			title: getString(attrs, ['title']),
			xLabel: getString(attrs, ['x-label', 'xlabel']),
			yLabel: getString(attrs, ['y-label', 'ylabel'])
		};
	}

	return null;
}

function parseFencedViz(info: string, body: string): MathVizSpec | null {
	const [name = '', ...rest] = info.trim().split(/\s+/);
	const attrs = `${rest.join(' ')}\n${body}`;
	const normalizedName = name.toLowerCase();

	if (
		normalizedName === 'function-plot' ||
		normalizedName === 'math-plot' ||
		normalizedName === 'plot'
	) {
		return parseVizAttributes(`type="function" ${attrs}`);
	}

	if (normalizedName === 'binomial-plot' || normalizedName === 'binomial') {
		return parseVizAttributes(`type="binomial" ${attrs}`);
	}

	return null;
}

export function parseMathVizSegments(text: string): TextSegment[] {
	const segments: TextSegment[] = [];
	const pattern =
		/```([a-zA-Z-]+[^\n`]*)\n([\s\S]*?)```|<math-viz\b([^>]*)\/>|<math-viz\b([^>]*)>([\s\S]*?)<\/math-viz>/gi;
	let cursor = 0;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(text))) {
		const [raw] = match;
		const spec = match[1]
			? parseFencedViz(match[1], match[2] ?? '')
			: parseVizAttributes(`${match[3] ?? match[4] ?? ''}\n${match[5] ?? ''}`);

		if (!spec) continue;

		if (match.index > cursor) {
			segments.push({ kind: 'markdown', text: text.slice(cursor, match.index) });
		}

		segments.push({ kind: 'viz', spec });
		cursor = match.index + raw.length;
	}

	if (cursor < text.length) {
		segments.push({ kind: 'markdown', text: text.slice(cursor) });
	}

	return segments.length ? segments : [{ kind: 'markdown', text }];
}

function replaceTexFractions(expr: string) {
	let next = expr;
	const fractionPattern = /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g;
	const compactFractionPattern =
		/\\frac\s*([+-]?\d+(?:\.\d+)?|[a-zA-Z])\s*(?:\{([^{}]+)\}|([a-zA-Z]|\d+(?:\.\d+)?))/g;

	for (let index = 0; index < 12; index += 1) {
		const replaced = next
			.replace(fractionPattern, '(($1)/($2))')
			.replace(
				compactFractionPattern,
				(_match, numerator: string, bracedDenominator: string, denominator: string) => {
					return `((${numerator})/(${bracedDenominator ?? denominator}))`;
				}
			);
		if (replaced === next) break;
		next = replaced;
	}

	return next;
}

function prepareExpression(expr: string) {
	return replaceTexFractions(expr)
		.replace(/\\left|\\right/g, '')
		.replace(/\\cdot|\\times/g, '*')
		.replace(/[{}]/g, (brace) => (brace === '{' ? '(' : ')'))
		.replace(/\s+/g, '');
}

function normalizeExpression(expr: string) {
	let normalized = prepareExpression(expr);

	if (!/^[\w.+\-*/^(),]+$/.test(normalized)) {
		throw new Error('Unsupported characters in expression');
	}

	normalized = normalized
		.replace(/(\d)(?=[a-zA-Z])/g, '$1*')
		.replace(/\^/g, '**')
		.replace(/\b([a-zA-Z]+)\b/g, (name) => {
			if (name === 'x') return 'x';
			const replacement = safeIdentifierMap[name.toLowerCase()];
			if (!replacement) throw new Error(`Unsupported identifier: ${name}`);
			return replacement;
		});

	return normalized
		.replace(/(\d|\))(?=x|\(|Math\.)/g, '$1*')
		.replace(/x(?=\d|\(|Math\.)/g, 'x*')
		.replace(/(\)|x)(?=Math\.)/g, '$1*');
}

export function evaluateFunctionExpression(expr: string, x: number) {
	const normalized = normalizeExpression(expr);
	const fn = new Function('x', `"use strict"; return (${normalized});`) as (
		value: number
	) => number;
	const value = fn(x);
	return Number.isFinite(value) ? value : null;
}

export function sampleFunctionPlot(spec: FunctionPlotSpec, samples = 160) {
	const points: FunctionPlotPoint[] = [];
	const count = clamp(samples, 48, 900);

	for (let index = 0; index < count; index += 1) {
		const x = spec.from + (index / (count - 1)) * (spec.to - spec.from);
		const y = evaluateFunctionExpression(spec.expr, x);
		points.push({ x, y });
	}

	return points;
}

function binomialCoefficient(n: number, k: number) {
	let result = 1;
	for (let i = 1; i <= k; i += 1) {
		result = (result * (n - i + 1)) / i;
	}
	return result;
}

export function sampleBinomialPlot(spec: BinomialPlotSpec) {
	return Array.from({ length: spec.n + 1 }, (_, k) => ({
		x: k,
		y: binomialCoefficient(spec.n, k) * spec.p ** k * (1 - spec.p) ** (spec.n - k)
	}));
}
