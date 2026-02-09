<svelte:head>
	<title>AI Study | Memory-first learning</title>
</svelte:head>

<script>
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
</script>

<main class="relative overflow-hidden bg-background text-foreground">
	<div class="hero-orbit" aria-hidden="true"></div>
	<div class="hero-grain" aria-hidden="true"></div>

	<section class="relative z-10 mx-auto w-full max-w-6xl px-6 pt-0">
		<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="space-y-6">
				<Badge class="w-fit border-foreground/20 bg-background/60 text-foreground">New: Study maps</Badge>
				<h1 class="font-display text-4xl leading-[1] sm:text-5xl lg:text-6xl">
					A study companion that treats memory like a craft.
				</h1>
				<p class="text-lg text-muted-foreground sm:text-xl">
					Turn messy notes into a guided plan, timed reviews, and beautiful recall prompts. Built for
					students, researchers, and anyone who wants to actually remember.
				</p>
				<div class="flex flex-wrap gap-3">
					<Button size="lg" class="rounded-full px-6">Start a free plan</Button>
					<Button size="lg" variant="outline" class="rounded-full border-foreground/30">
						See the demo
					</Button>
				</div>
				<div class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
					<div class="flex items-center gap-2">
						<span class="dot"></span>
						Personalized from any source
					</div>
					<div class="flex items-center gap-2">
						<span class="dot"></span>
						Guided 25-min sprints
					</div>
					<div class="flex items-center gap-2">
						<span class="dot"></span>
						Spaced review built in
					</div>
				</div>
			</div>

			<div class="relative">
				<div
					class="rounded-3xl border border-border bg-card/90 p-6 text-card-foreground shadow-[0_28px_80px_rgba(15,15,20,0.18)] backdrop-blur"
				>
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
							Next review
						</p>
						<Badge variant="secondary" class="bg-secondary/70">Today</Badge>
					</div>
					<h3 class="mt-4 text-2xl font-semibold">Modern European History</h3>
					<p class="text-sm text-muted-foreground">12 cards · 25 min · 9:30 PM</p>
					<Separator class="my-4" />
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<span
								class="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
								>Prime</span
							>
							<div>
								<p class="font-medium">Timeline drill</p>
								<p class="text-xs text-muted-foreground">Anchor with 5 key events</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<span
								class="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
								>Recall</span
							>
							<div>
								<p class="font-medium">Open ended prompts</p>
								<p class="text-xs text-muted-foreground">Explain causes + effects</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<span
								class="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
								>Reflect</span
							>
							<div>
								<p class="font-medium">Quick confidence check</p>
								<p class="text-xs text-muted-foreground">Save a 2-line summary</p>
							</div>
						</div>
					</div>
				</div>

				<div
					class="absolute right-0 bottom-6 w-[190px] rounded-2xl border border-border bg-card/80 p-4 text-card-foreground shadow-[0_18px_40px_rgba(15,15,20,0.18)] backdrop-blur"
				>
					<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weekly</p>
					<h4 class="mt-2 text-lg font-semibold">Memory map</h4>
					<p class="text-xs text-muted-foreground">See all your anchors</p>
				</div>
				<div
					class="absolute left-0 bottom-6 w-[190px] rounded-2xl border border-border bg-card/80 p-4 text-card-foreground shadow-[0_18px_40px_rgba(15,15,20,0.18)] backdrop-blur"
				>
					<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Streak</p>
					<h4 class="mt-2 text-lg font-semibold">7-day rhythm</h4>
					<p class="text-xs text-muted-foreground">Consistency wins</p>
				</div>
			</div>
		</div>
	</section>

	<section id="flow" class="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
		<div class="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
			<div class="space-y-4">
				<p class="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">The flow</p>
				<h2 class="font-display text-3xl sm:text-4xl">A ritualized learning loop.</h2>
				<p class="text-muted-foreground">
					Each session moves from framing to recall to reflection. The pace is intentional, the prompts
					are precise, and your progress is visible.
				</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-border bg-card/80 p-5 text-card-foreground shadow-[0_14px_30px_rgba(15,15,20,0.12)]"
				>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">01</p>
					<h3 class="text-xl font-semibold">Capture</h3>
					<p class="text-sm text-muted-foreground">
						Drop PDFs, lectures, or notes. We carve them into concepts, anchors, and prompts.
					</p>
				</div>
				<div
					class="rounded-2xl border border-border bg-card/80 p-5 text-card-foreground shadow-[0_14px_30px_rgba(15,15,20,0.12)]"
				>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">02</p>
					<h3 class="text-xl font-semibold">Plan</h3>
					<p class="text-sm text-muted-foreground">
						AI builds a schedule that respects your workload and spacing intervals.
					</p>
				</div>
				<div
					class="rounded-2xl border border-border bg-card/80 p-5 text-card-foreground shadow-[0_14px_30px_rgba(15,15,20,0.12)]"
				>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">03</p>
					<h3 class="text-xl font-semibold">Recall</h3>
					<p class="text-sm text-muted-foreground">
						Do one focused sprint with prompts tailored to how you retain information.
					</p>
				</div>
				<div
					class="rounded-2xl border border-border bg-card/80 p-5 text-card-foreground shadow-[0_14px_30px_rgba(15,15,20,0.12)]"
				>
					<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">04</p>
					<h3 class="text-xl font-semibold">Reflect</h3>
					<p class="text-sm text-muted-foreground">
						Save a quick summary and confidence score to guide the next review.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section id="kit" class="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
		<div
			class="grid gap-6 rounded-3xl border border-border bg-card/90 p-8 text-card-foreground shadow-[0_24px_60px_rgba(15,15,20,0.14)]"
		>
			<div class="space-y-3">
				<p class="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Study kit</p>
				<h2 class="font-display text-3xl sm:text-4xl">Everything in one quiet cockpit.</h2>
				<p class="text-muted-foreground">
					Build projects, generate flashcards, and ship your notes straight into practice sessions.
				</p>
			</div>
			<div class="grid gap-4 md:grid-cols-3">
				<div
					class="rounded-2xl border border-border bg-background/40 p-5 text-card-foreground shadow-[0_12px_30px_rgba(15,15,20,0.12)]"
				>
					<h3 class="text-xl font-semibold">Study Plans</h3>
					<p class="text-sm text-muted-foreground">Weekly rhythms with built-in spacing.</p>
					<Badge variant="secondary" class="mt-4">Adaptive</Badge>
				</div>
				<div
					class="rounded-2xl border border-border bg-background/40 p-5 text-card-foreground shadow-[0_12px_30px_rgba(15,15,20,0.12)]"
				>
					<h3 class="text-xl font-semibold">Flashcards</h3>
					<p class="text-sm text-muted-foreground">AI-crafted, edited, and linked to sources.</p>
					<Badge variant="secondary" class="mt-4">Source-aware</Badge>
				</div>
				<div
					class="rounded-2xl border border-border bg-background/40 p-5 text-card-foreground shadow-[0_12px_30px_rgba(15,15,20,0.12)]"
				>
					<h3 class="text-xl font-semibold">Study Chat</h3>
					<p class="text-sm text-muted-foreground">Ask for explanations without losing context.</p>
					<Badge variant="secondary" class="mt-4">Memory safe</Badge>
				</div>
			</div>
		</div>
	</section>

	<section class="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
		<div class="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
			<div
				class="rounded-3xl border border-border bg-card/85 p-7 text-card-foreground shadow-[0_20px_50px_rgba(15,15,20,0.16)]"
			>
				<p class="text-xs uppercase tracking-[0.3em] text-muted-foreground">Story</p>
				<p class="mt-4 font-display text-2xl">
					“AI Study is the first tool that actually helped me *retain* material. The rhythm and
					prompts are exactly what I needed.”
				</p>
				<div class="mt-6 flex items-center gap-4">
					<div class="h-12 w-12 rounded-full bg-primary/30"></div>
					<div>
						<p class="font-medium">Imani Hart</p>
						<p class="text-xs text-muted-foreground">Neuroscience grad student</p>
					</div>
				</div>
			</div>
			<div class="space-y-6">
				<div class="flex items-baseline gap-4">
					<p class="font-display text-4xl">2.3x</p>
					<p class="text-sm text-muted-foreground">Recall performance after 3 weeks.</p>
				</div>
				<Separator />
				<div class="flex items-baseline gap-4">
					<p class="font-display text-4xl">18 hrs</p>
					<p class="text-sm text-muted-foreground">Saved per midterm cycle.</p>
				</div>
				<Separator />
				<div class="flex items-baseline gap-4">
					<p class="font-display text-4xl">94%</p>
					<p class="text-sm text-muted-foreground">Would recommend to a classmate.</p>
				</div>
			</div>
		</div>
	</section>

	<section id="pricing" class="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6">
		<div
			class="grid gap-6 rounded-3xl border border-border bg-card/90 p-8 text-card-foreground shadow-[0_24px_60px_rgba(15,15,20,0.16)]"
		>
			<div class="space-y-3">
				<p class="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Pricing</p>
				<h2 class="font-display text-3xl sm:text-4xl">Start free, stay focused.</h2>
				<p class="text-muted-foreground">
					Upgrade when you are ready to scale your study pipeline.
				</p>
			</div>
			<div class="grid gap-6 md:grid-cols-2">
				<div
					class="rounded-2xl border border-border bg-background/40 p-6 text-card-foreground shadow-[0_18px_40px_rgba(15,15,20,0.12)]"
				>
					<h3 class="text-xl font-semibold">Starter</h3>
					<p class="mt-2 text-3xl font-semibold">$0</p>
					<p class="text-sm text-muted-foreground">Perfect for a single course.</p>
					<ul class="mt-6 space-y-2 text-sm text-muted-foreground">
						<li>1 project, 3 sources</li>
						<li>25 flashcards per week</li>
						<li>Guided review sessions</li>
					</ul>
					<Button class="mt-6 w-full">Get started</Button>
				</div>
				<div
					class="rounded-2xl border border-primary/40 bg-primary/10 p-6 text-card-foreground shadow-[0_26px_60px_rgba(240,183,74,0.24)]"
				>
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold">Scholar</h3>
						<Badge>Most popular</Badge>
					</div>
					<p class="mt-2 text-3xl font-semibold">$12</p>
					<p class="text-sm text-muted-foreground">For serious multi-course work.</p>
					<ul class="mt-6 space-y-2 text-sm text-muted-foreground">
						<li>Unlimited projects</li>
						<li>Adaptive planning</li>
						<li>Priority AI sessions</li>
						<li>Team sharing</li>
					</ul>
					<Button class="mt-6 w-full">Start 7-day trial</Button>
				</div>
			</div>
		</div>
	</section>

	<section id="faq" class="relative z-10 mx-auto mt-16 w-full max-w-5xl px-6">
		<div class="space-y-4 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">FAQ</p>
			<h2 class="font-display text-3xl sm:text-4xl">Quick answers for busy brains.</h2>
			<p class="text-muted-foreground">Everything you need to know before you dive in.</p>
		</div>
		<Accordion type="single" collapsible class="mt-8">
			<AccordionItem value="item-1">
				<AccordionTrigger>What files can I upload?</AccordionTrigger>
				<AccordionContent>
					PDFs, docs, slides, and links. We preserve the citations and let you trace every card to its
					source.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Do I have to follow the schedule?</AccordionTrigger>
				<AccordionContent>
					No. You can edit sessions, skip, or move them. The plan adapts as you go.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>Is this safe for sensitive research?</AccordionTrigger>
				<AccordionContent>
					Your data stays in your workspace. We never train on your files, and you can delete sources
					anytime.
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	</section>

	<section class="relative z-10 mx-auto mt-16 w-full max-w-6xl px-6 pb-20">
		<div
			class="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card/90 p-8 text-center text-card-foreground shadow-[0_24px_60px_rgba(15,15,20,0.14)] sm:flex-row sm:justify-between sm:text-left"
		>
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Ready?</p>
				<h2 class="mt-3 font-display text-3xl sm:text-4xl">Launch your next study season.</h2>
				<p class="mt-3 text-muted-foreground">
					Join the weekly memory lab and get early feature drops.
				</p>
			</div>
			<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
				<Input type="email" placeholder="you@campus.edu" class="h-12 flex-1" />
				<Button size="lg" class="h-12 rounded-full px-6">Join the list</Button>
			</div>
		</div>
	</section>
</main>

<style>
	.font-display {
		font-family: var(--font-cooper), 'Times New Roman', serif;
	}

	.hero-orbit {
		position: absolute;
		top: -20%;
		left: 55%;
		width: 70rem;
		height: 70rem;
		background: radial-gradient(circle at center, rgba(240, 183, 74, 0.22), transparent 62%);
		filter: blur(0px);
		opacity: 0.8;
		pointer-events: none;
	}

	.hero-grain {
		position: absolute;
		inset: 0;
		background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" stitchTiles="stitch"/></filter><rect width="120" height="120" filter="url(%23n)" opacity="0.06"/></svg>');
		opacity: 0.4;
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	.dot {
		height: 8px;
		width: 8px;
		border-radius: 999px;
		background: rgba(240, 183, 74, 0.9);
		box-shadow: 0 0 0 4px rgba(240, 183, 74, 0.12);
		display: inline-block;
	}
</style>
