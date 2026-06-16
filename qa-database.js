/**
 * qa-database.js — Zarix Coaching AI Knowledge Base
 * Categories: Sport, Gym, Lifestyle, Boxing, Bodybuilder, Calisthenics, Nutrition
 * Each entry: { id, category, question, answer, answerShort, answerPro, answerMax, tags }
 * - answerShort  → Free tier response (brief)
 * - answer       → Plus tier response (standard)
 * - answerPro    → Pro tier response (detailed with protocol)
 * - answerMax    → Max tier response (elite, fully personalized blueprint)
 */

export const qaDatabase = [

  // ─── SPORT ──────────────────────────────────────────────────────────────────
  {
    id: 1, category: "Sport",
    tags: ["endurance","cardio","running"],
    question: "How do I improve my running endurance?",
    answerShort: "Build mileage gradually — no more than 10% per week — and prioritize consistency over speed.",
    answer: "Improving running endurance requires progressive overload applied slowly. Follow the 10% rule: never increase weekly mileage by more than 10%. Add one long, slow run each week at conversational pace. Cross-train with cycling or swimming to build aerobic capacity without impact stress. Most runners plateau because they run too fast on easy days — keep 80% of your runs truly easy (Zone 2 heart rate).",
    answerPro: "Elite endurance development follows a polarized model: 80% of training at low intensity (Zone 1–2, <75% HRmax), 20% at high intensity (Zone 4–5). Weekly structure: Mon — rest or mobility; Tue — tempo intervals (e.g. 4×8 min at lactate threshold); Wed — easy 40–60 min; Thu — strides and drills; Fri — rest; Sat — long run (+20–30% of weekly volume); Sun — easy recovery run. Fuel with 30–60g carbs/hr on runs over 75 min. Prioritize sleep — 80% of aerobic adaptation happens during deep sleep.",
    answerMax: "ZARIX MAX BLUEPRINT — Running Endurance: Phase 1 (Weeks 1–4): Aerobic base. All runs Zone 2 (130–145 bpm). Volume: 25–35 km/week. Strength work twice weekly (single-leg deadlift, hip thrust, calf raises). Phase 2 (Weeks 5–8): Introduce lactate threshold work. 1× weekly tempo (20 min at 7–8/10 effort). Volume: 35–45 km/week. Phase 3 (Weeks 9–12): Race-specific training. VO2max intervals (5×4 min at 95% HRmax, 3 min rest). Weekly long run 22–28 km. Nutrition: 5–7g carb/kg/day on hard days; 3–4g on recovery days. Hydration: bodyweight (kg) × 35 ml/day minimum. Recovery: foam roll 10 min nightly, contrast showers, magnesium glycinate 400 mg before bed.",
  },
  {
    id: 2, category: "Sport",
    tags: ["flexibility","mobility","sport"],
    question: "Why is flexibility important for athletes?",
    answerShort: "Flexibility reduces injury risk and improves range of motion for better athletic output.",
    answer: "Flexibility allows joints to move through their full range without restriction, reducing the risk of muscle tears and joint injuries. For athletes, this translates to more efficient movement patterns, better power transfer, and faster recovery. Static stretching post-workout and dynamic stretching pre-workout are the two main approaches — each serves a different purpose.",
    answerPro: "Athletic flexibility targets sport-specific ranges of motion. Dynamic warm-up (10 min): leg swings, hip circles, arm crossovers, inchworms. Post-session static: hold each stretch 45–60 seconds, 2–3 sets. Key athlete stretches: hip flexor lunge, pigeon pose, thoracic rotation, hamstring doorframe stretch, lat hang. For explosive sports, prioritize hip mobility and thoracic spine rotation. PNF (proprioceptive neuromuscular facilitation) stretching — contract 6 sec, release, stretch deeper — yields the fastest flexibility gains. Perform 3× weekly.",
    answerMax: "ZARIX MAX BLUEPRINT — Athletic Flexibility: Daily mobility protocol (20 min). Morning: 90/90 hip stretch (2 min each side), thoracic open book (10 reps), cat-cow (15 reps), world's greatest stretch (5 each side). Evening: pigeon pose (90 sec), couch stretch (90 sec), doorframe hamstring (60 sec), shoulder cross-body (60 sec), wrist circles. Weekly: 1× full-body yoga session (Vinyasa or Yin). Sport-specific focus: sprinters → hip flexors and hamstrings; throwers → shoulder capsule and thoracic rotation; combat athletes → hip abductors and cervical spine. Track progress with weekly video of squat depth and shoulder rotation. Expect measurable improvement in 6–8 weeks.",
  },
  {
    id: 3, category: "Sport",
    tags: ["recovery","sleep","sport"],
    question: "How important is sleep for athletic performance?",
    answerShort: "Sleep is when your body repairs and adapts. 7–9 hours per night is essential for athletes.",
    answer: "Sleep is arguably the most important recovery tool available to any athlete. During deep sleep (NREM stages 3–4), the body releases growth hormone, repairs muscle tissue, consolidates motor patterns, and restores glycogen. Chronic sleep restriction below 7 hours decreases reaction time, strength output, and endurance by up to 20%. Even one poor night before competition measurably impairs performance.",
    answerPro: "Optimize sleep for athletic recovery: Target 8–9 hours in bed. Keep room temperature at 16–18°C (cooler = deeper sleep). Eliminate blue light 90 minutes before bed. Use blackout curtains. Eat last meal 2–3 hours before sleep. Supplement protocol: magnesium glycinate (400 mg), ashwagandha (600 mg), tart cherry juice (30 ml) — all taken 60 min before bed. Use a consistent wake time, even on weekends. Track with Oura Ring or Whoop for HRV and sleep stage data.",
    answerMax: "ZARIX MAX BLUEPRINT — Sleep Optimization: Circadian anchoring: wake at the same time daily (6–7 AM for most athletes). Morning light exposure within 30 minutes of waking (10 min outside, no sunglasses) sets the circadian clock. Pre-sleep ritual: hot shower (core body temp drop triggers sleepiness), journaling 5 min, breathing — 4-7-8 technique (4 inhale, 7 hold, 8 exhale) × 4 cycles. Nutrition timing: casein protein (40g) 60 min before bed slows muscle breakdown. During sleep: body creates 70% of daily testosterone. Track: after 2 weeks of optimized sleep, expect HRV to rise 10–15%, sprint times to improve 3–5%, and subjective wellbeing to improve significantly.",
  },
  {
    id: 4, category: "Sport",
    tags: ["speed","sprint","explosiveness"],
    question: "How can I increase my sprint speed?",
    answerShort: "Sprint speed improves through strength training, technique drills, and resisted sprints.",
    answer: "Sprint speed depends on stride length and stride frequency. To increase both: (1) strengthen posterior chain (glutes, hamstrings) for more powerful push-off; (2) improve hip flexor strength for faster leg recovery; (3) practice acceleration mechanics — forward lean at 45°, powerful arm drive, high knees; (4) use resisted sprints (sled pushes) to build power, and assisted sprints (bands or slight downhill) to overspeed and teach faster turnover.",
    answerPro: "8-week sprint speed program: Weeks 1–2: Acceleration mechanics. 4× per week. A-skips, B-skips, wall drives (10 sec), 10m acceleration sprints × 8. Weeks 3–4: Add resisted sprints. 10% bodyweight sled × 5 × 20m, full recovery. Weeks 5–6: Max velocity. Flying 20m sprints (30m build, 20m max, 30m decelerate) × 6. Weeks 7–8: Speed-strength. Depth jumps into sprint × 6, bounding × 4 × 30m. Strength support: Trap bar deadlift, Nordic hamstring curls, hip thrusts, single-leg box jumps.",
    answerMax: "ZARIX MAX BLUEPRINT — Sprint Speed: Biomechanics audit first — record yourself from the side and behind at max speed. Common faults: overstriding (foot lands ahead of center of mass), insufficient hip extension, arm crossing midline. Phase 1 (Weeks 1–3): Strength foundation. Trap bar deadlift 3×5 (85% 1RM), hip thrust 3×8, Nordic curl 3×6. Phase 2 (Weeks 4–6): Reactive strength. Depth drops, ankle stiffness drills, pogo jumps. Phase 3 (Weeks 7–10): Sprint integration. 3× per week: 6×30m with 5 min full rest. Track times with laser gate or phone app. Expected improvement: 3–8% in 10-week cycle. Nutrition: creatine monohydrate 5g/day supports phosphocreatine system (first 10 seconds of sprint).",
  },

  // ─── GYM ────────────────────────────────────────────────────────────────────
  {
    id: 5, category: "Gym",
    tags: ["hypertrophy","muscle","training"],
    question: "What is the best rep range for muscle hypertrophy?",
    answerShort: "6–20 reps per set all build muscle equally when taken close to failure.",
    answer: "Modern research shows hypertrophy occurs across a wide rep range — roughly 5 to 30 reps — as long as sets are taken within 1–3 reps of muscular failure. Lower reps (5–8) emphasize mechanical tension; higher reps (12–20) emphasize metabolic stress. Both stimulate muscle growth. Most programs use 8–15 reps as a practical sweet spot, balancing muscle stimulus with joint-friendly loads.",
    answerPro: "Optimal hypertrophy programming: 10–20 sets per muscle group per week, split across 2–4 sessions. Rep ranges: 60–85% of 1RM (6–15 reps) for compound lifts; 40–60% of 1RM (15–25 reps) for isolation work. Progressive overload: add reps, then weight, then sets over time. RIR (reps in reserve): aim for 0–2 RIR on the last set. Weekly volume landmarks (minimum effective: ~10 sets; maximum adaptive: ~20–25 sets per muscle). Rest periods: 2–4 min for compounds, 60–90 sec for isolation.",
    answerMax: "ZARIX MAX BLUEPRINT — Hypertrophy: Periodize over 16 weeks. Block 1 (Weeks 1–4): Accumulation — 12–20 reps, 3–4 sets, 65–75% 1RM, focus on mind-muscle connection and form. Block 2 (Weeks 5–8): Intensification — 6–10 reps, 4–5 sets, 75–85% 1RM, compound emphasis. Block 3 (Weeks 9–12): Specialization — bring up lagging muscle groups with 20–30 sets/week at varied rep ranges. Block 4 (Weeks 13–16): Deload and re-test 1RMs. Protein: 1.6–2.2g/kg/day. Creatine: 5g/day. Sleep: 8h minimum. Track measurements every 2 weeks (chest, arms, waist, quads).",
  },
  {
    id: 6, category: "Gym",
    tags: ["strength","powerlifting","compound"],
    question: "How do I build raw strength quickly?",
    answerShort: "Focus on progressive overload with the big compound lifts: squat, bench, deadlift, and overhead press.",
    answer: "Raw strength is built through consistent progressive overload on compound movements. The squat, bench press, deadlift, and overhead press train the most muscle mass and allow the heaviest loading. Train each movement 2–3× per week. Add weight incrementally (2.5–5 kg per session for beginners, weekly for intermediate). Keep rep ranges in the 3–6 range with 3–5 min rest between sets for neural adaptation.",
    answerPro: "Linear progression models (Starting Strength, StrongLifts) work for 3–6 months. After that, switch to weekly progression (Texas Method, 531). Key principles: (1) Specificity — practice the competition lifts most; (2) Intensity — regularly lift above 85% 1RM; (3) Frequency — squat, bench, deadlift 2×/week minimum; (4) Technique — a technically sound lift is a stronger lift. Accessory work targets weak points: pause squats for depth, pin press for sticking points, Romanian deadlift for hamstring drive. Monthly 1RM tests to gauge progress.",
    answerMax: "ZARIX MAX BLUEPRINT — Strength Development: 12-week powerbuilding block. Week 1–4: Accumulation. Squat 4×6 @ 75%, Bench 4×6, Deadlift 3×5. Week 5–8: Intensification. Squat 5×3 @ 85%, Bench 5×3, Deadlift 4×3. Week 9–11: Peaking. Squat 6×2 @ 90–92.5%, singles at 95%. Week 12: Deload + max testing. Accessory programming targets weak points identified in video review. Nutrition: caloric surplus of 200–300 kcal/day. 2g protein/kg. Creatine 5g/day. Expected strength gains: 5–15% on each lift over 12 weeks depending on training age.",
  },
  {
    id: 7, category: "Gym",
    tags: ["program","split","schedule"],
    question: "What gym split should I follow as a beginner?",
    answerShort: "A full-body 3-day split (Mon/Wed/Fri) is ideal for beginners for maximum frequency and recovery.",
    answer: "Beginners grow fastest with high-frequency full-body training. A 3-day full-body split hits each muscle group 3× per week, which is more effective than a bro-split (one muscle per day) because beginners have less volume tolerance per session and recover faster. Recommended: Monday (push + squat focus), Wednesday (pull + hip hinge), Friday (full body). Use compound movements 80% of the time.",
    answerPro: "Beginner full-body program (12 weeks): Day A: Squat 3×5, Bench 3×5, Barbell Row 3×5, Plank 3×30s. Day B: Deadlift 1×5, Overhead Press 3×5, Pull-ups 3×AMRAP, Dumbbell Lunges 2×10. Alternate A/B/A one week, B/A/B next week. Add weight every session (squat/deadlift: 5 kg; upper body: 2.5 kg). After 12 weeks, transition to 4-day upper/lower split. Track every session in a notebook or app.",
    answerMax: "ZARIX MAX BLUEPRINT — Beginner Program: Phase 1 (Weeks 1–4): Movement mastery. Lower weights, focus on form. 3× per week, 45-min sessions. Squat, hinge, push, pull, carry patterns each session. Phase 2 (Weeks 5–8): Load introduction. Add weight each session. Introduce barbell variations. Phase 3 (Weeks 9–12): Volume increase. Add sets, not exercises. Weeks 13+: Graduate to intermediate program (Upper/Lower or PPL). Diet: eat at maintenance for first 4 weeks (learn hunger cues), then 200–300 kcal surplus. Protein: 1.6g/kg minimum. Sleep: non-negotiable 8 hours. Expected results: 5–10 kg muscle gain in first year (newbie gains).",
  },
  {
    id: 8, category: "Gym",
    tags: ["progressive overload","plateau","gains"],
    question: "How do I break through a training plateau?",
    answerShort: "Change one variable: add a set, change rep scheme, switch exercise variation, or deload then push harder.",
    answer: "Plateaus happen when the body adapts to your current stimulus. Solutions: (1) Deload for 1 week (50–60% of normal volume), then return refreshed; (2) Change rep ranges — if you've been doing 8s, try 5s or 15s; (3) Increase frequency — add a third session for lagging muscles; (4) Address weak points with targeted accessories; (5) Audit sleep and nutrition — most plateaus are recovery failures, not programming failures.",
    answerPro: "Plateau diagnosis checklist: Is progressive overload being applied? Are you sleeping 7.5h+? Is protein intake 1.6g+ per kg? Are you actually close to failure? Have you been in a caloric deficit unintentionally? Programmatic fixes: switch to daily undulating periodization (DUP) — heavy day (3–5 reps), moderate day (8–10), light day (15–20) per week for each lift. Add mechanical drop sets, rest-pause sets, or myo-reps to increase intensity. Test 1RM every 8 weeks to confirm progress.",
    answerMax: "ZARIX MAX BLUEPRINT — Plateau Breaking: Step 1: Take 5–7 days complete rest (active recovery only). Step 2: Re-test 1RMs to establish true current max. Step 3: Run a 4-week DUP program. Week 1: 70%×10×4; Week 2: 80%×6×4; Week 3: 87.5%×3×5; Week 4: 92.5%×2×6. Step 4: Analyze video of all lifts for technique inefficiencies. Step 5: Blood work — low testosterone, high cortisol, or low iron are common hidden causes. Address nutrition: minimum 2,500 kcal for men, 1,800 kcal for women (adjust for bodyweight). Timeline: most plateaus resolve within 4–6 weeks of strategic intervention.",
  },

  // ─── LIFESTYLE ──────────────────────────────────────────────────────────────
  {
    id: 9, category: "Lifestyle",
    tags: ["habits","routine","morning"],
    question: "What does an ideal morning routine look like for fitness?",
    answerShort: "Hydrate, move, eat, and set intention — in that order, within 60 minutes of waking.",
    answer: "An optimal fitness-oriented morning routine: (1) Wake at consistent time; (2) Drink 500ml water with electrolytes; (3) 10–15 min mobility or light movement; (4) Protein-rich breakfast (30g protein, complex carbs); (5) Review training plan for the day; (6) Mental priming — journal or visualize workout goals. Avoid phone scrolling for first 30 minutes to keep cortisol from spiking unnecessarily early.",
    answerPro: "Elite athlete morning protocol: 5:30 AM — Wake, no alarm snooze. 5:35 AM — 500ml water + lemon + pinch of sea salt. 5:45 AM — 10 min morning movement (sun salutations or dynamic warm-up). 6:00 AM — Cold shower (3 min) for cortisol optimization and alertness. 6:10 AM — Breakfast: 3 eggs + oats + berries + black coffee. 6:30 AM — Training session (optimal cortisol window for strength). 8:00 AM — Post-workout shake (40g whey + banana). 8:30 AM — Plan day, top 3 priorities. Consistency matters more than perfection — do this 6/7 days.",
    answerMax: "ZARIX MAX BLUEPRINT — Morning Mastery: Biological anchor: set wake time aligned with sunrise (seasonal variation). Light exposure first 10 minutes outside resets circadian rhythm. Hydration: 500ml water + 300mg sodium + 100mg potassium (electrolyte blend). Movement: 12-min dynamic protocol (downward dog, hip circles, thoracic rotation, inchworms, lateral lunges, arm swings). Thermal regulation: alternating hot/cold shower (3 min hot, 30 sec cold × 3 cycles) shown to increase norepinephrine 200–300% — improves focus and mood. Nutrition: 30g protein within 60 min of waking (eggs or Greek yogurt). Cognitive priming: 5-min journaling — yesterday's win, today's target, one thing you're grateful for. 8-week adherence = automatic habit.",
  },
  {
    id: 10, category: "Lifestyle",
    tags: ["stress","cortisol","recovery"],
    question: "How does stress affect my training results?",
    answerShort: "High chronic stress elevates cortisol, which breaks down muscle, stores fat, and prevents recovery.",
    answer: "Training is itself a stressor. When combined with high life stress (work, relationships, poor sleep), total allostatic load exceeds recovery capacity. Chronically elevated cortisol: degrades muscle protein, promotes abdominal fat storage, suppresses testosterone and growth hormone, impairs sleep quality, and reduces training motivation. Managing lifestyle stress is as important as programming for long-term progress.",
    answerPro: "Stress management for athletes: (1) Prioritize 8h sleep — single most impactful cortisol regulator; (2) Meditation 10 min daily — proven to reduce cortisol 15–30%; (3) Reduce training volume during high-stress life periods (not intensity); (4) Adaptogenic supplements: ashwagandha (600mg KSM-66) shown in RCTs to reduce cortisol by 28%; (5) Social connection — positive social interactions reduce cortisol acutely; (6) HRV tracking — low HRV = high physiological stress, reduce load that day. Build deload weeks into program every 4–6 weeks as planned stress reduction.",
    answerMax: "ZARIX MAX BLUEPRINT — Stress and Performance: Physiological: track resting HRV daily (Oura or Apple Watch). Below-baseline HRV → active recovery day only. Psychological: implement stress-inoculation training — deliberately undertake controlled discomfort (cold exposure, breath holds, hard intervals) to build stress tolerance. Weekly: Sunday review — rate stress 1–10, plan training volume accordingly (stress 8–10 → reduce volume 40%). Monthly: progressive muscle relaxation protocol (20 min, guided). Hormone panel every 6 months: testosterone, cortisol, DHEA-S, thyroid panel. A stressed athlete who trains hard is working against themselves — adaptation happens in recovery, not in the gym.",
  },
  {
    id: 11, category: "Lifestyle",
    tags: ["motivation","mindset","consistency"],
    question: "How do I stay consistent with my fitness goals?",
    answerShort: "Remove decision fatigue: automate your schedule, make the gym the default, not the exception.",
    answer: "Consistency is a system, not willpower. Key strategies: (1) Schedule workouts like appointments — non-negotiable in your calendar; (2) Lay out gym clothes the night before; (3) Find an accountability partner or coach; (4) Track your streak — don't break the chain; (5) Start with a minimum viable workout — even 10 minutes is better than zero; (6) Connect training to a deeper identity: 'I am someone who trains', not 'I'm trying to get fit.'",
    answerPro: "Behavioral science for fitness consistency: Implementation intentions ('I will train at 7 AM on Mon/Wed/Fri at this specific gym') increase follow-through by 2–3×. Habit stacking: attach workout to an existing habit (after morning coffee → gym bag to car). Environment design: remove friction (gym bag packed, route to gym saved, pre-workout ready). Reward immediately post-workout with something enjoyable (specific podcast only listened to during training). Track minimum 3 data points per session (weight, reps, feeling) to create accountability loop.",
    answerMax: "ZARIX MAX BLUEPRINT — Consistency Engineering: Identity shift first. Write: 'I am an athlete who trains consistently because...' — fill with your genuine reasons. Review daily. Environmental design: keep gym equipment visible at home, keep healthy food at eye level in fridge, schedule training in Google Calendar with alarm. Minimum viable dose: on low-motivation days, commit to only 10 minutes — you will almost always continue. Track: each week in an app or journal. Celebrate 1 month, 3 months, 6 months milestones with a non-food reward (new gear, experience). Find your 'why' at 5 levels deep: keep asking 'why does that matter?' until you reach something emotionally resonant. That's your true anchor.",
  },

  // ─── BOXING ─────────────────────────────────────────────────────────────────
  {
    id: 12, category: "Boxing",
    tags: ["footwork","stance","basics"],
    question: "How do I improve my boxing footwork?",
    answerShort: "Practice lateral shuffle, pivot drills, and stay on the balls of your feet at all times.",
    answer: "Good footwork starts with stance: orthodox (left foot forward) or southpaw (right foot forward), feet shoulder-width apart, weight balanced on balls of feet (never flat-footed). Key movements: step-drag (lead foot steps, rear follows same distance), lateral shuffle (never cross feet), pivot (off lead foot to change angle). Jump rope is the foundation of boxing footwork — 15 minutes daily builds rhythm and coordination. Shadow box focusing only on feet, not punches.",
    answerPro: "12-week footwork program: Weeks 1–4: Jump rope 15 min daily. Practice 4-direction shuffle (forward, back, left, right) without crossing feet. Mirror drill — follow partner's movement. Weeks 5–8: Cone agility drills. L-drill, star pattern, random reaction drills. Add pivot on lead foot to open angles. Weeks 9–12: Sparring footwork — practice entering, exiting, circling. Film from above to see foot placement. Key drill: the 'slip and pivot' — slip jab, pivot 45°, throw counter. Rope work: 3-min rounds, rest 1 min, 6 rounds.",
    answerMax: "ZARIX MAX BLUEPRINT — Boxing Footwork Mastery: Foundation drills (daily, 20 min): Jump rope — Week 1–2: basic bounce; Week 3–4: alternating feet; Week 5–6: double-unders; Week 7+: cross-overs. Floor ladder work: Ali Shuffle, in-in-out-out, lateral icky shuffle — 3 rounds through ladder. Shadowboxing (eyes closed 1 min): forces proprioception. Specific drills: catch-and-release — enter range, throw combo, exit on angle, never straight back. In-gym: stick-and-move rounds where you score only for footwork quality, not punches. Biomechanics: weight should be 55% front foot (mobile) vs 45% rear (loaded for rear power). Champion-level footwork takes 6–18 months of deliberate focus.",
  },
  {
    id: 13, category: "Boxing",
    tags: ["power","punching","technique"],
    question: "How do I increase punching power?",
    answerShort: "Power comes from legs and hip rotation, not just arms. Fix your kinetic chain first.",
    answer: "Punching power originates from the ground up: foot drive → knee bend → hip rotation → shoulder turn → arm extension. Most beginners punch with arms only (30–40% of possible power). Drills to build power: wall punching (feel the ground connection), medicine ball rotational throws, resistance band punching. In the gym: focus on a complete hip snap on every punch, especially the cross and hook.",
    answerPro: "Power development program: Strength: trap bar deadlift, landmine rotation (most sport-specific), med ball chest pass, cable rotation. All loaded rotation movements translate directly. Plyometrics: rotational med ball throw against wall, side-to-side broad jumps. Punching drills: 3-punch power combos with 30 sec rest × 10 rounds on heavy bag. Focus on maximum force on each individual punch. Speed-strength: 'snap and relax' — punch fast and pull back immediately. Tense at impact only. Heavy bag work: vary between fast light (speed) and slow heavy (power) punches.",
    answerMax: "ZARIX MAX BLUEPRINT — Punching Power: Science: punching force is mass × acceleration × leverage. Address all three. Mass: build upper body mass (chest, shoulders, back) and core thickness. Acceleration: explosive training — sled pushes, med ball throws, shock method plyometrics. Leverage: perfect technique (hip rotation, shoulder turning through). 12-week power block: Weeks 1–4: Rotational strength. Landmine rotation 4×8 each side, cable woodchop 3×10. Weeks 5–8: Power transfer. Med ball scoop throw 5×3 (max intent), rotational jump 4×5. Weeks 9–12: Heavy bag power rounds. 3 min power rounds, 2 min rest. Every punch with maximum intent. Test: measure speed with punch tracker app and heavy bag force gauge. Expected: 15–25% power increase in 12 weeks with technical improvements.",
  },
  {
    id: 14, category: "Boxing",
    tags: ["conditioning","fitness","boxing"],
    question: "What conditioning do boxers do outside the ring?",
    answerShort: "Roadwork (running), jump rope, circuits, and strength training — in that order of priority.",
    answer: "Boxing conditioning outside the ring: (1) Roadwork — 5–8 km morning runs at conversational pace (aerobic base); (2) Jump rope — 15 min daily (coordination, calf strength, rhythm); (3) Circuit training — burpees, bodyweight squats, push-ups, medicine ball slams; (4) Heavy bag rounds (6–12 × 3 min); (5) Strength training 2–3× weekly (posterior chain focus); (6) Sparring — the most sport-specific conditioning possible.",
    answerPro: "Weekly boxing conditioning split (advanced): Mon — Roadwork 6 km + jump rope 15 min + bag work 8 rounds. Tue — Strength (deadlift, rows, push, pull-ups) + core. Wed — Sparring 8 rounds + footwork drills. Thu — Active recovery (yoga, light swim). Fri — Roadwork 8 km + circuit training (5 rounds: 10 burpees, 20 push-ups, 15 pull-ups, 20 squats). Sat — Sparring or technical rounds 10 rounds. Sun — Full rest. Peak week before fight: reduce volume 40%, maintain intensity. Nutrition: carb-heavy on hard days, protein recovery on rest days.",
    answerMax: "ZARIX MAX BLUEPRINT — Boxing Conditioning: Periodized 16-week camp. Phase 1 (Weeks 1–4): Aerobic base. Roadwork 6 days/week, increasing from 5 km to 8 km. Jump rope 20 min daily. No heavy sparring. Phase 2 (Weeks 5–8): Anaerobic development. Introduce HIIT (sprint 30 sec, jog 90 sec × 10). Increase bag rounds 10–12. Sparring begins (4–6 rounds). Phase 3 (Weeks 9–12): Fight simulation. 12-round bag work in fight conditions (shoes, wraps, gloves). High-intensity sparring. Phase 4 (Weeks 13–16): Peak and taper. Week 13–14: max volume/intensity. Week 15: reduce 30%. Week 16 (fight week): light technical work only. Nutrition: 5–7g carb/kg on hard days, 2g protein/kg throughout.",
  },

  // ─── BODYBUILDER ────────────────────────────────────────────────────────────
  {
    id: 15, category: "Bodybuilder",
    tags: ["bulk","cut","diet"],
    question: "Should I bulk or cut first?",
    answerShort: "If you're over 20% body fat, cut first. Under 15%, start a lean bulk.",
    answer: "The bulk-or-cut decision is based on current body fat percentage and training history. Beginners below 20% body fat: body recomposition (gain muscle and lose fat simultaneously) is achievable without dedicated bulk or cut. Over 20% body fat: cut first to improve insulin sensitivity and hormonal environment for muscle building. Under 12–15% body fat and experienced: lean bulk (200–300 kcal surplus).",
    answerPro: "Tactical decision matrix: Body fat 20%+: cut to 12–15% before bulking. Rate: 0.5–1% body fat loss per week. Body fat 12–20%: recomp or slow bulk (100–200 kcal surplus). Body fat <12%: lean bulk, aim for 0.25–0.5 kg weight gain per month. Bulking: expect 1:1 ratio of muscle to fat in a well-managed surplus. Cutting: protect muscle with high protein (2.2–2.5g/kg), heavy training, and conservative deficit (300–500 kcal below TDEE). Avoid aggressive cuts — lose no more than 1% bodyweight per week.",
    answerMax: "ZARIX MAX BLUEPRINT — Bulk/Cut Strategy: Start with DEXA scan or bod pod to determine exact body fat. Phase decision based on numbers. If cutting: set protein at 2.5g/kg, deficit at 400 kcal, train with same intensity (drop volume by 15–20%, not intensity). High protein preserves 95%+ of muscle during cut. If bulking: track weight weekly (aim +0.25–0.5 kg/week for men, +0.1–0.25 for women). Monthly body composition photos. Minimize fat gain during bulk with: training volume high, cardio 2–3× weekly (LISS 30 min), and avoid processed food surplus. 16-week bulk followed by 8-week cut is a classic natural bodybuilder cycle.",
  },
  {
    id: 16, category: "Bodybuilder",
    tags: ["symmetry","posing","aesthetics"],
    question: "How do I develop better muscle symmetry?",
    answerShort: "Identify your weaker side and bring it up with unilateral exercises and extra volume.",
    answer: "Symmetry is developed by identifying imbalances and targeting them. Common issues: left/right arm disparity (use dumbbell work to force each side to work independently), dominant vs non-dominant side in compound lifts, underdeveloped rear delts (over-emphasized chest in most programs), lagging legs vs upper body. Focus: add 20–30% more work to weaker muscles until balance is restored. Always start unilateral exercises with the weaker side.",
    answerPro: "Symmetry protocol: Audit your physique monthly with photos from front, back, left side, right side. Score each muscle group. Imbalance correction: always start with weaker limb in unilateral work. Never let dominant side 'help' — pause between sides. Common imbalances and fixes: small calves → 5 sets calves daily (standing + seated); lagging rear delts → face pulls 3×20 daily, rear delt fly; underdeveloped back width → straight-arm pulldowns, single-arm rows; poor quad sweep → leg press with narrow foot position, leg extensions. Posing practice: weekly posing practice improves mind-muscle connection and presentation.",
    answerMax: "ZARIX MAX BLUEPRINT — Symmetry Development: Phase 1: Professional photographic assessment. Take 8-angle photos in good lighting. Compare to golden-ratio ideal (waist 70% of chest, shoulders 1.6× waist). Identify top 3 weak points. Phase 2: Specialization block (4 weeks per weak point). Add 2 dedicated sessions per week for lagging muscle. 20–25 sets per week for the targeted muscle vs standard maintenance for others. Phase 3: Mind-muscle connection training — use lighter weights, 3-sec eccentric, squeeze at top for 2 sec on all isolation exercises for lagging parts. Monthly: re-evaluate photos. Posing: learn mandatory bodybuilding poses (front double bicep, side chest, back double bicep, etc.) — posing 15 min daily can visually improve appearance significantly.",
  },
  {
    id: 17, category: "Bodybuilder",
    tags: ["steroids","natural","enhancement"],
    question: "What should I know about staying natural in bodybuilding?",
    answerShort: "Natural bodybuilding requires precision with nutrition, sleep, and programming — your ceiling is high if you're consistent.",
    answer: "Natural bodybuilders operate within the limits of their endogenous hormone levels (primarily testosterone, IGF-1, and growth hormone). Key principles: (1) Protein is critical — 1.6–2.2g/kg/day is the evidence-based range; (2) Sleep is your main anabolic hormone trigger (GH release during deep sleep); (3) Training age matters — expect 10–15 kg muscle in year 1, 5–7 kg in year 2, 2–3 kg in years 3+; (4) Genetic ceiling exists — maximizing it takes 5–10 years of consistent training.",
    answerPro: "Natural optimization stack (legal, evidence-based): Creatine monohydrate 5g/day (most researched supplement, +5–10% strength and size). Caffeine 3–6mg/kg pre-workout. Beta-alanine 3.2g/day (reduces fatigue at 8–15 rep range). Vitamin D3 3000–5000 IU/day (optimizes testosterone if deficient). Zinc 15mg (testosterone cofactor). Omega-3 2–4g/day (reduces inflammation, improves protein synthesis). Ashwagandha KSM-66 600mg (reduces cortisol, shown to increase testosterone in deficient males). Sleep, nutrition, programming > any supplement.",
    answerMax: "ZARIX MAX BLUEPRINT — Natural Bodybuilding Mastery: Blood panel every 6 months: testosterone (total + free), SHBG, estradiol, IGF-1, cortisol, thyroid (TSH, T3, T4), complete metabolic panel. Optimize baseline health before maximizing training. Training: maximum natural stimulus without exceeding recovery capacity. Deload every 4–6 weeks. Lifestyle: alcohol reduces testosterone 23% for 24 hours — minimize. Sleep: every hour under 8 reduces GH release. Minimize chronic stress. Diet: nutrient-dense whole foods, 10+ different vegetables weekly for micronutrient diversity. Competition prep: peak condition achievable 2× per year naturally (lean bulk 8 months, cut 4 months cycle). Natural bodybuilders peak later (30–35) than enhanced athletes.",
  },

  // ─── CALISTHENICS ───────────────────────────────────────────────────────────
  {
    id: 18, category: "Calisthenics",
    tags: ["beginner","basics","calisthenics"],
    question: "Where should a complete beginner start with calisthenics?",
    answerShort: "Master the foundational 6: push-up, pull-up, squat, hinge, dip, and plank.",
    answer: "Calisthenics progression: begin with push-ups (start on knees if needed), bodyweight squats, jumping jacks for conditioning, and a dead hang from a bar. Once you can do 3×10 push-ups and hold a dead hang for 30 seconds, introduce pull-up negatives. After achieving 5 full pull-ups and 15 solid push-ups, advance to dips, pike push-ups, and Australian rows. The foundation must be rock solid before advancing to skill work.",
    answerPro: "Beginner calisthenics program (3 days/week): Day A: Push-ups 4×10, Australian rows 4×10, Squat 3×15, Plank 3×30s, Pike push-up 3×8. Day B: Negative pull-ups 3×5, Dips 3×8, Romanian deadlift with bodyweight 3×12, L-sit hold 3×10s. Progression: when you hit top of rep range with good form, advance to harder variation. Weeks 1–4: build to 3×10 push-ups and 3×5 negative pull-ups. Weeks 5–8: first full pull-ups. Weeks 9–12: dips and pike push-ups. Never skip skill practice (handstand kick-ups, L-sit) — even 5 min daily compounds fast.",
    answerMax: "ZARIX MAX BLUEPRINT — Calisthenics Foundation: 12-week skill-based program. Week 1–2: Assessment and baseline. Test: max push-ups, pull-ups, squat hold 2 min, plank. Document on video. Week 3–6: Volume phase. 4 days/week. Push: push-ups progression (incline → flat → decline → archer). Pull: dead hang → scapular pulls → negatives → full pull-ups. Core: plank → hollow body → L-sit progression. Legs: squat → Bulgarian split squat → pistol squat progression. Week 7–10: Skill introduction. Begin frog stand (2 min daily), handstand wall kick-up, tuck front lever attempts. Week 11–12: Test and plan. Retest baseline, identify weaknesses, plan next 12-week block. Milestone targets: 20 push-ups, 10 pull-ups, 30-sec L-sit by week 12.",
  },
  {
    id: 19, category: "Calisthenics",
    tags: ["muscle-up","advanced","skill"],
    question: "How do I train for my first muscle-up?",
    answerShort: "You need strict pull-ups above bar level and a strong dip — then practice the transition.",
    answer: "The muscle-up is a pull-up that transitions into a dip above the bar. Prerequisites: 10 strict pull-ups, 10 ring or bar dips, and the ability to pull your chest to the bar (not just chin). The transition (from pull to push) is the hardest part. Practice: explosive pull-ups (aim for hips to bar), chest-to-bar pull-ups, muscle-up negatives (jump to top position, lower slowly), and band-assisted muscle-ups.",
    answerPro: "Muscle-up program (8 weeks): Prerequisites check: 10 pull-ups, 10 dips, chest-to-bar pull-ups. Week 1–2: Explosive pull-ups with hollow body kip. 5×5, full rest. Week 3–4: High pull-ups (pull until hips touch bar). 5×3–5 reps. Week 5–6: Muscle-up negatives (jump into top position, lower through transition, slow negative). Week 7: Band-assisted muscle-ups with minimum assistance. Week 8: Attempt unassisted. Common mistakes: not leaning forward early enough in transition, losing hollow body, not pressing completely out at top. Grip: false grip on rings (thumb same side as fingers) is essential for ring muscle-ups.",
    answerMax: "ZARIX MAX BLUEPRINT — Muscle-Up Mastery: Phase 1 (Weeks 1–3): Prerequisite strengthening. Explosive pull-ups 4×5 (maximum height), weighted pull-ups +5 kg × 5×5, straight-bar dips 4×10. Phase 2 (Weeks 4–6): Transition training. Chest-to-bar daily 3×max, jumping muscle-ups 3×3 (jump, control top, lower slow), waist-height bar transitions (practice the turn-over from horizontal). Phase 3 (Weeks 7–8): Integration. Band-assisted first, then unassisted attempts with 5 min rest between. Film every attempt — the turn-over point is where most people fail. Cue: 'pull elbows down and back, then push forward over the bar.' Once you have 1, practice 3×1 per session and progress to kipping, then strict clean muscle-ups.",
  },
  {
    id: 20, category: "Calisthenics",
    tags: ["handstand","balance","skill"],
    question: "How long does it take to learn a freestanding handstand?",
    answerShort: "Typically 6–18 months of consistent daily practice of 10–15 minutes.",
    answer: "A freestanding handstand requires: wrist strength and flexibility, shoulder stability, scapular protraction strength, core compression, and balance skill. Progress milestones: wall handstand → chest-to-wall → freestanding kick-up attempts → 3-second balance → 10-second hold. Most people who practice 10 minutes daily achieve a 5-second freestanding handstand within 6–12 months. The balance is a neurological skill, not a strength feat — daily practice is essential.",
    answerPro: "Handstand training protocol: Daily 15-minute practice session. Phase 1 (Months 1–2): Wrist prep (circles, 4-direction stretch, wrist push-ups), wall handstand hold 3×30s, pike compression (seated pike, hollow body). Phase 2 (Months 3–4): Chest-to-wall handstand 3×30s (this forces correct alignment), wall walks, pike handstand push-ups. Phase 3 (Months 5–6): Kick-up practice against wall, then away from wall. Frog stand (tuck planche) develops wrist strength and spatial awareness. Phase 4 (Months 7+): Balance attempts, kicking up to 5-sec hold attempts daily. Alignment cues: straight line from wrists to ankles, ribs tucked, glutes squeezed, fingers spread.",
    answerMax: "ZARIX MAX BLUEPRINT — Handstand Mastery: Frequency: daily, 15–20 minutes, no exceptions. Structure: 5 min wrist warm-up, 10 min skill practice, 5 min cool-down. Month 1–2: Box drill (feet on box, hips over shoulders), learn straight-body position. Month 3–4: Wall-facing handstand, note shoulder alignment. Month 5–6: Kick-up to wall + pirouette bail (safe exit technique). Month 7–12: Freestanding attempts with spotter, then solo. Daily progression: QUALITY over quantity — 10 perfect wall handstands > 50 crooked ones. Photographer tip: record yourself weekly from the side — alignment issues are invisible from first-person view. Mental: handstand balance is 60% fear management in early stages. Yoga blocks and crash mats remove fear, accelerate progress.",
  },

  // ─── NUTRITION ──────────────────────────────────────────────────────────────
  {
    id: 21, category: "Nutrition",
    tags: ["protein","macros","diet"],
    question: "How much protein do I actually need per day?",
    answerShort: "1.6–2.2g per kg of bodyweight covers the vast majority of training goals.",
    answer: "Protein requirements for active individuals: the research consensus is 1.6g/kg/day as the minimum effective dose for muscle building, with diminishing returns above 2.2g/kg/day. For reference: an 80 kg athlete needs 128–176g protein daily. Sources: chicken breast (31g per 100g), eggs (6g each), Greek yogurt (10g per 100g), tuna (30g per 100g), tofu (8g per 100g). Spread protein across 3–4 meals of 30–40g each for optimal muscle protein synthesis throughout the day.",
    answerPro: "Protein optimization: Leucine threshold — each meal needs 2–3g leucine to trigger muscle protein synthesis (3–4 eggs, 30g whey, 150g chicken achieves this). Meal timing: protein before and after training is beneficial but total daily intake matters most. Pre-sleep protein: 40g casein (cottage cheese, casein powder) before bed shown to increase overnight protein synthesis by 22%. Vegetarians and vegans: combine incomplete proteins (rice + beans, pea + rice protein) to hit complete amino acid profile. Plant protein: absorbs at 70–80% efficiency vs 90–95% for whey — adjust upward by 20–25%.",
    answerMax: "ZARIX MAX BLUEPRINT — Protein Optimization: Individualize based on training phase. During cut (caloric deficit): increase protein to 2.5g/kg to preserve muscle. During bulk: 1.8–2.2g/kg is sufficient. During recomp: 2.0–2.2g/kg. Distribution: 4 meals at 35–45g protein each is superior to 2 large protein meals. Protein sources ranked by leucine content: whey (11%), milk (10%), egg (9%), chicken (8%), beef (8%), pea protein (8%). Quality sources: wild salmon provides protein + omega-3 (anti-inflammatory, synergistic for muscle building). Track: use MyFitnessPal for 2 weeks to understand your baseline, then make adjustments. Blood panel: BUN/creatinine ratio indicates protein processing — relevant if kidney health is a concern.",
  },
  {
    id: 22, category: "Nutrition",
    tags: ["carbs","energy","performance"],
    question: "Should I eat carbohydrates if I want to lose fat?",
    answerShort: "Yes — carbs fuel performance. A caloric deficit drives fat loss, not carb restriction alone.",
    answer: "Fat loss is driven by caloric deficit, not carbohydrate elimination. Carbohydrates are the primary fuel for high-intensity training (the glycolytic system). Eliminating carbs reduces training performance, which reduces total work capacity, which reduces total calories burned — counterproductive for athletic goals. A moderate-carb approach (40–50% of calories from carbs) works well for most athletes. Reduce carbs only if you train at low intensity or are in a deep cut phase.",
    answerPro: "Carbohydrate periodization for athletes: Training days — high carb (5–7g/kg). Rest days — lower carb (2–3g/kg). Pre-workout: fast-digesting carbs 30–60 min before training (banana, white rice, sports drink). Post-workout: carbs + protein within 2 hours to replenish glycogen and start recovery. Sources: oats, brown rice, sweet potato, fruits, legumes. Limit processed sugar and refined carbs — blood sugar spikes and crashes reduce energy and training quality. Total carb range for 80 kg athlete on training day: 400–560g.",
    answerMax: "ZARIX MAX BLUEPRINT — Carbohydrate Strategy: Individualize by training phase and intensity. Strength athletes (low cardio): 3–5g/kg sufficient. Endurance athletes (6+ hours/week): 6–10g/kg required. Timing: carbs before training improve performance measurably above threshold (70%+ VO2max). Insulin sensitivity: higher in AM and post-exercise — best times to consume larger carb meals. Gut training: athletes in long events need to train their gut to absorb 90g carbs/hour (mix glucose + fructose 2:1 ratio). Glycemic index: lower GI for baseline eating (oats, legumes); higher GI immediately post-workout (white rice, banana, dextrose). Track energy levels across 2 weeks at different carb intakes to find your optimal range — it's highly individual.",
  },
  {
    id: 23, category: "Nutrition",
    tags: ["supplements","vitamins","essentials"],
    question: "What supplements are actually worth taking?",
    answerShort: "Creatine, protein powder, vitamin D3, omega-3, and caffeine have the strongest evidence.",
    answer: "Evidence-based supplements worth considering: (1) Creatine monohydrate — most researched, increases strength and muscle by 5–15%, 5g/day; (2) Protein powder — fills gaps in dietary protein, not magic; (3) Vitamin D3 — most people are deficient, 2000–5000 IU/day; (4) Omega-3 fish oil — reduces inflammation, aids recovery, 2–4g EPA+DHA daily; (5) Caffeine — proven ergogenic, 3–6mg/kg pre-workout. Everything else has weak or mixed evidence.",
    answerPro: "Supplement stack by goal: Muscle building: Creatine 5g/day, whey protein post-workout, beta-alanine 3.2g/day, vitamin D3 3000 IU, zinc 15mg. Fat loss: caffeine (pre-cardio), protein powder, omega-3. Performance: creatine, caffeine, sodium bicarbonate (6g pre-event for endurance). Recovery: magnesium glycinate 400mg pre-bed, tart cherry juice 30ml, omega-3. Avoid: proprietary blends, 'fat burners', most pre-workout stacks (mostly caffeine + fluff), testosterone boosters (minimal evidence). Supplement industry is poorly regulated — choose third-party tested brands (Informed Sport, NSF Certified).",
    answerMax: "ZARIX MAX BLUEPRINT — Supplement Protocol: Foundation (everyone): Creatine monohydrate 5g/day (no loading needed), vitamin D3 + K2 (3000–5000 IU D3, 100mcg K2), omega-3 3g EPA+DHA, magnesium glycinate 400mg. Athletic performance addition: caffeine 3–6mg/kg (cycle off 2 weeks every 2 months to maintain sensitivity), beta-alanine 3.2g split 2× daily, sodium bicarbonate 0.3g/kg 60 min before high-intensity events. Advanced recovery: tart cherry concentrate (reduces muscle damage markers), collagen + vitamin C 30 min pre-workout (tendon health), phosphatidylserine 400mg (blunts cortisol response to overreaching). Monthly cost optimization: creatine + vitamin D + omega-3 = 90% of benefits for minimal cost.",
  },
  {
    id: 24, category: "Nutrition",
    tags: ["meal-prep","diet","planning"],
    question: "How do I meal prep for a full week of training?",
    answerShort: "Cook 3–4 protein sources and 2–3 carb sources on Sunday — mix and match through the week.",
    answer: "Effective weekly meal prep: cook in bulk on Sunday (2–3 hours covers the whole week). Proteins: bake 2 kg chicken thighs, boil 12–18 eggs, cook 500g ground beef. Carbs: cook large batch of rice (500g dry) and boil sweet potatoes. Vegetables: pre-wash and chop salad greens, roast mixed veg (peppers, broccoli, zucchini). Store in glass containers in fridge (good 4–5 days). The key is having protein and carbs always ready — assembly takes 5 minutes per meal.",
    answerPro: "Advanced meal prep system: Sunday 2-hour session. Equipment: 3 baking trays, large pot, rice cooker or instant pot, multiple glass containers. Proteins (rotate weekly): chicken thighs (season with herbs, bake 200°C, 35 min), salmon fillets (bake with lemon, olive oil, 180°C, 20 min), ground beef (cook with onion, garlic, Mexican or Italian season). Carbs: jasmine rice (2.5:1 water ratio), oat packets portioned (60g each), sweet potato cubed and baked. Sauces batch-cooked separately (less soggy). Label containers with macros. Freeze one batch for week 2 if you prep every 2 weeks.",
    answerMax: "ZARIX MAX BLUEPRINT — Meal Prep Mastery: System design: 2-hour prep = 20 meals. Template: each meal = 1 palm protein (30–40g) + 1–2 fist carbs + 2 fist vegetables + 1 thumb fat. Shopping: buy in bulk (wholesale markets reduce cost 30–40%). Cook: 3 proteins × 1 kg each, 2 carb sources × 1 kg each, 5 vegetable types. Monday–Wednesday: fresh meals from prep. Thursday–Friday: frozen batch (prep two batches, freeze one). Travel days: overnight oats (prep in mason jars, 72-hour fridge life), hard-boiled eggs (portable), protein powder (backup). Track macros for 2 weeks to learn your foods' profiles — then you can estimate without tracking. Budget: quality meal prep costs £5–8/meal vs £12–20 eating out, while being more nutritious.",
  },
  {
    id: 25, category: "Nutrition",
    tags: ["hydration","water","performance"],
    question: "How much water should I drink as an athlete?",
    answerShort: "A minimum of 35ml per kg of bodyweight per day, plus replace sweat losses during training.",
    answer: "Hydration needs depend on bodyweight, training intensity, heat, and sweat rate. Baseline: 35ml/kg/day (70 kg person = 2.45 liters). During training: add 500–750ml per hour of moderate exercise, more in heat. Signs of dehydration: dark urine (aim for pale yellow), thirst (already 1–2% dehydrated by this point), headache, reduced performance. Electrolytes (sodium, potassium, magnesium) are critical — water alone can dilute electrolytes during prolonged exercise.",
    answerPro: "Athletic hydration protocol: Daily: 35–45ml/kg body weight (athletes lean toward 45ml). Color chart: pale straw yellow = optimal. Pre-training: 500ml 2 hours before, 250ml 30 min before. During: 150–250ml every 15–20 minutes. Post-training: for every 0.5 kg bodyweight lost, drink 750ml. For sessions >75 min: electrolyte drink (sodium 500–700mg/L, potassium 150mg/L) — homemade: 500ml water, 1/4 tsp salt, splash lemon juice. Coffee and tea count toward hydration (mild diuresis is offset by water content).",
    answerMax: "ZARIX MAX BLUEPRINT — Hydration Optimization: Morning protocol: 500ml water immediately on waking (rehydrate from overnight). First 2 hours of day: 500ml more. Target 75% of daily water by 3 PM — improves sleep quality (less nightly bathroom trips). Electrolyte timing: sodium in pre-workout meal (not water) improves absorption. Sweat test: weigh before and after 1-hour training session. Weight difference in kg × 1.5 = ml needed for rehydration. High-sweat individuals (lose >1 kg/hour) need sodium supplementation during exercise to prevent hyponatremia. Cold water is absorbed faster than warm. Carbonated water counts fully (despite myth). Monthly check: kidney function markers in blood panel validate long-term hydration habits.",
  },

  // ─── MORE GYM / SUPPLEMENTAL ENTRIES ────────────────────────────────────────
  {
    id: 26, category: "Gym",
    tags: ["warm-up","injury prevention","activation"],
    question: "What should my gym warm-up include?",
    answerShort: "5 min low-intensity cardio, then dynamic stretches and movement-specific activation.",
    answer: "A proper gym warm-up has three phases: (1) General warm-up: 5 min rowing, cycling, or light jogging to raise core temperature; (2) Dynamic mobility: leg swings, arm circles, hip circles, thoracic rotations; (3) Specific warm-up: work up to training weight with progressive sets (e.g. for bench: bar × 15, 40% × 10, 60% × 5, 75% × 3, then working sets). Total time: 10–15 minutes. Cold muscles are less pliable and more injury-prone.",
    answerPro: "Structured warm-up by session type: Lower body session: 5 min row, goblet squat 2×10 (light), hip 90/90 stretch, hip thrust activation, glute bridge 2×15, warm-up sets to working weight. Upper body session: 5 min row, band pull-aparts 2×15, face pulls 2×15, scapular push-ups 2×10, shoulder CARs (controlled articular rotations), warm-up sets. Full body: combine above in 15 min. Never stretch cold — dynamic warm-up raises temperature and improves blood flow without reducing force production the way static stretching can.",
    answerMax: "ZARIX MAX BLUEPRINT — Warm-Up System: 4-component protocol (15 min total). Component 1 — Temperature (5 min): 5 min rowing at moderate pace, or 5 min jump rope. Component 2 — Joint mobility (4 min): ankle circles (30 sec), hip 90/90 with rotation (1 min each side), thoracic rotation (30 sec), shoulder CARs (1 min). Component 3 — Activation (4 min): glute bridges 2×15 (fire glutes before squatting), band pull-aparts 2×20 (activate rear delts before pressing), dead bugs 2×8 each side (core activation). Component 4 — Specific (2 min): 2 warm-up sets per main exercise at 40% and 60% of working weight. This prevents injury and primes the CNS for maximum output.",
  },
  {
    id: 27, category: "Gym",
    tags: ["form","technique","safety"],
    question: "How do I squat with proper form?",
    answerShort: "Bar over mid-foot, chest tall, knees tracking over toes, hips break parallel.",
    answer: "Proper squat mechanics: stance shoulder-width apart, toes 30° out, bar on traps (high bar) or rear delts (low bar). Initiate: simultaneous hip hinge and knee bend. Descent: knees push out over toes, chest stays upright, maintain neutral spine. Depth: aim for crease of hip below top of knee (parallel or deeper for full range of motion). Ascent: drive through the whole foot, knees stay out, finish with lockout at hips and knees. Common errors: knees caving in (weak glutes/abductors), excessive forward lean (tight hips or ankles), partial depth.",
    answerPro: "Squat correction drills by fault: Knee cave: add band above knees for constant feedback, strengthen hip abductors (lateral band walk, clamshell), box squats. Forward lean: goblet squat to develop upright position, ankle mobility (elevated heels temporarily), front squat to build quad dominance. Depth limitation: ankle dorsiflexion stretches daily (wall ankle stretch), heel elevation, squat-to-box at increasing depth. Foot placement: use squat shoes (1 cm heel) or plates under heels to improve dorsiflexion and allow upright posture. Breathing: brace abs and fill lungs before descent (Valsalva maneuver), hold through sticking point, exhale on way up.",
    answerMax: "ZARIX MAX BLUEPRINT — Squat Mechanics: Video assessment from side and front on first session. Key checkpoints: side view — shins should be near parallel to torso at bottom; front view — knees track same direction as toes throughout. Foot position: test 3 stances (shoulder-width toes-straight, shoulder-width toes-30-out, wide stance toes-45-out) and choose the one allowing deepest pain-free depth. Mobility prerequisites: 20° ankle dorsiflexion (test: kneeling heel-to-wall stretch), 120° hip flexion. Breathing and bracing: 360° brace (push air into belly AND lower back, not just into chest). Add a belt only after mastering brace without. Programming: 2× per week minimum for skill development, not just strength. Video every set for the first 3 months.",
  },
  {
    id: 28, category: "Nutrition",
    tags: ["pre-workout","meal","energy"],
    question: "What should I eat before a workout?",
    answerShort: "Carbs + moderate protein 60–90 minutes before. Avoid high fat or high fiber right before training.",
    answer: "Pre-workout nutrition goals: provide glucose for working muscles, prevent muscle breakdown, and keep you comfortable during exercise (not too full, not too hungry). 60–90 min before: 30–50g carbs + 20–30g protein + minimal fat. Examples: oats with whey + banana, chicken and white rice, Greek yogurt with granola. 30 min before: something smaller and faster-digesting: banana, rice cakes with jam, sports drink.",
    answerPro: "Pre-workout meal optimization: Training time drives meal timing. 7 AM training: small fast meal 30 min before (banana + whey) or train fasted with caffeine. Noon training: normal breakfast 3h before, light snack 90 min before. 6 PM training: lunch 3h before, afternoon snack 90 min before. Foods to avoid within 2 hours: high-fat (slows digestion, causes GI distress), high-fiber (fermentation during exercise = bloating), large portions (blood diverts to digestion from muscles). Caffeine: 3–6mg/kg, 30–60 min before training — proven to improve performance across all modalities.",
    answerMax: "ZARIX MAX BLUEPRINT — Pre-Training Nutrition: Individualize by training type. Strength training: carbohydrate loading not needed — moderate carbs sufficient. Glycogen depletion takes 2+ hours of intense work. Pre-workout meal (90 min out): 0.5g/kg carbs + 0.25g/kg protein + <10g fat. Endurance training >90 min: higher carb pre (1g/kg carbs 2 hours before). Race or competition: 2-3g/kg carbs in the 24 hours before, plus 1g/kg 3 hours before event. Gut training: practice race-day nutrition in training — GI issues in competition are preventable with preparation. Caffeine strategy: cycle off for 2 weeks before major events to restore sensitivity, then taper back in during peak week for maximum effect.",
  },
  {
    id: 29, category: "Sport",
    tags: ["HIIT","cardio","fat loss"],
    question: "Is HIIT better than steady-state cardio for fat loss?",
    answerShort: "HIIT burns more calories per minute and elevates metabolism longer, but both work when paired with diet.",
    answer: "HIIT (High-Intensity Interval Training) vs. LISS (Low-Intensity Steady State): both reduce fat when combined with a caloric deficit. HIIT advantages: more calories burned per minute (250–400 vs 150–200), EPOC (excess post-exercise oxygen consumption) burns extra calories 12–24 hours after, time-efficient (20 min HIIT ≈ 40 min LISS for caloric expenditure), preserves muscle better. LISS advantages: lower recovery cost (doesn't interfere with strength training), easier to perform when fatigued, enjoyable for long durations. Best approach: combine both (2× HIIT + 2× LISS per week).",
    answerPro: "HIIT protocol options: Tabata (20 sec on, 10 sec off × 8 rounds = 4 min) — extremely intense, best for experienced athletes. Fartlek (speed play): unstructured intervals during a run — surge for 1 min, jog for 2 min, repeat for 20–30 min. Classic interval: 30 sec max effort, 90 sec rest × 10–15 rounds. HIIT modalities: rowing (full body, low impact), cycling (low impact), sprinting (high impact), kettlebell complexes, bodyweight circuits. LISS: 30–60 min brisk walking, cycling, swimming at 60–70% max HR. Limit HIIT to 2–3× per week — it's high neural load.",
    answerMax: "ZARIX MAX BLUEPRINT — Cardio for Fat Loss: Strategy: cardio modality should not interfere with your primary training goal. Strength athletes: minimize HIIT (depletes CNS), maximize LISS (brisk walking 30 min daily adds up). Endurance athletes: progressive HIIT in periodized blocks. General fat loss (no strength priority): Zone 2 LISS (130–140 bpm) × 45 min, 4× week = sustainable, effective, low-risk. HIIT addition: 2× per week adds metabolic boost. Total weekly cardio volume: 150–300 min/week for health; 300+ min for significant fat loss. Fat loss math: 3,500 kcal deficit = approximately 0.45 kg fat. 500 kcal deficit/day = 0.45 kg fat/week. Cardio is a tool to create or expand that deficit — not the primary driver.",
  },
  {
    id: 30, category: "Bodybuilder",
    tags: ["competition","prep","peak"],
    question: "How do bodybuilders prepare for competition?",
    answerShort: "Competition prep involves a progressive caloric deficit, peak week manipulation (water, sodium, carbs), and posing practice.",
    answer: "Natural bodybuilder competition prep: typically 12–20 weeks depending on starting body fat. Key phases: (1) Diet phase — progressive caloric deficit, maintaining high protein (2.5g/kg), reducing carbs and fats; (2) Training — maintain or slightly reduce volume, keep intensity high to preserve muscle; (3) Cardio — increasing LISS from 3× to 6× per week over the prep; (4) Peak week — manipulate carbs, water, and sodium to maximize muscle fullness and skin thinness; (5) Posing — daily practice for 12+ weeks.",
    answerPro: "Competition prep structure: Starting body fat: 15% (men) or 25% (women) requires 16-week prep to reach stage-ready 4–6% (men) or 12–15% (women). Rate of loss: 0.5–0.75% bodyweight per week. Calorie reduction: start at 300 kcal deficit, increase every 3 weeks if progress stalls. Training: keep heavy compounds, reduce isolation volume when fatigued. Cardio: start 3×30 min LISS, peak at 6×45–60 min. Peak week: 3-day carb depletion (reduce carbs 50%), 3-day carb load (eat 2× normal carbs), reduce sodium 48h out, reduce water 24h out. Judge feedback post-show to improve for next time.",
    answerMax: "ZARIX MAX BLUEPRINT — Bodybuilding Competition Prep: Phase 1 (Weeks 1–8): Early deficit. 400 kcal below TDEE. Training: full volume maintenance. Cardio: 3×30 min LISS. Phase 2 (Weeks 9–14): Intensification. 500–600 kcal deficit. Increase cardio to 5×45 min. High protein 2.5g/kg. Posing practice 20 min daily. Phase 3 (Weeks 15–18): Peak phase. Diet breaks every 2 weeks (eat at maintenance for 3 days) to restore leptin and metabolism. Phase 4 (Peak week): Day -7: normal. Day -6 to -4: carb depletion (100g carbs), high protein (2.5g/kg), lower water. Day -3 to -1: carb load (up to 600g high glycemic), moderate sodium, 2-3L water. Day 0 (show): carb + sodium breakfast, small sips water. Pump backstage. Posing: win or lose competitions. Practice every day.",
  },
];

