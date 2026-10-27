# Submission form answers

Draft answers for the CAC form, in plain first-person voice. Rewrite anything that doesn't sound like you. **The inspiration answer needs your real story**; a judge can tell when it's generic.

---

**App name**
Clarity

**One-line description**
Tap four things and get one clear next step (rest, get seen soon, or call 911) in the first seconds after a scary symptom, in English or Spanish.

**Target audience**
Anyone who has to decide fast whether a symptom is an emergency, for themselves or someone they're caring for. I especially had in mind parents, people looking after older relatives, and people who are more comfortable in Spanish than English.

**What does your app do / how does it work?**
You pick a scenario like chest discomfort or "something feels off," set how severe it is, say whether it came on suddenly, and tap any symptoms. You can also type a description. Clarity scans all of that for warning signs, severity words, symptoms, and reassuring context. Each one has a weight, and the total sets a level: low, moderate, or high. Then safety rules run. Red-flag warning signs always mean high, and nothing can lower them. Unclear answers, missing information, a baby or older adult, or sudden strong symptoms can move low up to moderate, but no rule can move anything down. You get one action, a short reason, what to watch for, and nearby care. "View reasoning" shows every signal and its weight. The whole app switches to Spanish with one tap, installs to your home screen, and works offline.

**Inspiration**
> [YOUR STORY. Two or three sentences about a real moment: you, family, or someone you saw who didn't know whether to get help, or who had trouble getting help in their language. Then one sentence on why you wanted one clear answer instead of a list of possibilities.]

**Technical difficulty and how you solved it**
The app needs to work with no internet, so the decision engine has to run on the phone in TypeScript, but I wrote the engine and its tests in Python first. Keeping two copies of the same logic in sync by hand was going to break eventually. I made Python the single source of truth: a script reads the Python rules and generates the TypeScript rule table, and also generates 108 test inputs with the exact answers Python gives. The TypeScript tests must match all 108, field for field, and GitHub Actions runs both test suites on every push.

Those tests found real bugs. The chest-pain scenario includes "it's not going away," and the engine was reading "going away" as a sign of improvement, which lowered the score on a chest-pain case. The keyword "cut" was also matching inside "acute." I added word-boundary matching and negation handling ("not," "no," "never"), but I made red flags ignore negation on purpose, so a message like "no chest pain, actually it's pressure" still counts as an emergency.

**Tools and languages**
Python (decision engine, Flask API, code generator, pytest), TypeScript in strict mode (the app, on-device engine, English/Spanish layer, tests with Node's test runner), HTML and CSS, GitHub Actions, GitHub Pages. It's a Progressive Web App, so it installs on iPhone and Android without an app store.

**What did you learn?**
Designing for uncertainty is harder than designing for clear cases. The easy part is "chest pain means 911." The hard part is "I feel kind of off," where being too cautious makes people ignore the app and not cautious enough is dangerous. I also learned to make one place the source of truth instead of trusting myself to keep two copies in sync.

**What would you add next?**
Have an ER nurse or doctor review the warning signs and weights, add a live nearby-care lookup, and add more languages.

**Links**
- Code: https://github.com/<you>/clarity
- Live app: https://<you>.github.io/clarity/
- Video: <YouTube link>
