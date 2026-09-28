/* Deadpool Watch 2 — even more original quips, horoscopes, moods, achievements. */
(function () {
  const Q = DP.QUIPS;
  Q.general.push(
    "Deadpool Watch 2: because the first one made money. Probably.",
    "Sequel rules: bigger, louder, more faces, same emotional baggage.",
    "Welcome back, Nick. I kept your seat warm. Don't ask with what.",
    "I got a glow-up. New bezel, new shaders, same trauma.",
    "This version has WebGL. I don't know what that is but it sounds expensive.",
    "Upgraded to 2.0. Still can't fix my face. Can fix your schedule though.",
    "I've been rendered at 120 frames per second. I've never looked this buttery.",
    "Every sequel needs a darker tone. So I added a Void. Wait, that was v1.",
    "Studio notes said 'more features'. I said 'more ME'. We compromised: both.",
    "If this watch had a trailer, it'd be ninety seconds of me winking.",
    "The first watch walked so this one could run. Then trip. Then heal.",
    "New faces! Finally something in this universe uglier than mine. Kidding. Nothing is.",
    "They said I couldn't fit thirteen faces on a watch. They were wrong and now they're sad.",
    "I'm the Swiss Army knife of watches. Mostly the corkscrew.",
    "Tell your friends about me. Actually, don't. I like it being just us.",
    "I'd tell you a time-travel joke, but you didn't like it tomorrow.",
    "Legally I'm required to say: no chimichangas were harmed. Several were eaten.",
    "Your thumb and I have a lot of history now. We should define the relationship.",
    "Fun fact: this app has more easter eggs than a church lawn in April.",
    "I'm contractually obligated to be adorable at least twice per minute.",
    "You know who doesn't have 13 faces? Your other watch. Loser.",
    "I tried meditation once. Got bored. Stabbed a guy. Back to meditation.",
    "My doctor says I have the heart of a lion. And the liver of a frat house.",
    "I'm not procrastinating. I'm pre-crastinating. It's different. Trust me.",
    "Pro tip: if you tilt the phone, the glare moves. I'm basically a disco ball with a mouth.",
    "Every second you spend with me is a second you're not doing taxes. You're welcome.",
    "Don't make me use my inside voice. I don't have one.",
    "There's a see-through face now. Yes, you can see my guts. Mechanical guts. Behave.",
    "Some people collect stamps. You collect Deadpool faces. We're both a little weird.",
    "I'm like a fine wine. Old, bitter, and best in small doses.",
    "They gave me a voice feature. HR is already filing complaints.",
    "If I had a nickel for every time I died, I'd have a nice watch. Oh wait.",
    "Nick, you look great today. That's the Nicepool in me talking. Gross.",
    "Weather check: 100% chance of sarcasm, scattered chimichangas.",
    "I just unlocked a new level of self-awareness. It's terrifying. Ten out of ten.",
    "Reminder: you're the main character. I'm the comic relief that steals every scene.",
    "Swipe me, tap me, shake me. Just don't put me in airplane mode. I get lonely.",
    "I'm running on your phone's GPU right now. It's warm in here. Cozy.",
    "Achievement unlocked: Looking At Watch. Riveting gameplay.",
    "I'd call this a limited edition, but the internet is forever.",
    "Shoutout to the service worker. The real MVP. Works offline and never complains.",
    "Is it just me or does the new bezel make my butt look shiny?",
    "The chrono face is linked to the stopwatch. I'm a watch AND an engineer. Swoon.",
    "Knock knock. Who's there? Interrupting Deadpool. Interrupting Deadp— HI NICK!",
    "Plot hole detected. Patching it with chimichanga filling.",
    "I cried during the last software update. Don't tell anyone.",
    "I could be a smartwatch, but I chose violence. And charm.",
    "Don't worry about the future. I've seen it. It's got flying tacos.",
    "Sequel bait: there's definitely a Deadpool Watch 3. Probably. Ask your lawyer.",
    "Current status: fabulous, regenerating, and slightly sticky."
  );
  Object.assign(Q, {
    skeleton: ["Enjoying my insides? Kinky.", "31 jewels, zero morals.", "That balance wheel is doing more cardio than you.", "Mechanical movement. Like me, but with fewer screws loose."],
    chronoStart: ["Chrono started! MAXIMUM EFFORT!", "Timing you. No pressure. Lots of pressure."],
    chronoStop: ["Stopped. Was that your personal best? Don't answer.", "Chrono halted. Time is an illusion anyway."],
    chronoReset: ["Reset. Clean slate. Like my criminal record. (It isn't.)"],
    cable: ["TIME JUMP! Kidding. The budget didn't cover it.", "Target acquired. Deploying sarcasm.", "Grumpy future soldier mode: engaged.", "Scanning... threat level: adorable."],
    sacred: ["Branches detected. Pruning with extreme prejudice.", "Every choice creates a timeline. This one has you tapping a watch.", "The sacred timeline says you should eat lunch."],
    headpool: ["Look ma, no body!", "I'm all head. Big brain energy. Literally.", "Bobble bobble, I'm a head, can't hobble.", "Don't worry, the body's around here somewhere."],
    lady: ["Hey gorgeous. Yes, I'm talking to myself.", "Twice the sass, half the patience.", "Ponytail game: unmatched."],
    kid: ["I'm not little, I'm fun-sized!", "Can we get ice cream? CAN WE?!", "I drew this face myself! With crayons! Mostly on the wall!"],
    nice: ["Oh my gosh, hi! You look amazing. Did you do something with your thumbs?", "Sorry for existing so loudly! Have a great day!", "You're doing SO good, Nick. Proud of you, pal."],
    dogface: ["BORK.", "Who wants belly rubs? This merc does.", "Squirrel! ...Sorry, where was I?", "Zoomies activated!"],
    weather: {
      hot: ["It's {t}. I'm sweating in spandex. Pray for my thighs.", "{t}? Even my healing factor needs sunscreen."],
      cold: ["{t}. Colder than my ex's heart. Wear a jacket, champ.", "It's {t}. My nipples could cut glass."],
      rain: ["Rain. Great. Now I smell like wet leather and regret.", "It's raining. Perfect excuse to stay in and stare at me."],
      snow: ["Snow! Let's build a snowman and give it a katana.", "It's snowing. Bundle up, or don't, I'm not your mom."],
      storm: ["Thunder! That's just me clapping for you.", "Storm's coming. Unplug your feelings."],
      nice: ["{t} and {c}. Go outside, weirdo. Touch grass.", "Beautiful day. Somebody's gonna ruin it. Probably me."]
    },
    focus: {
      start: ["MAXIMUM EFFORT MODE. Phone down. Eyes up. Stab procrastination.", "Focus time! I'll be quiet. That's a lie, but I'll try."],
      done: ["Focus block DONE. Treat yo self. One chimichanga. Maybe two.", "You focused! Like a laser! A lazy laser! Proud of you!"],
      breakDone: ["Break's over. Back to the grind, you glorious workhorse.", "Snack time's up. Chop chop."]
    },
    interval: {
      work: ["WORK!", "GO GO GO!", "MAXIMUM EFFORT!", "Move it, meat bag!"],
      rest: ["REST!", "Breathe. Don't die. I'm the only immortal here.", "Recover, champ."],
      done: ["Workout complete! You're 1% more like me. Minus the scars.", "DONE! Sweaty, gross, and magnificent."]
    },
    game: {
      sliceStart: ["Slice the chimichangas! Avoid the grenades! Don't slice the unicorn. Or do. I'm not a cop."],
      bulletStart: ["Catch the bullet! Wait for it... WAIT FOR IT..."],
      over: ["Game over. You died. I'd know, I'm an expert.", "Not bad! For a mortal.", "New high score? Probably not. Try again, champ."],
      record: ["NEW HIGH SCORE! Somebody call the Guinness people!", "Record broken! Like my fourth wall!"]
    },
    ach: ["Achievement unlocked! Tell your mom!", "Shiny badge acquired. Worth nothing. Priceless."],
    babylegs: ["Look at my tiny legs! They grow back weird sometimes!", "Baby legs! Don't look at me! ...Okay, look a little."],
    dance: ["DANCE BREAK! Hit it!", "Nobody puts Deadpool in a corner!"],
    crown: ["Case-back revealed! Engraved, just for you.", "You found my backside. Buy me dinner."],
    bezel: ["Spin me right round, baby, right round... wait, don't sue.", "Full bezel spin! You'd make a great safecracker."],
    taco: ["TACO TUESDAY! Any day is Tuesday if you believe."],
    countdown: ["The countdown has ended! Hope it was worth the wait.", "Time's up! Whatever it was, go get 'em."]
  });
  Q.hourly.push("{t}! Hydration check. Chimichangas count as water, right?", "It's {t}. Time flies. I'd know, I've been thrown out of planes.");

  // ---------- horoscope fragments (seeded daily) ----------
  DP.HORO = {
    signs: [["Aries", "\u2648"], ["Taurus", "\u2649"], ["Gemini", "\u264A"], ["Cancer", "\u264B"], ["Leo", "\u264C"], ["Virgo", "\u264D"], ["Libra", "\u264E"], ["Scorpio", "\u264F"], ["Sagittarius", "\u2650"], ["Capricorn", "\u2651"], ["Aquarius", "\u2652"], ["Pisces", "\u2653"]],
    open: ["The stars are drunk today, so take this with salt.", "Mercury is in retrograde, which is astrology-speak for 'blame the planets'.", "The cosmos looked at your chart and said 'oof'.", "A rare alignment of Mars and a chimichanga occurs today.", "The universe has a plan for you. It's mostly snacks.", "Your ruling planet called in sick, so I'm filling in.", "The moon is judging you. Slightly. Lovingly."],
    main: ["Someone will compliment your shoes. They're lying, but take it.", "A mysterious stranger will offer you a snack. Accept. Always accept.", "You'll finally find the thing you lost. It was in your hand the whole time.", "Today is a great day to start something bold. Or nap. Nap is bold.", "An old friend will text 'hey'. Do not answer before coffee.", "Your inner voice will say something smart. Ignore it and do something fun.", "You'll be tempted to reply-all. Don't. The stars beg you.", "Something unexpected will happen. Probably a sneeze. A big one.", "The universe wants you to hydrate. The universe is basic, but right.", "You'll win a small argument today. Be humble. Rub it in later."],
    love: ["Love: someone thinks you're cute. It might be me. It's me.", "Love: flirt like nobody's watching. Everyone's watching.", "Love: text them. No, the other one. The nice one.", "Love: self-love day. Order the extra guac.", "Love: your soulmate is out there, eating chimichangas. Follow the smell."],
    work: ["Work: pretend to be busy with confidence. Confidence is 90% of work.", "Work: a meeting could've been an email. Survive it anyway.", "Work: your productivity peaks at 2:47 PM. Use it wisely. Or for snacks.", "Work: someone will steal your idea. Karma has a katana.", "Work: ask for the raise. Worst case, they say no and I stab... I mean, it's fine."],
    warn: ["Avoid: pigeons with attitude.", "Avoid: reading the comments section.", "Avoid: stairs you can't see the end of.", "Avoid: anyone who says 'no offense'.", "Avoid: microwaving fish at the office. For everyone's sake."],
    weapon: ["katana", "rubber chicken", "spork", "sarcasm", "a very sharp look", "bazooka (decorative)", "frying pan", "harsh language"]
  };
  // ---------- moods ----------
  DP.MOODS = [
    { id: 0, name: "UNALIVED", color: "#6b6b75", quips: ["Hey. Bad days are temporary. I'd know, I've had like a million and I'm still here. Mostly in pieces.", "Sending you a virtual hug. It's awkward and I smell like gunpowder, but it's sincere.", "You matter, Nick. Even on the days you feel like a soggy taco. Especially then.", "Rough one? Drink water, eat something, text a friend. Doctor Deadpool's orders."] },
    { id: 1, name: "CRUSTY", color: "#8a4a2a", quips: ["Crusty is just crispy with a bad attitude. You'll warm up.", "Put on your favorite song and scream-sing it. Neighbors love that.", "Remember: even I've been blown up and still made it to lunch."] },
    { id: 2, name: "MEH", color: "#c9a24a", quips: ["Meh is fine. Meh is a vibe. Meh is where legends nap.", "Let's upgrade that meh to 'eh!' Enthusiasm: +2%.", "Try a five-minute walk. Or stare at my face. Both are cardio."] },
    { id: 3, name: "GOOD", color: "#3aa56a", quips: ["Good! Look at you, thriving. Disgusting. Love it.", "Good mood detected. Don't let anybody steal it, especially Mondays.", "Keep that energy! Bottle it! Sell it! Split the profits with me!"] },
    { id: 4, name: "MAXIMUM", color: "#ff3b44", quips: ["MAXIMUM MOOD! Somebody get this guy a parade!", "You're radiating so hard I need sunglasses. Under my mask. Somehow.", "Today you are unstoppable. Please use this power for tacos."] }
  ];
  // ---------- achievements ----------
  DP.ACHIEVEMENTS = [
    ["first_quip", "Captive Audience", "Hear your first quip", "\uD83D\uDCAC"],
    ["quips_100", "Glutton for Punishment", "Endure 100 quips", "\uD83E\uDD2F"],
    ["wall_1", "Wall Breaker", "Break the fourth wall", "\uD83D\uDCA5"],
    ["wall_10", "Contractor's Nightmare", "Break it 10 times", "\uD83D\uDEA7"],
    ["faces_all", "Face Collector", "View all 13 faces", "\uD83C\uDFAD"],
    ["eggs_5", "Egg Hunter", "Find 5 easter eggs", "\uD83E\uDD5A"],
    ["eggs_all", "Egg-cellent", "Find every easter egg", "\uD83D\uDC23"],
    ["slice_50", "Chimi Chopper", "Score 50+ in Katana Slice", "\uD83D\uDDE1\uFE0F"],
    ["slice_200", "Ninja Chef", "Score 200+ in Katana Slice", "\uD83E\uDD77"],
    ["bullet_300", "Bullet Catcher", "Average under 300 ms", "\uD83D\uDD2B"],
    ["bullet_220", "Slo-Mo Legend", "Average under 220 ms", "\u26A1"],
    ["focus_1", "Maximum Effort", "Finish a focus block", "\uD83C\uDFAF"],
    ["focus_4", "Deep Work Merc", "Finish 4 focus blocks in a day", "\uD83E\uDDE0"],
    ["interval_1", "Sweaty Merc", "Finish an interval workout", "\uD83D\uDCAA"],
    ["chimi_1", "Chimichanga Chef", "Finish the chimichanga timer", "\uD83C\uDF2F"],
    ["laps_5", "Lap Dog", "Record 5 laps", "\uD83C\uDFC1"],
    ["steps_1000", "Walk It Off", "1,000 steps in a day", "\uD83D\uDC5F"],
    ["weather", "Weather Merc", "Load live weather", "\u26C5"],
    ["voice", "Voice Actor", "Turn on the quip voice", "\uD83C\uDF99\uFE0F"],
    ["horoscope", "Stars Aligned", "Read your horoscope", "\uD83D\uDD2E"],
    ["mood_3", "Emotionally Available", "Log your mood 3 times", "\uD83D\uDC96"],
    ["flashlight", "Lights Out", "Use the screen light", "\uD83D\uDD26"],
    ["countdown", "Countdown Crew", "Create a countdown", "\u23F3"],
    ["custom", "Fashionista", "Customize a watch face", "\uD83C\uDFA8"],
    ["near_death", "Near Death Experience", "Drop below 20% health", "\u2620\uFE0F"],
    ["night_owl", "Night Owl", "Use the app between midnight and 4 AM", "\uD83E\uDD89"],
    ["early_bird", "Early Bird", "Use the app between 4 and 6 AM", "\uD83D\uDC26"],
    ["wolverine", "Bub", "Enter Wolverine mode", "\uD83D\uDC3E"]
  ].map(([id, name, desc, icon]) => ({ id, name, desc, icon }));
  DP.EGGS.push(
    { id: "crown", name: "Crown Jewels", hint: "Tap the watch crown five times." },
    { id: "babylegs", name: "Baby Legs", hint: "Press and hold the healing meter up top." },
    { id: "dance", name: "Dance Break", hint: "Tap the logo ten times, fast." },
    { id: "taco", name: "Taco Tuesday", hint: "Slice a rare taco in Katana Slice." },
    { id: "bezel", name: "Safecracker", hint: "Spin the bezel a full 360\u00b0 (drag on the crown)." }
  );
})();