/**
 * searchQA — find best matching Q&A entries for a given query
 * @param {string} query - The user's question text
 * @param {number} limit - Max results to return
 * @returns {Array} - Sorted array of matching QA entries
 */
export function searchQA(query, limit = 3) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const scored = qaDatabase.map(entry => {
    let score = 0;
    const haystack = (entry.question + ' ' + entry.answer + ' ' + entry.tags.join(' ') + ' ' + entry.category).toLowerCase();
    words.forEach(word => {
      if (haystack.includes(word)) score += 2;
    });
    if (entry.question.toLowerCase().includes(q)) score += 10;
    if (entry.category.toLowerCase().includes(q)) score += 5;
    return { ...entry, score };
  });

  return scored
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * getAnswerForTier — return appropriate depth answer based on subscription tier
 * @param {Object} entry - QA database entry
 * @param {string} tier - 'free' | 'plus' | 'pro' | 'max'
 * @returns {string} - The appropriately-tiered answer
 */
export function getAnswerForTier(entry, tier) {
  switch (tier) {
    case 'max': return entry.answerMax || entry.answerPro || entry.answer;
    case 'pro': return entry.answerPro || entry.answer;
    case 'plus': return entry.answer;
    default: return entry.answerShort;
  }
}

export default qaDatabase;
