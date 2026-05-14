<script lang="ts">
	import { Minus, Move, Plus, RotateCcw } from '@lucide/svelte';
	import {
		binomialRangeProbability,
		evaluateFunctionExpression,
		sampleBinomialPlot,
		sampleFunctionPlot,
		type FunctionAnnotationPoint,
		type FunctionPlotPoint,
		type MathVizSpec
	} from '$lib/math-viz';

	let { spec }: { spec: MathVizSpec } = $props();

	const width = 760;
	const height = 340;
	const margin = { top: 30, right: 32, bottom: 36, left: 74 };
	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.top - margin.bottom;
	const minDomainSpan = 1e-7;
	const maxDomainSpan = 1e9;

	let view = $state<{ x: [number, number]; y: [number, number] } | null>(null);
	let dragStart = $state<{
		x: number;
		y: number;
		xDomain: [number, number];
		yDomain: [number, number];
	} | null>(null);
	let activePointIndex = $state<number | null>(null);

	function niceNumber(value: number) {
		if (Math.abs(value) < 1e-10) return '0';
		if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) return value.toExponential(1);
		return value.toFixed(2).replace(/\.?0+$/, '');
	}

	function quantile(values: number[], q: number) {
		if (values.length === 0) return 0;
		const sorted = [...values].sort((a, b) => a - b);
		const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)));
		return sorted[index];
	}

	const baseXDomain = $derived.by(() => {
		if (spec.kind === 'function') return [spec.from, spec.to] as [number, number];
		return [-0.5, spec.n + 0.5] as [number, number];
	});

	const xDomain = $derived(view?.x ?? baseXDomain);

	const data = $derived.by(() => {
		try {
			return spec.kind === 'function'
				? sampleFunctionPlot({ ...spec, from: xDomain[0], to: xDomain[1] }, 900)
				: sampleBinomialPlot(spec);
		} catch {
			return [];
		}
	});

	const autoYDomain = $derived.by(() => {
		const values = data
			.map((point) => point.y)
			.filter((value): value is number => value != null && Number.isFinite(value));
		if (spec.kind === 'function') {
			values.push(0);
		} else {
			values.push(0);
		}

		const min = spec.kind === 'function' ? quantile(values, 0.1) : 0;
		const max = spec.kind === 'function' ? quantile(values, 0.9) : Math.max(...values);
		if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1] as const;
		if (min === max) return [min - 1, max + 1] as const;
		const pad = (max - min) * 0.12;
		return [spec.kind === 'binomial' ? 0 : min - pad, max + pad] as const;
	});

	const yDomain = $derived(view?.y ?? autoYDomain);

	function xScale(value: number) {
		return margin.left + ((value - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotWidth;
	}

	function yScale(value: number) {
		return (
			margin.top + plotHeight - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotHeight
		);
	}

	const functionPlot = $derived.by(() => {
		const emptyPlot = { paths: [] as string[], discontinuities: [] as number[] };
		if (spec.kind !== 'function' || data.length === 0) return emptyPlot;
		const paths: string[] = [];
		const discontinuities: number[] = [];
		let current: FunctionPlotPoint[] = [];
		const ySpan = yDomain[1] - yDomain[0];

		function flush() {
			if (current.length < 2) {
				current = [];
				return;
			}

			paths.push(
				current
					.map(
						(point, index) => `${index === 0 ? 'M' : 'L'} ${xScale(point.x)} ${yScale(point.y!)}`
					)
					.join(' ')
			);
			current = [];
		}

		for (const point of data as FunctionPlotPoint[]) {
			const previous = current.at(-1);
			const y = point.y;
			const farOutside = y == null || y < yDomain[0] - ySpan || y > yDomain[1] + ySpan;
			const jump =
				previous?.y != null && y != null ? Math.abs(y - previous.y) > ySpan * 0.9 : false;

			if (farOutside || jump) {
				if (previous) {
					discontinuities.push((previous.x + point.x) / 2);
				}
				flush();
				continue;
			}

			current.push(point);
		}

		flush();
		return {
			paths,
			discontinuities: discontinuities.filter(
				(value, index, list) => index === 0 || Math.abs(value - list[index - 1]) > 0.08
			)
		};
	});

	const yTicks = $derived.by(() => {
		return Array.from({ length: 5 }, (_, index) => {
			const value = yDomain[0] + (index / 4) * (yDomain[1] - yDomain[0]);
			return { value, y: yScale(value), label: niceNumber(value) };
		});
	});

	const xTicks = $derived.by(() => {
		if (spec.kind === 'binomial') {
			const step = Math.max(1, Math.ceil(spec.n / 8));
			const values = Array.from(
				{ length: Math.floor(spec.n / step) + 1 },
				(_, index) => index * step
			);
			if (values.at(-1) !== spec.n) values.push(spec.n);
			return values.map((value) => ({ value, x: xScale(value), label: String(value) }));
		}

		const count = 5;
		return Array.from({ length: count }, (_, index) => {
			const value = xDomain[0] + (index / Math.max(count - 1, 1)) * (xDomain[1] - xDomain[0]);
			return {
				value,
				x: xScale(value),
				label: niceNumber(value)
			};
		});
	});

	const title = $derived.by(() => {
		if (spec.title) return spec.title;
		if (spec.kind === 'function') return `f(x) = ${spec.expr}`;
		return `Binomial distribution: n = ${spec.n}, p = ${niceNumber(spec.p)}`;
	});

	const yAxisLabel = $derived(spec.yLabel ?? (spec.kind === 'binomial' ? 'P(X = x)' : 'f(x)'));
	const xAxisLabel = $derived(spec.xLabel ?? 'x');

	const svgId = $derived(`math-viz-${title.replace(/\W+/g, '-').toLowerCase()}`);
	const clipId = $derived(`${svgId}-clip`);
	const annotationShadowId = $derived(`${svgId}-annotation-shadow`);

	const binomialTestSummary = $derived.by(() => {
		if (spec.kind !== 'binomial') return { alphaLabel: '', betaLabel: '' };

		const hasLower = spec.rejectLte != null;
		const hasUpper = spec.rejectGte != null;
		if (!hasLower && !hasUpper) return { alphaLabel: '', betaLabel: '' };

		const lowerAlpha = hasLower ? binomialRangeProbability(spec.n, spec.p, 0, spec.rejectLte!) : 0;
		const upperAlpha = hasUpper
			? binomialRangeProbability(spec.n, spec.p, spec.rejectGte!, spec.n)
			: 0;
		const alpha = lowerAlpha + upperAlpha;

		let betaLabel = '';
		if (spec.alternativeP != null) {
			const acceptanceFrom = hasLower ? spec.rejectLte! + 1 : 0;
			const acceptanceTo = hasUpper ? spec.rejectGte! - 1 : spec.n;
			const beta = binomialRangeProbability(
				spec.n,
				spec.alternativeP,
				acceptanceFrom,
				acceptanceTo
			);
			betaLabel = `beta ${niceNumber(beta)}`;
		}

		return {
			alphaLabel: `alpha ${niceNumber(alpha)}`,
			betaLabel
		};
	});

	const subtitle = $derived.by(() => {
		if (spec.kind === 'function') {
			return `${niceNumber(xDomain[0])} <= x <= ${niceNumber(xDomain[1])}`;
		}

		const mean = spec.n * spec.p;
		const variance = spec.n * spec.p * (1 - spec.p);
		const testParts = binomialTestSummary;
		return [
			`mean ${niceNumber(mean)} · variance ${niceNumber(variance)}`,
			testParts.alphaLabel,
			testParts.betaLabel
		]
			.filter(Boolean)
			.join(' · ');
	});

	const hasError = $derived(
		data.filter((point) => point.y != null && Number.isFinite(point.y)).length === 0
	);

	const visibleAnnotationPoints = $derived.by(() => {
		if (spec.kind !== 'function') return [];
		return (spec.points ?? [])
			.map((point, index) => {
				const y = getAnnotationY(point);

				return {
					...point,
					y,
					index,
					screenX: xScale(point.x),
					screenY: yScale(y)
				};
			})
			.filter((point) => {
				return (
					point.x >= xDomain[0] &&
					point.x <= xDomain[1] &&
					point.y >= yDomain[0] &&
					point.y <= yDomain[1]
				);
			});
	});

	function getAnnotationLabel(point: FunctionAnnotationPoint) {
		return point.label
			? `${point.label}: (${niceNumber(point.x)}, ${niceNumber(point.y)})`
			: `(${niceNumber(point.x)}, ${niceNumber(point.y)})`;
	}

	function getAnnotationY(point: FunctionAnnotationPoint) {
		if (spec.kind !== 'function') return point.y;

		try {
			return evaluateFunctionExpression(spec.expr, point.x) ?? point.y;
		} catch {
			return point.y;
		}
	}

	function getBinomialBarClass(x: number) {
		if (spec.kind !== 'binomial') return '';
		if (
			(spec.rejectLte != null && x <= spec.rejectLte) ||
			(spec.rejectGte != null && x >= spec.rejectGte)
		) {
			return 'binomial-bar--reject';
		}
		return 'binomial-bar--accept';
	}

	function getBinomialBarLabel(x: number, y: number | null) {
		const value = niceNumber(y ?? 0);
		const parts = [`x = ${x}`, `P = ${value}`];
		if (spec.kind === 'binomial' && spec.observed === x) parts.push('observed');
		if (spec.kind === 'binomial' && spec.rejectLte != null && x <= spec.rejectLte) {
			parts.push('reject H0');
		}
		if (spec.kind === 'binomial' && spec.rejectGte != null && x >= spec.rejectGte) {
			parts.push('reject H0');
		}
		return parts.join(', ');
	}

	function handleAnnotationPointerDown(event: PointerEvent) {
		event.stopPropagation();
	}

	function handleAnnotationKeydown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			activePointIndex = activePointIndex === index ? null : index;
			event.preventDefault();
		}

		if (event.key === 'Escape') {
			activePointIndex = null;
			event.preventDefault();
		}
	}

	function clampDomain(
		domain: readonly [number, number],
		fallback: readonly [number, number]
	): [number, number] {
		const [start, end] = domain;
		if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) {
			return [fallback[0], fallback[1]];
		}
		const center = (start + end) / 2;
		const span = Math.min(maxDomainSpan, Math.max(minDomainSpan, Math.abs(end - start)));
		return [center - span / 2, center + span / 2] as [number, number];
	}

	function getPlotPoint(event: PointerEvent | WheelEvent, element: SVGSVGElement) {
		const rect = element.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * width;
		const y = ((event.clientY - rect.top) / rect.height) * height;
		return { x, y };
	}

	function isInsidePlot(point: { x: number; y: number }) {
		return (
			point.x >= margin.left &&
			point.x <= width - margin.right &&
			point.y >= margin.top &&
			point.y <= height - margin.bottom
		);
	}

	function xUnscale(pixel: number, domain = xDomain) {
		return domain[0] + ((pixel - margin.left) / plotWidth) * (domain[1] - domain[0]);
	}

	function yUnscale(pixel: number, domain = yDomain) {
		return domain[0] + ((height - margin.bottom - pixel) / plotHeight) * (domain[1] - domain[0]);
	}

	function zoomAt(
		factor: number,
		anchorX = (xDomain[0] + xDomain[1]) / 2,
		anchorY = (yDomain[0] + yDomain[1]) / 2
	) {
		const nextX: [number, number] = [
			anchorX + (xDomain[0] - anchorX) * factor,
			anchorX + (xDomain[1] - anchorX) * factor
		];
		const nextY: [number, number] = [
			anchorY + (yDomain[0] - anchorY) * factor,
			anchorY + (yDomain[1] - anchorY) * factor
		];

		view = {
			x: clampDomain(nextX, xDomain),
			y: clampDomain(nextY, yDomain)
		};
	}

	function resetView() {
		view = null;
	}

	function handlePlotWheel(event: WheelEvent) {
		if (spec.kind !== 'function') {
			handleScrollerWheel(event);
			return;
		}

		const target = event.currentTarget;
		if (!(target instanceof SVGSVGElement)) return;
		const point = getPlotPoint(event, target);
		if (!isInsidePlot(point)) return;

		const factor = Math.exp(event.deltaY * 0.0012);
		zoomAt(factor, xUnscale(point.x), yUnscale(point.y));
		event.preventDefault();
		event.stopPropagation();
	}

	function handlePointerDown(event: PointerEvent) {
		if (spec.kind !== 'function' || event.button !== 0) return;
		const target = event.currentTarget;
		if (!(target instanceof SVGSVGElement)) return;
		const point = getPlotPoint(event, target);
		if (!isInsidePlot(point)) return;

		dragStart = {
			x: point.x,
			y: point.y,
			xDomain: [...xDomain],
			yDomain: [...yDomain]
		};
		target.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function handlePointerMove(event: PointerEvent) {
		if (!dragStart) return;
		const target = event.currentTarget;
		if (!(target instanceof SVGSVGElement)) return;
		const point = getPlotPoint(event, target);
		const dx =
			((point.x - dragStart.x) / plotWidth) * (dragStart.xDomain[1] - dragStart.xDomain[0]);
		const dy =
			((point.y - dragStart.y) / plotHeight) * (dragStart.yDomain[1] - dragStart.yDomain[0]);

		view = {
			x: [dragStart.xDomain[0] - dx, dragStart.xDomain[1] - dx],
			y: [dragStart.yDomain[0] + dy, dragStart.yDomain[1] + dy]
		};
	}

	function handlePointerUp(event: PointerEvent) {
		const target = event.currentTarget;
		if (target instanceof SVGSVGElement && target.hasPointerCapture(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
		dragStart = null;
	}

	function handleScrollerWheel(event: WheelEvent) {
		if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

		const target = event.currentTarget;
		if (!(target instanceof HTMLElement)) return;

		const chatScroller = target.closest('[data-chat-scroll-container]');
		if (!(chatScroller instanceof HTMLElement)) return;

		chatScroller.scrollTop += event.deltaY;
		event.preventDefault();
	}
</script>

<figure class="math-viz not-prose" aria-label={title}>
	<figcaption class="math-viz__heading">
		<div>
			<div class="math-viz__title">{title}</div>
			<p>{subtitle}</p>
		</div>
		<span>{spec.kind === 'function' ? 'function' : 'binomial'}</span>
	</figcaption>

	{#if hasError}
		<div class="math-viz__error">This math visualization could not be rendered.</div>
	{:else}
		{#if spec.kind === 'function'}
			<div class="plot-controls" aria-label="Plot controls">
				<button type="button" aria-label="Pan by dragging the plot" title="Drag to pan">
					<Move size={13} />
				</button>
				<button type="button" aria-label="Zoom in" title="Zoom in" onclick={() => zoomAt(0.72)}>
					<Plus size={13} />
				</button>
				<button type="button" aria-label="Zoom out" title="Zoom out" onclick={() => zoomAt(1.38)}>
					<Minus size={13} />
				</button>
				<button type="button" aria-label="Reset plot view" title="Reset view" onclick={resetView}>
					<RotateCcw size={13} />
				</button>
			</div>
		{/if}
		<section class="math-viz__scroller" aria-label={`${title} chart`} onwheel={handleScrollerWheel}>
			<svg
				viewBox={`0 0 ${width} ${height}`}
				role="img"
				class:plot-is-dragging={dragStart != null}
				onwheel={handlePlotWheel}
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
				ondblclick={resetView}
			>
				<defs>
					<clipPath id={clipId}>
						<rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} rx="12" />
					</clipPath>
					<filter id={annotationShadowId} x="-20%" y="-40%" width="140%" height="180%">
						<feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="black" flood-opacity="0.28" />
					</filter>
				</defs>
				<rect
					x={margin.left}
					y={margin.top}
					width={plotWidth}
					height={plotHeight}
					rx="12"
					class="plot-bg"
				/>
				<text x={margin.left + 12} y={margin.top + 22} class="axis-badge">{yAxisLabel}</text>
				<text
					x={width - margin.right - 12}
					y={height - margin.bottom - 12}
					text-anchor="end"
					class="axis-badge"
				>
					{xAxisLabel}
				</text>

				{#each yTicks as tick, tickIndex (tickIndex)}
					<line
						x1={margin.left}
						x2={width - margin.right}
						y1={tick.y}
						y2={tick.y}
						class="grid-line"
					/>
					<text x={margin.left - 12} y={tick.y + 4} text-anchor="end" class="axis-label"
						>{tick.label}</text
					>
				{/each}

				{#each xTicks as tick, tickIndex (tickIndex)}
					<line
						x1={tick.x}
						x2={tick.x}
						y1={margin.top}
						y2={height - margin.bottom}
						class="grid-line grid-line--x"
					/>
					<text x={tick.x} y={height - margin.bottom + 24} text-anchor="middle" class="axis-label"
						>{tick.label}</text
					>
				{/each}

				<line
					x1={margin.left}
					x2={width - margin.right}
					y1={yScale(0)}
					y2={yScale(0)}
					class="axis-line"
				/>
				{#if spec.kind === 'function' && spec.from <= 0 && spec.to >= 0}
					<line
						x1={xScale(0)}
						x2={xScale(0)}
						y1={margin.top}
						y2={height - margin.bottom}
						class="axis-line"
					/>
				{/if}

				{#if spec.kind === 'function'}
					{#each functionPlot.discontinuities as x (x)}
						{#if x > xDomain[0] && x < xDomain[1]}
							<line
								x1={xScale(x)}
								x2={xScale(x)}
								y1={margin.top}
								y2={height - margin.bottom}
								class="asymptote-line"
							/>
						{/if}
					{/each}
				{/if}

				<g clip-path={`url(#${clipId})`}>
					{#if spec.kind === 'function'}
						{#each functionPlot.paths as path (path)}
							<path d={path} class="function-line function-line--halo" />
							<path d={path} class="function-line" />
						{/each}
					{:else}
						{@const barGap = spec.n > 160 ? 0.35 : 4}
						{@const barWidth = Math.max(spec.n > 160 ? 1 : 4, plotWidth / (spec.n + 1) - barGap)}
						{#each data as point (point.x)}
							{@const barHeight = Math.max(1, yScale(0) - yScale(point.y ?? 0))}
							<rect
								x={xScale(point.x) - barWidth / 2}
								y={yScale(point.y ?? 0)}
								width={barWidth}
								height={barHeight}
								rx={spec.n > 160 ? 1 : 7}
								class={`binomial-bar ${getBinomialBarClass(point.x)}`}
								aria-label={getBinomialBarLabel(point.x, point.y)}
							/>
						{/each}
					{/if}
				</g>

				{#if spec.kind === 'binomial'}
					{#if spec.rejectLte != null}
						{@const lowerX = xScale(spec.rejectLte)}
						<line
							x1={lowerX}
							x2={lowerX}
							y1={margin.top}
							y2={height - margin.bottom}
							class="critical-line"
						/>
						<text x={lowerX - 8} y={margin.top + 18} text-anchor="end" class="critical-label">
							reject H0: x &lt;= {spec.rejectLte}
						</text>
					{/if}
					{#if spec.rejectGte != null}
						{@const upperX = xScale(spec.rejectGte)}
						<line
							x1={upperX}
							x2={upperX}
							y1={margin.top}
							y2={height - margin.bottom}
							class="critical-line"
						/>
						<text x={upperX + 8} y={margin.top + 18} class="critical-label">
							reject H0: x &gt;= {spec.rejectGte}
						</text>
					{/if}
					{#if spec.observed != null}
						{@const observedX = xScale(spec.observed)}
						<line
							x1={observedX}
							x2={observedX}
							y1={margin.top - 8}
							y2={height - margin.bottom}
							class="observed-line"
						/>
						<circle cx={observedX} cy={margin.top - 8} r="5" class="observed-dot" />
						<text x={observedX + 9} y={margin.top - 12} class="observed-label">
							observed x = {spec.observed}
						</text>
					{/if}
					<g class="binomial-legend" transform={`translate(${margin.left + 12} ${height - 18})`}>
						<rect x="0" y="-10" width="10" height="10" rx="2" class="legend-accept" />
						<text x="16" y="-1">do not reject H0</text>
						<rect x="142" y="-10" width="10" height="10" rx="2" class="legend-reject" />
						<text x="158" y="-1">reject H0</text>
						{#if spec.alternativeP != null}
							<text x="250" y="-1">
								{spec.nullLabel ?? `H0: p = ${niceNumber(spec.p)}`} ·
								{spec.alternativeLabel ?? `p1 = ${niceNumber(spec.alternativeP)}`}
							</text>
						{:else if spec.nullLabel}
							<text x="250" y="-1">{spec.nullLabel}</text>
						{/if}
					</g>
				{/if}

				{#if spec.kind === 'function'}
					{#each visibleAnnotationPoints as point (point.index)}
						<g
							class="annotation-point"
							class:annotation-point--active={activePointIndex === point.index}
							tabindex="0"
							role="button"
							aria-label={getAnnotationLabel(point)}
							onpointerenter={() => (activePointIndex = point.index)}
							onpointerleave={() => (activePointIndex = null)}
							onpointerdown={handleAnnotationPointerDown}
							onfocus={() => (activePointIndex = point.index)}
							onblur={() => (activePointIndex = null)}
							onkeydown={(event) => handleAnnotationKeydown(event, point.index)}
						>
							{#if activePointIndex === point.index}
								<line
									x1={point.screenX}
									x2={point.screenX}
									y1={margin.top}
									y2={height - margin.bottom}
									class="annotation-guide"
								/>
								<line
									x1={margin.left}
									x2={width - margin.right}
									y1={point.screenY}
									y2={point.screenY}
									class="annotation-guide"
								/>
								{@const tooltipWidth = Math.max(92, getAnnotationLabel(point).length * 6.5)}
								{@const tooltipX = Math.min(
									width - margin.right - tooltipWidth - 8,
									Math.max(margin.left + 8, point.screenX + 12)
								)}
								{@const tooltipY = Math.max(margin.top + 8, point.screenY - 34)}
								<rect
									x={tooltipX}
									y={tooltipY}
									width={tooltipWidth}
									height="26"
									rx="7"
									filter={`url(#${annotationShadowId})`}
									class="annotation-tooltip-bg"
								/>
								<text x={tooltipX + 10} y={tooltipY + 17} class="annotation-tooltip-text">
									{getAnnotationLabel(point)}
								</text>
							{/if}
							<circle cx={point.screenX} cy={point.screenY} r="16" class="annotation-hit" />
							<circle cx={point.screenX} cy={point.screenY} r="9" class="annotation-halo" />
							<circle cx={point.screenX} cy={point.screenY} r="5.8" class="annotation-ring" />
							<circle cx={point.screenX} cy={point.screenY} r="3.6" class="annotation-dot" />
						</g>
					{/each}
				{/if}
			</svg>
		</section>
	{/if}
</figure>

<style>
	.math-viz {
		margin: 0.85rem 0;
		width: min(100%, 48rem);
		max-width: 100%;
		overflow: clip;
		border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
		border-radius: 10px;
		background:
			radial-gradient(
				circle at 16% 8%,
				color-mix(in oklab, var(--chart-1) 16%, transparent),
				transparent 34%
			),
			linear-gradient(180deg, color-mix(in oklab, var(--card) 96%, white), var(--card)), var(--card);
		box-shadow: 0 18px 50px color-mix(in oklab, black 10%, transparent);
	}

	.math-viz__scroller {
		max-width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
	}

	.math-viz__heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.1rem 0.45rem;
	}

	.math-viz__title {
		color: var(--foreground);
		font-size: 0.95rem;
		font-weight: 650;
		line-height: 1.25;
	}

	p {
		margin: 0.15rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	span {
		border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
		border-radius: 999px;
		padding: 0.2rem 0.52rem;
		color: var(--muted-foreground);
		font-size: 0.64rem;
		font-weight: 700;
		line-height: 1;
		text-transform: uppercase;
	}

	svg {
		display: block;
		width: max(100%, 760px);
		min-width: 760px;
		height: auto;
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	svg.plot-is-dragging {
		cursor: grabbing;
	}

	.plot-controls {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
		padding: 0 1.1rem 0.3rem;
	}

	.plot-controls button {
		display: inline-flex;
		width: 1.7rem;
		height: 1.7rem;
		align-items: center;
		justify-content: center;
		border: 1px solid color-mix(in oklab, var(--border) 76%, transparent);
		border-radius: 999px;
		background: color-mix(in oklab, var(--card) 86%, transparent);
		color: var(--muted-foreground);
		transition:
			background 140ms ease,
			color 140ms ease,
			border-color 140ms ease;
	}

	.plot-controls button:hover {
		border-color: color-mix(in oklab, var(--foreground) 22%, var(--border));
		background: color-mix(in oklab, var(--accent) 70%, var(--card));
		color: var(--foreground);
	}

	.plot-bg {
		fill: color-mix(in oklab, var(--muted) 32%, transparent);
	}

	.grid-line {
		stroke: color-mix(in oklab, var(--border) 58%, transparent);
		stroke-width: 1;
	}

	.grid-line--x {
		opacity: 0.55;
	}

	.axis-line {
		stroke: color-mix(in oklab, var(--foreground) 28%, transparent);
		stroke-width: 1.1;
	}

	.asymptote-line {
		stroke: color-mix(in oklab, var(--foreground) 38%, transparent);
		stroke-dasharray: 5 7;
		stroke-linecap: round;
		stroke-width: 1.15;
	}

	.function-line {
		fill: none;
		stroke: oklch(0.72 0.14 214);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 3.5;
	}

	.function-line--halo {
		stroke: color-mix(in oklab, oklch(0.72 0.14 214) 28%, transparent);
		stroke-width: 8;
	}

	.binomial-bar--accept {
		fill: color-mix(in oklab, oklch(0.66 0.14 176) 92%, var(--card));
	}

	.binomial-bar--reject {
		fill: color-mix(in oklab, oklch(0.68 0.19 32) 90%, var(--card));
	}

	.critical-line {
		stroke: color-mix(in oklab, oklch(0.68 0.19 32) 76%, var(--foreground));
		stroke-dasharray: 5 5;
		stroke-linecap: round;
		stroke-width: 1.6;
	}

	.critical-label,
	.observed-label {
		fill: color-mix(in oklab, var(--foreground) 92%, var(--card));
		font-size: 11px;
		font-weight: 720;
	}

	.observed-line {
		stroke: color-mix(in oklab, oklch(0.78 0.16 88) 76%, var(--foreground));
		stroke-width: 2;
	}

	.observed-dot {
		fill: oklch(0.82 0.17 88);
		stroke: color-mix(in oklab, var(--card) 92%, black);
		stroke-width: 1.5;
	}

	.binomial-legend text {
		fill: var(--muted-foreground);
		font-size: 10.5px;
		font-weight: 650;
	}

	.legend-accept {
		fill: color-mix(in oklab, oklch(0.66 0.14 176) 92%, var(--card));
	}

	.legend-reject {
		fill: color-mix(in oklab, oklch(0.68 0.19 32) 90%, var(--card));
	}

	.annotation-point {
		outline: none;
		pointer-events: all;
	}

	.annotation-hit {
		fill: transparent;
		cursor: pointer;
	}

	.annotation-dot {
		fill: color-mix(in oklab, oklch(0.82 0.17 88) 48%, var(--card));
		stroke: color-mix(in oklab, var(--foreground) 18%, var(--card));
		stroke-width: 1.2;
		transition:
			fill 140ms ease,
			stroke 140ms ease;
	}

	.annotation-halo {
		fill: color-mix(in oklab, oklch(0.82 0.17 88) 18%, transparent);
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.annotation-ring {
		fill: none;
		stroke: color-mix(in oklab, oklch(0.82 0.17 88) 58%, transparent);
		stroke-width: 1.5;
		opacity: 0.42;
		transition:
			opacity 140ms ease,
			stroke-width 140ms ease;
	}

	.annotation-point--active .annotation-dot,
	.annotation-point:focus-visible .annotation-dot {
		fill: oklch(0.84 0.18 86);
		stroke: color-mix(in oklab, var(--card) 86%, black);
	}

	.annotation-point--active .annotation-halo,
	.annotation-point:focus-visible .annotation-halo {
		opacity: 1;
	}

	.annotation-point--active .annotation-ring,
	.annotation-point:focus-visible .annotation-ring {
		opacity: 0.94;
		stroke-width: 2;
	}

	.annotation-guide {
		stroke: color-mix(in oklab, oklch(0.82 0.17 88) 31%, transparent);
		stroke-dasharray: 3 8;
		stroke-linecap: round;
		stroke-width: 1;
	}

	.annotation-tooltip-bg {
		fill: color-mix(in oklab, var(--card) 94%, black);
		stroke: color-mix(in oklab, oklch(0.82 0.17 88) 34%, var(--border));
		stroke-width: 1;
	}

	.annotation-tooltip-text {
		fill: color-mix(in oklab, var(--foreground) 94%, oklch(0.82 0.17 88));
		font-size: 10.5px;
		font-weight: 620;
		letter-spacing: 0.01em;
	}

	.axis-label {
		fill: var(--muted-foreground);
		font-size: 12px;
	}

	.axis-badge {
		fill: color-mix(in oklab, var(--muted-foreground) 88%, var(--foreground));
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.math-viz__error {
		padding: 1rem;
		color: var(--destructive);
		font-size: 0.875rem;
	}
</style>
