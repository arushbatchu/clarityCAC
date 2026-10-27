# Demo video script (about 2:40)

CAC rules: 1 to 3 minutes, public on YouTube or Vimeo. Most district pages say judges may score mostly from this video, so it has to cover: app name, who it's for, how it works, tools used, and a technical problem you hit and how you solved it.

**Setup:** Record your screen with the live GitHub Pages link open in Chrome (desktop view shows the phone frame and side panels). Mac: Cmd+Shift+5. Windows: Win+G, or OBS. Talk over it. One take is fine. Don't read this word for word; say it your way.

---

**0:00–0:20 · Name, problem, audience**
> "This is Clarity. When something scary happens, chest pressure, a kid's fever spiking, most people freeze. Rest? Nurse? 911? Clarity is for anyone in that moment, including people who'd rather do it in Spanish. You tap four things and get one clear action."

**0:20–0:45 · Demo 1: the obvious emergency**
Tap **Chest discomfort** → **Evaluate now**.
> "One tap fills in the scenario. HIGH urgency, call 911. The why is in plain words: chest pressure is a warning sign, and warning signs always mean emergency care. Nothing can talk a red flag down."

Point at "Decided in __s": "It times the decision. The goal is under ten seconds."

**0:45–1:15 · Demo 2: the hard case**
**New check** → **Something feels off** → **Evaluate**. Open **View reasoning**.
> "The hard cases are the maybes. 'I'm kind of dizzy, my heart feels weird, I'm not sure.' Clarity says MODERATE: get seen within hours. Here's every signal it found and its weight. If the wording is unclear and there's nothing reassuring, the safety rules can only move you up a level, never down."

**1:15–1:35 · Demo 3: Spanish**
Tap **ES**. **Add written description** → type *mi abuela no puede respirar bien* → **Evaluar**.
> "One tap switches everything to Spanish. Even typed Spanish gets checked for the same warning signs. 'No puedo respirar' is a red flag, same as 'can't breathe.'"

**1:35–1:50 · Install**
Show the phone on camera, or the install icon in Chrome's address bar.
> "It installs to your home screen and works with no signal, which matters if you're stuck somewhere without service."

**1:50–2:25 · How it's built + the technical challenge**
Flash `backend/clarity/engine.py`, then `frontend/src/engine.ts`, then the test output.
> "The decision engine is Python. The app is TypeScript, and it runs the engine on the phone so it works offline. The problem: two copies of the same logic can drift apart. So Python is the source of truth. A script generates the TypeScript rules from Python, plus 108 test cases with Python's answers, and the TypeScript tests have to match every one."
>
> "Those tests caught real bugs. The chest scenario says 'it's not going away,' and my engine read 'going away' as a sign of improving, so it was subtracting points from a chest-pain case. I added negation handling, but red flags ignore it on purpose, so 'no chest pain... actually it's pressure' still counts."

**2:25–2:40 · Close**
> "Clarity doesn't diagnose. It gets you to the right level of care, fast, in your language. Thanks."

---

## Before you upload

- [ ] Under 3:00
- [ ] Set to **Public** (not Unlisted, not Private)
- [ ] Open the link in an incognito window to check it plays
- [ ] Paste the link into the README and the submission form

## Q&A prep (if you get to #HouseOfCode)

**Why not AI?** Language models can make things up. For "should I call 911," every answer should trace to a specific rule someone can check and argue with.

**How accurate is it?** It's not trying to diagnose, it's trying to route. It's tuned so borderline cases go up a level, because a missed emergency is worse than an extra urgent-care visit. It hasn't been clinically validated; that's the next step.

**Where did the rules come from?** Widely published "call 911" warning signs (chest pain, stroke signs like FAST, trouble breathing, and so on). A real version needs a clinician to review them.
