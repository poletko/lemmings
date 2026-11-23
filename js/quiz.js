'use strict';
// Matematični odmor (nemoteč): med stopnjo se igralcu občasno ponudi račun (raven 4.–5. razreda, kot v vlakcu).
// Igralec ga odpre, ko mu ustreza (RT / R / PageUp), in ga lahko odloži (B); igra teče naprej. Vnos s kolesci števk: ↕ številka, ↔ premik, A potrdi; na tipkovnici lahko vtipkaš števke
// (zgornja vrstica = P1, številčnica = P2). Pravilen odgovor = +1 izbranega orodja.
const Quiz = (() => {
  const TRIES = 3;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // Tematske besedilne naloge – vezane na vzdušje stopnje (pokopališče, zmrzal, kripta, bučna noč).
  // Števila pred samostalniki so ≥ 5 in se ne končajo na 01–04, da je sklon vedno pravilen ("7 netopirjev").
  const okN = n => n % 100 < 1 || n % 100 > 4;
  function themeQuestion(theme, sl) {
    for (let k = 0; k < 50; k++) {
      const a = r(5, 9), b = r(5, 12), q = r(5, 25), x = r(120, 480), y = r(15, 95);
      if (![a, b, q, q * a, q * b, a * b, x, y].every(okN)) continue;
      const T = {
        meadow: sl ? [
          [`Na pokopališču je ${a} vrst nagrobnikov, v vsaki vrsti ${b}. Koliko nagrobnikov je vseh?`, a * b, ''],
          [`Duhec v eni minuti obleti ${b} nagrobnikov. Koliko jih obleti v ${a} minutah?`, a * b, ''],
          [`${q * a} svečk enako razdelimo na ${a} grobov. Koliko svečk gori na enem grobu?`, q, ''],
          [`Sova zahuka ${b}-krat na uro. Kolikokrat zahuka v ${a} urah?`, a * b, ''],
          [`Do polnoči je še ${a} minut. Koliko sekund je to?`, a * 60, 's'],
        ] : [
          [`The graveyard has ${a} rows of tombstones, ${b} in each row. How many tombstones in all?`, a * b, ''],
          [`A ghost circles ${b} tombstones every minute. How many in ${a} minutes?`, a * b, ''],
          [`${q * a} candles are shared equally among ${a} graves. How many candles burn on one grave?`, q, ''],
          [`An owl hoots ${b} times an hour. How many hoots in ${a} hours?`, a * b, ''],
          [`It is ${a} minutes to midnight. How many seconds is that?`, a * 60, 's'],
        ],
        snow: sl ? [
          [`Tapkači naredijo ${a} sneženih mož, vsak ima ${b} gumbov iz oglja. Koliko gumbov je vseh?`, a * b, ''],
          [`Na jelki visi ${q * a} ledenih sveč v ${a} enakih vrstah. Koliko jih je v eni vrsti?`, q, ''],
          [`Ponoči je −${a} °C, do jutra se ohladi še za ${b} °C. Koliko stopinj pod ničlo je zjutraj?`, a + b, '°C'],
          [`Sani prevozijo ${b} m v minuti. Koliko metrov prevozijo v ${a} minutah?`, a * b, 'm'],
          [`Ledeni most je dolg ${q * b} cm, ena ledena kocka meri ${b} cm. Koliko kock potrebujemo?`, q, ''],
        ] : [
          [`The critters build ${a} snowmen with ${b} coal buttons each. How many buttons in all?`, a * b, ''],
          [`${q * a} icicles hang on a pine in ${a} equal rows. How many in one row?`, q, ''],
          [`At night it is −${a} °C and it cools by another ${b} °C by morning. How many degrees below zero in the morning?`, a + b, '°C'],
          [`A sledge goes ${b} m every minute. How many metres in ${a} minutes?`, a * b, 'm'],
          [`An ice bridge is ${q * b} cm long and one ice block is ${b} cm. How many blocks do we need?`, q, ''],
        ],
        cave: sl ? [
          [`V kripti visi ${a} jat netopirjev, v vsaki jih je ${b}. Koliko netopirjev je vseh?`, a * b, ''],
          [`${q * a} svetlečih gobic raste v ${a} enakih kupčkih. Koliko gobic je v enem kupčku?`, q, ''],
          [`Pajek splete ${b} niti na uro. Koliko niti splete v ${a} urah?`, a * b, ''],
          [`Kopač je izkopal ${x} cm, do zaklada je še ${y} cm. Kako globoko je zaklad?`, x + y, 'cm'],
          [`Kapnik zraste ${b} mm na leto. Koliko milimetrov zraste v ${a} letih?`, a * b, 'mm'],
        ] : [
          [`${a} flocks of bats hang in the crypt, ${b} in each. How many bats in all?`, a * b, ''],
          [`${q * a} glowing mushrooms grow in ${a} equal clumps. How many in one clump?`, q, ''],
          [`A spider spins ${b} threads an hour. How many threads in ${a} hours?`, a * b, ''],
          [`A digger has dug ${x} cm and the treasure is ${y} cm deeper. How deep is the treasure?`, x + y, 'cm'],
          [`A stalactite grows ${b} mm a year. How many mm in ${a} years?`, a * b, 'mm'],
        ],
        dusk: sl ? [
          [`Na njivi je ${a} vrst buč, v vsaki vrsti ${b}. Koliko buč je na njivi?`, a * b, ''],
          [`Čarovnica razdeli ${q * a} bonbonov med ${a} tapkačev. Koliko bonbonov dobi vsak?`, q, ''],
          [`Ena buča tehta ${b} kg. Koliko kilogramov tehta ${a} takih buč?`, a * b, 'kg'],
          [`Metla preleti ${b} km na uro. Koliko kilometrov preleti v ${a} urah?`, a * b, 'km'],
          [`V kotlu je ${a} l čarobne juhe. Koliko decilitrov je to?`, a * 10, 'dl'],
        ] : [
          [`A field has ${a} rows of pumpkins, ${b} in each row. How many pumpkins?`, a * b, ''],
          [`A witch shares ${q * a} sweets among ${a} critters. How many does each get?`, q, ''],
          [`One pumpkin weighs ${b} kg. How many kg do ${a} such pumpkins weigh?`, a * b, 'kg'],
          [`A broom flies ${b} km an hour. How many km in ${a} hours?`, a * b, 'km'],
          [`The cauldron holds ${a} l of magic soup. How many decilitres is that?`, a * 10, 'dl'],
        ],
        christmas: sl ? [
          [`Pod jelko je ${a} kupov daril, v vsakem kupu ${b} daril. Koliko daril je vseh?`, a * b, ''],
          [`Na jelko obesimo ${q * a} bunk v ${a} enakih vrstah. Koliko bunk je v eni vrsti?`, q, ''],
          [`Božiček obišče ${b} hiš na uro. Koliko hiš obišče v ${a} urah?`, a * b, ''],
          [`Lučke na jelki utripnejo ${b}-krat na minuto. Kolikokrat utripnejo v ${a} minutah?`, a * b, ''],
          [`Spekli smo ${q * b} piškotov in jih razdelili na ${b} krožnikov. Koliko piškotov je na enem krožniku?`, q, ''],
        ] : [
          [`There are ${a} piles of presents under the tree, ${b} in each pile. How many presents in all?`, a * b, ''],
          [`We hang ${q * a} baubles on the tree in ${a} equal rows. How many in one row?`, q, ''],
          [`Santa visits ${b} houses an hour. How many houses in ${a} hours?`, a * b, ''],
          [`The tree lights blink ${b} times a minute. How many blinks in ${a} minutes?`, a * b, ''],
          [`We baked ${q * b} biscuits and put them on ${b} plates. How many biscuits on one plate?`, q, ''],
        ],
        winter: sl ? [
          [`Tapkači naredijo ${a} kep na minuto. Koliko kep naredijo v ${b} minutah?`, a * b, ''],
          [`Drsališče je dolgo ${x} m, prepeljali smo že ${y} m. Koliko metrov še manjka?`, x - y, 'm'],
          [`V ${a} vrečah je ${q * a} kg soli za ceste. Koliko kilogramov je v eni vreči?`, q, 'kg'],
          [`Smučar se spusti ${b}-krat na dan. Kolikokrat se spusti v ${a} dneh?`, a * b, ''],
          [`Snežak potrebuje ${b} kep snega. Koliko kep potrebuje ${a} snežakov?`, a * b, ''],
        ] : [
          [`The critters make ${a} snowballs a minute. How many in ${b} minutes?`, a * b, ''],
          [`The ice rink is ${x} m long and we have skated ${y} m. How many metres are left?`, x - y, 'm'],
          [`${a} bags hold ${q * a} kg of road salt. How many kg in one bag?`, q, 'kg'],
          [`A skier goes down ${b} times a day. How many times in ${a} days?`, a * b, ''],
          [`A snowman needs ${b} snowballs. How many snowballs do ${a} snowmen need?`, a * b, ''],
        ],
        easter: sl ? [
          [`V ${a} košaricah je po ${b} pirhov. Koliko pirhov je vseh?`, a * b, ''],
          [`Zajček skrije ${q * a} pirhov na ${a} enakih mestih. Koliko pirhov je na enem mestu?`, q, ''],
          [`Zajček skoči ${b} m na skok. Koliko metrov preskoči v ${a} skokih?`, a * b, 'm'],
          [`Pobarvali smo ${x} pirhov, ${y} se jih je razbilo. Koliko celih pirhov ostane?`, x - y, ''],
          [`Kokoš znese ${a} jajc na teden. Koliko jajc znese v ${b} tednih?`, a * b, ''],
        ] : [
          [`${a} baskets hold ${b} painted eggs each. How many eggs in all?`, a * b, ''],
          [`The bunny hides ${q * a} eggs in ${a} equal spots. How many eggs in one spot?`, q, ''],
          [`The bunny hops ${b} m per hop. How many metres in ${a} hops?`, a * b, 'm'],
          [`We painted ${x} eggs and ${y} broke. How many whole eggs are left?`, x - y, ''],
          [`A hen lays ${a} eggs a week. How many eggs in ${b} weeks?`, a * b, ''],
        ],
        beach: sl ? [
          [`Na plaži je ${a} vrst ležalnikov, v vsaki vrsti ${b}. Koliko ležalnikov je vseh?`, a * b, ''],
          [`Nabrali smo ${q * a} školjk in jih razdelili med ${a} tapkačev. Koliko školjk dobi vsak?`, q, ''],
          [`En sladoled stane ${a} €. Koliko stane ${b} sladoledov?`, a * b, '€'],
          [`Rak naredi ${b} korakov na minuto. Koliko korakov naredi v ${a} minutah?`, a * b, ''],
          [`Peščeni grad je visok ${a} dm. Koliko centimetrov je to?`, a * 10, 'cm'],
        ] : [
          [`The beach has ${a} rows of sunbeds, ${b} in each row. How many sunbeds in all?`, a * b, ''],
          [`We collected ${q * a} shells and shared them among ${a} critters. How many does each get?`, q, ''],
          [`One ice cream costs ${a} €. How much do ${b} ice creams cost?`, a * b, '€'],
          [`A crab takes ${b} steps a minute. How many steps in ${a} minutes?`, a * b, ''],
          [`A sandcastle is ${a} dm tall. How many centimetres is that?`, a * 10, 'cm'],
        ],
        pool: sl ? [
          [`Bazen je dolg ${q} m. Koliko metrov preplava tapkač, ki preplava ${a} dolžin?`, q * a, 'm'],
          [`V bazenu je ${a} prog, na vsaki plava ${b} tapkačev. Koliko plavalcev je v bazenu?`, a * b, ''],
          [`Skakalnica je visoka ${a} m. Koliko centimetrov je to?`, a * 100, 'cm'],
          [`Reševalec napihne ${b} obročev na uro. Koliko obročev napihne v ${a} urah?`, a * b, ''],
          [`${q * a} plavalnih očal razdelimo na ${a} enakih kupčkov. Koliko očal je v enem kupčku?`, q, ''],
        ] : [
          [`The pool is ${q} m long. How many metres does a critter swim in ${a} lengths?`, q * a, 'm'],
          [`The pool has ${a} lanes with ${b} swimmers in each. How many swimmers in all?`, a * b, ''],
          [`The diving tower is ${a} m high. How many centimetres is that?`, a * 100, 'cm'],
          [`The lifeguard blows up ${b} rings an hour. How many rings in ${a} hours?`, a * b, ''],
          [`${q * a} pairs of goggles go into ${a} equal piles. How many pairs in one pile?`, q, ''],
        ],
        school: sl ? [
          [`V razredu je ${a} vrst, v vsaki vrsti sedi ${b} učencev. Koliko učencev je v razredu?`, a * b, ''],
          [`Učiteljica razdeli ${q * a} barvic med ${a} učencev. Koliko barvic dobi vsak?`, q, ''],
          [`Šolska ura traja 45 minut. Koliko minut traja ${a} šolskih ur?`, a * 45, 'min'],
          [`V knjižnici je ${a} polic s po ${b} knjigami. Koliko knjig je vseh?`, a * b, ''],
          [`Šolski zvonec zazvoni ${b}-krat na dan. Kolikokrat zazvoni v ${a} dneh?`, a * b, ''],
        ] : [
          [`A classroom has ${a} rows with ${b} pupils in each. How many pupils in the class?`, a * b, ''],
          [`The teacher shares ${q * a} crayons among ${a} pupils. How many does each get?`, q, ''],
          [`A school lesson lasts 45 minutes. How many minutes do ${a} lessons last?`, a * 45, 'min'],
          [`The library has ${a} shelves with ${b} books each. How many books in all?`, a * b, ''],
          [`The school bell rings ${b} times a day. How many times in ${a} days?`, a * b, ''],
        ],
      }[theme];
      if (T) return pick(T);
    }
    return null;
  }

  // Računi za opravljen 2. razred OŠ (Slovenija): števila do 100, seštevanje in odštevanje do 100 (tudi čez desetico),
  // poštevanka 2, 3, 4, 5 in 10 ter deljenje z njimi, dvakratnik/polovica, m–dm–cm, ura–minute, evri, preproste besedilne naloge.
  const NOUNS = {
    meadow: ['svečk', 'candles'], snow: ['ledenih sveč', 'icicles'], cave: ['netopirjev', 'bats'], dusk: ['buč', 'pumpkins'],
    christmas: ['daril', 'presents'], winter: ['snežakov', 'snowmen'], easter: ['pirhov', 'eggs'], beach: ['školjk', 'shells'],
    pool: ['plavalcev', 'swimmers'], school: ['barvic', 'crayons'],
  };
  function makeQuestion2(lang, theme) {
    const sl = lang !== 'en';
    const kind = pick(['add', 'add2', 'sub', 'sub2', 'table', 'table', 'div', 'missing', 'units', 'money', 'double', 'theme', 'theme', 'theme']);
    if (kind === 'theme') {
      const nn = NOUNS[theme] || NOUNS.meadow, n = nn[sl ? 0 : 1];
      for (let k = 0; k < 50; k++) {
        const a = r(5, 60), b = r(5, 40);
        if (![a, b].every(okN) || a + b > 100) continue;
        const T = sl ? [
          [`Tapkači so našli ${a} ${n}, nato še ${b} ${n}. Koliko ${n} so našli skupaj?`, a + b],
          [`Na levi je ${a} ${n}, na desni ${b} ${n}. Koliko ${n} je skupaj?`, a + b],
        ] : [
          [`The critters found ${a} ${n}, then ${b} more. How many ${n} did they find in all?`, a + b],
          [`There are ${a} ${n} on the left and ${b} on the right. How many in all?`, a + b],
        ];
        if (a > b && okN(a - b)) T.push(sl ? [`Bilo je ${a} ${n}. ${b} ${n} je izginilo. Koliko ${n} je ostalo?`, a - b] : [`There were ${a} ${n}. ${b} disappeared. How many are left?`, a - b]);
        const q = pick(T);
        return [q[0], q[1], ''];
      }
    }
    if (kind === 'add') { const a = r(10, 89), b = r(1, Math.min(9, 99 - a)); return [`${a} + ${b} = ?`, a + b, '']; }
    if (kind === 'add2') { const a = r(11, 70), b = r(11, 100 - a); return [`${a} + ${b} = ?`, a + b, '']; }
    if (kind === 'sub') { const a = r(20, 99), b = r(1, 9); return [`${a} − ${b} = ?`, a - b, '']; }
    if (kind === 'sub2') { const a = r(30, 100), b = r(10, a - 5); return [`${a} − ${b} = ?`, a - b, '']; }
    if (kind === 'table') { const t = pick([2, 3, 4, 5, 10]), b = r(1, 10); return pick([[`${t} · ${b} = ?`, t * b, ''], [`${b} · ${t} = ?`, t * b, '']]); }
    if (kind === 'div') { const t = pick([2, 3, 4, 5, 10]), q = r(1, 10); return [`${t * q} : ${t} = ?`, q, '']; }
    if (kind === 'missing') { const a = r(10, 70), b = r(3, 99 - a); return pick([[`${a} + □ = ${a + b}`, b, ''], [`□ + ${b} = ${a + b}`, a, '']]); }
    if (kind === 'units') {
      const a = r(2, 9);
      return pick(sl ? [['1 m = ? cm', 100, 'cm'], [`${a} dm = ? cm`, a * 10, 'cm'], ['1 ura = ? minut', 60, 'min'], ['Pol ure = ? minut', 30, 'min'], ['1 dan = ? ur', 24, 'h']]
        : [['1 m = ? cm', 100, 'cm'], [`${a} dm = ? cm`, a * 10, 'cm'], ['1 hour = ? minutes', 60, 'min'], ['Half an hour = ? minutes', 30, 'min'], ['1 day = ? hours', 24, 'h']]);
    }
    if (kind === 'money') {
      const a = r(20, 100), b = r(5, a - 2);
      return sl ? [`Imaš ${a} €. Kupiš igračo za ${b} €. Koliko evrov ti ostane?`, a - b, '€'] : [`You have ${a} €. You buy a toy for ${b} €. How many euros are left?`, a - b, '€'];
    }
    const a = r(5, 50);
    return pick(sl ? [[`Dvakratnik števila ${a} = ?`, a * 2, ''], [`Polovica od ${a * 2} = ?`, a, '']] : [[`Double ${a} = ?`, a * 2, ''], [`Half of ${a * 2} = ?`, a, '']]);
  }

  // [besedilo, odgovor, enota]; grade 2 = opravljen 2. razred, sicer 4.–5. razred
  function makeQuestion(lang, theme, grade) {
    if (grade === 2) return makeQuestion2(lang, theme);
    const sl = lang !== 'en';
    const kind = pick(['add', 'sub', 'table', 'mul', 'div', 'word', 'units', 'fraction', 'missing', 'theme', 'theme', 'theme', 'theme', 'theme', 'theme']);
    if (kind === 'theme') { const t = themeQuestion(theme, sl); if (t) return t; }
    if (kind === 'add') { const a = r(100, 899), b = r(100, 999 - a + 100); return [`${a} + ${b} = ?`, a + b, '']; }
    if (kind === 'sub') { const a = r(300, 1000), b = r(50, a - 1); return [`${a} − ${b} = ?`, a - b, '']; }
    if (kind === 'table') { const a = r(2, 10), b = r(2, 10); return pick([[`${a} · ${b} = ?`, a * b, ''], [`${a * b} : ${b} = ?`, a, '']]); }
    if (kind === 'mul') { const b = r(2, 9), a = r(11, 120); return [`${a} · ${b} = ?`, a * b, '']; }
    if (kind === 'div') { const b = r(2, 9), q = r(11, 99); return pick([[`${q * b} : ${b} = ?`, q, ''], [`${q * b} : □ = ${q}`, b, '']]); }
    if (kind === 'word') {
      const a = r(3, 9), b = r(4, 12), q = r(3, 25);
      return pick(sl ? [
        [`${q * a} tapkačev se enakomerno razdeli v ${a} hišic. Koliko jih je v eni hišici?`, q, ''],
        [`Iz balona skoči ${a} tapkačev vsako minuto. Koliko jih skoči v ${b} minutah?`, a * b, ''],
        [`Gradbenik položi ${b} opek na stopnico. Koliko opek je v ${a} stopnicah?`, a * b, ''],
        [`Kopač izkoplje ${b} cm v minuti. Koliko cm izkoplje v ${a} minutah?`, a * b, 'cm'],
        [`Plezalec spleza ${a * b} m v ${a} minutah. Koliko metrov spleza v eni minuti?`, b, 'm'],
        [`Doma je že ${a * 10} tapkačev, na poti še ${b}. Koliko jih bo skupaj?`, a * 10 + b, ''],
        [`${q * a} listov za padala razdelimo med ${a} tapkačev. Koliko listov dobi vsak?`, q, ''],
      ] : [
        [`${q * a} critters share ${a} houses equally. How many live in one house?`, q, ''],
        [`${a} critters jump from the balloon every minute. How many jump in ${b} minutes?`, a * b, ''],
        [`A builder lays ${b} bricks per step. How many bricks are in ${a} steps?`, a * b, ''],
        [`A digger digs ${b} cm per minute. How many cm in ${a} minutes?`, a * b, 'cm'],
        [`A climber climbs ${a * b} m in ${a} minutes. How many metres per minute?`, b, 'm'],
        [`${a * 10} critters are home and ${b} are on the way. How many in total?`, a * 10 + b, ''],
        [`${q * a} parachute leaves are shared by ${a} critters. How many does each get?`, q, ''],
      ]);
    }
    if (kind === 'units') {
      const a = r(2, 9), b = r(11, 99);
      return pick([
        [`${a} m ${b} cm = ? cm`, a * 100 + b, 'cm'], [`${a * 1000} m = ? km`, a, 'km'], [`${a} km = ? m`, a * 1000, 'm'],
        [`${a} t = ? kg`, a * 1000, 'kg'], [`${a} h = ? min`, a * 60, 'min'], [`${a * 60} s = ? min`, a, 'min'], [`${a} l = ? dl`, a * 10, 'dl'],
      ]);
    }
    if (kind === 'fraction') { const d = r(2, 10), n = d * r(2, 12); return [sl ? `Koliko je 1/${d} od ${n}?` : `What is 1/${d} of ${n}?`, n / d, '']; }
    const a = r(12, 80), b = r(5, 60);
    return pick([[`${a} + □ = ${a + b}`, b, ''], [`□ − ${b} = ${a}`, a + b, '']]);
  }

  // Ena majhna kartica na igralca. Igra med reševanjem teče naprej (v dvoje) – odmor je nemoteč.
  // card: {ctl, slot, reward, rewardName, text, answer, unit, nd, digits, cursor, tries, done, ok, msg, shake, t, endT}
  const shape = t => t.replace(/[\d□]+/g, '#').slice(0, 24);   // same kind of question, whatever the numbers
  function card(p, lang, theme, avoid, grade) {
    let qq;
    for (let k = 0; k < 20; k++) { qq = makeQuestion(lang, theme, grade); if (!avoid || shape(qq[0]) !== shape(avoid)) break; }
    const [text, answer, unit] = qq;
    const nd = Math.max(2, String(answer).length + 1);
    return { ...p, lang, theme, grade, text, answer, unit, nd, digits: new Array(nd).fill(0), cursor: nd - 1, tries: 0, done: false, ok: false, msg: '', shake: 0, t: 0, endT: 0 };
  }
  const value = c => +c.digits.join('');
  function typeDigit(c, d) {
    if (!c || c.done) return;
    c.digits = [...c.digits.slice(1), d];
    c.cursor = c.nd - 1;
  }
  // returns true once the card is finished and its result has been shown for a moment
  function update(c, dt, tr, onResult) {
    c.t += dt;
    c.shake = Math.max(0, c.shake - dt);
    if (c.done) { c.endT += dt; return c.endT > 1.4; }
    const i = c.ctl;
    if (Ctl.repeat(i, 'left')) { c.cursor = (c.cursor + c.nd - 1) % c.nd; Snd.play('move'); }
    if (Ctl.repeat(i, 'right')) { c.cursor = (c.cursor + 1) % c.nd; Snd.play('move'); }
    if (Ctl.repeat(i, 'up')) { c.digits[c.cursor] = (c.digits[c.cursor] + 1) % 10; Snd.play('move'); }
    if (Ctl.repeat(i, 'down')) { c.digits[c.cursor] = (c.digits[c.cursor] + 9) % 10; Snd.play('move'); }
    if (Ctl.pressed(i, 'a') && c.t > 0.25) {
      if (value(c) === c.answer) { c.done = c.ok = true; c.msg = tr('qOk'); Snd.play('qok'); onResult(c); }
      else {
        c.tries++; c.shake = 0.4; Snd.play('deny');
        if (c.tries >= TRIES) { c.done = true; c.msg = `${tr('qAns')} ${c.answer}${c.unit ? ' ' + c.unit : ''}.`; Snd.play('qno'); onResult(c); }
        else c.msg = `${tr('qWrong')} ${TRIES - c.tries}×`;
      }
    }
    return false;
  }

  const TITLES = {
    meadow: ['Polnočni matematični odmor', 'Midnight maths break'],
    snow: ['Ledeni matematični odmor', 'Frosty maths break'],
    cave: ['Matematični odmor v kripti', 'Maths break in the crypt'],
    dusk: ['Bučni matematični odmor', 'Pumpkin maths break'],
    christmas: ['Božični matematični odmor', 'Christmas maths break'],
    winter: ['Zimski matematični odmor', 'Winter maths break'],
    easter: ['Velikonočni matematični odmor', 'Easter maths break'],
    beach: ['Matematični odmor na plaži', 'Maths break on the beach'],
    pool: ['Matematični odmor ob bazenu', 'Poolside maths break'],
    school: ['Šolski matematični odmor', 'School maths break'],
  };
  // small hand-inked emblem of the level's theme (screen px), gently bobbing
  function emblem(ctx, theme, cx, cy, s, seed, t) {
    if (typeof Art === 'undefined') return;
    cy += Math.sin(t * 2 + seed) * s * 0.06;
    const lw = Math.max(1.2, s * 0.09), amp = s * 0.035;
    ctx.save();
    if (theme === 'meadow') {        // tombstone with a cross
      const p = [cx - s * 0.5, cy + s * 0.65, cx - s * 0.5, cy - s * 0.15];
      for (let i = 1; i < 8; i++) { const a = Math.PI + i / 8 * Math.PI; p.push(cx + Math.cos(a) * s * 0.5, cy - s * 0.15 + Math.sin(a) * s * 0.5); }
      p.push(cx + s * 0.5, cy - s * 0.15, cx + s * 0.5, cy + s * 0.65);
      Art.shape(ctx, p, '#5c4e58', lw, amp, seed);
      Art.line(ctx, [cx, cy - s * 0.4, cx, cy + s * 0.2], lw * 0.8, amp, seed + 9);
      Art.line(ctx, [cx - s * 0.22, cy - s * 0.18, cx + s * 0.22, cy - s * 0.18], lw * 0.8, amp, seed + 19);
      Art.line(ctx, [cx - s * 0.75, cy + s * 0.68, cx + s * 0.75, cy + s * 0.66], lw, amp, seed + 29, '#34503e');
    } else if (theme === 'snow') {   // snowflake
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3 + t * 0.3, dx = Math.cos(a) * s * 0.6, dy = Math.sin(a) * s * 0.6;
        Art.line(ctx, [cx - dx, cy - dy, cx + dx, cy + dy], lw, amp, seed + i * 7, '#cfe6ff');
        for (const sg of [-1, 1]) {
          const bx = cx + sg * dx * 0.6, by = cy + sg * dy * 0.6;
          for (const o of [-0.6, 0.6]) {
            const b2 = a + (sg > 0 ? 0 : Math.PI) + Math.PI * o;
            Art.line(ctx, [bx, by, bx + Math.cos(b2) * s * 0.2, by + Math.sin(b2) * s * 0.2], lw * 0.7, amp, seed + i * 13 + o * 5 + sg, '#cfe6ff');
          }
        }
      }
    } else if (theme === 'cave') {   // bat with yellow eyes
      const f = Math.sin(t * 9 + seed) * s * 0.18;
      Art.shape(ctx, [cx - s * 0.2, cy - s * 0.1, cx - s * 0.75, cy - s * 0.3 + f, cx - s * 0.6, cy + s * 0.05 + f * 0.5, cx - s * 0.4, cy, cx - s * 0.25, cy + s * 0.2,
        cx, cy + s * 0.3, cx + s * 0.25, cy + s * 0.2, cx + s * 0.4, cy, cx + s * 0.6, cy + s * 0.05 + f * 0.5, cx + s * 0.75, cy - s * 0.3 + f, cx + s * 0.2, cy - s * 0.1,
        cx + s * 0.15, cy - s * 0.35, cx, cy - s * 0.2, cx - s * 0.15, cy - s * 0.35], '#4e2a62', lw, amp, seed, { seg: s * 0.2 });
      ctx.fillStyle = '#ffd75a';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sx * s * 0.08, cy - s * 0.02, s * 0.05, 0, 7); ctx.fill(); }
    } else if (theme === 'christmas') {   // wrapped present with a bow
      Art.shape(ctx, [cx - s * 0.55, cy - s * 0.15, cx + s * 0.55, cy - s * 0.15, cx + s * 0.5, cy + s * 0.65, cx - s * 0.5, cy + s * 0.65], '#8a2a3a', lw, amp, seed);
      Art.line(ctx, [cx, cy - s * 0.15, cx, cy + s * 0.65], lw * 1.3, amp, seed + 3, '#e8c860');
      Art.ell(ctx, cx - s * 0.2, cy - s * 0.32, s * 0.2, s * 0.14, '#e8c860', lw * 0.7, amp, seed + 5, { n: 8 });
      Art.ell(ctx, cx + s * 0.2, cy - s * 0.32, s * 0.2, s * 0.14, '#e8c860', lw * 0.7, amp, seed + 6, { n: 8 });
    } else if (theme === 'winter') {      // snowman
      Art.ell(ctx, cx, cy + s * 0.35, s * 0.42, s * 0.36, '#e4ecf6', lw, amp, seed, { n: 12 });
      Art.ell(ctx, cx, cy - s * 0.2, s * 0.3, s * 0.27, '#e4ecf6', lw, amp, seed + 2, { n: 12 });
      Art.shape(ctx, [cx - s * 0.3, cy - s * 0.42, cx + s * 0.3, cy - s * 0.42, cx + s * 0.2, cy - s * 0.48, cx + s * 0.2, cy - s * 0.8, cx - s * 0.2, cy - s * 0.8, cx - s * 0.2, cy - s * 0.48], '#1a1220', lw * 0.7, amp, seed + 4);
      Art.shape(ctx, [cx + s * 0.05, cy - s * 0.2, cx + s * 0.4, cy - s * 0.16, cx + s * 0.05, cy - s * 0.12], '#e07a2a', lw * 0.5, amp * 0.5, seed + 6, { double: false });
    } else if (theme === 'easter') {      // painted egg
      Art.ell(ctx, cx, cy + s * 0.05, s * 0.45, s * 0.6, '#e88aa8', lw, amp, seed, { n: 14 });
      Art.line(ctx, [cx - s * 0.42, cy - s * 0.05, cx - s * 0.2, cy - s * 0.2, cx, cy - s * 0.05, cx + s * 0.2, cy - s * 0.2, cx + s * 0.42, cy - s * 0.05], lw * 0.8, amp, seed + 3, '#fff4c0');
      Art.line(ctx, [cx - s * 0.4, cy + s * 0.25, cx + s * 0.4, cy + s * 0.25], lw * 0.8, amp, seed + 4, '#8ad0e8');
    } else if (theme === 'beach') {       // scallop shell
      const p = [cx, cy + s * 0.55];
      for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI, rr = s * (0.55 + (i % 2) * 0.06); p.push(cx + Math.cos(a) * rr, cy + s * 0.1 + Math.sin(a) * rr); }
      Art.shape(ctx, p, '#f0c8a8', lw, amp, seed);
      for (let i = 1; i < 5; i++) { const a = Math.PI + i / 5 * Math.PI; Art.line(ctx, [cx, cy + s * 0.5, cx + Math.cos(a) * s * 0.5, cy + s * 0.1 + Math.sin(a) * s * 0.5], lw * 0.5, amp, seed + i, '#c08060'); }
    } else if (theme === 'pool') {        // lifebuoy
      ctx.lineWidth = s * 0.28;
      for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? '#d04040' : '#f4f0e0'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.45, t * 0.5 + i * Math.PI / 2, t * 0.5 + (i + 1) * Math.PI / 2); ctx.stroke(); }
      Art.ell(ctx, cx, cy, s * 0.6, s * 0.6, null, lw * 0.7, amp, seed, { n: 14 }); Art.ell(ctx, cx, cy, s * 0.3, s * 0.3, null, lw * 0.7, amp, seed + 3, { n: 12 });
    } else if (theme === 'school') {      // pencil
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.6);
      Art.shape(ctx, [-s * 0.7, -s * 0.16, s * 0.4, -s * 0.16, s * 0.4, s * 0.16, -s * 0.7, s * 0.16], '#e8b830', lw, amp, seed);
      Art.shape(ctx, [s * 0.4, -s * 0.16, s * 0.75, 0, s * 0.4, s * 0.16], '#e8c8a0', lw, amp, seed + 2);
      Art.shape(ctx, [-s * 0.85, -s * 0.16, -s * 0.7, -s * 0.16, -s * 0.7, s * 0.16, -s * 0.85, s * 0.16], '#e88aa8', lw, amp, seed + 4);
      ctx.restore();
    } else {                         // glowing jack-o'-lantern
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 1.1);
      g.addColorStop(0, 'rgba(255,150,40,0.35)'); g.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - s * 1.2, cy - s * 1.2, s * 2.4, s * 2.4);
      Art.ell(ctx, cx - s * 0.28, cy + s * 0.1, s * 0.38, s * 0.45, '#c8641a', lw, amp, seed);
      Art.ell(ctx, cx + s * 0.28, cy + s * 0.1, s * 0.38, s * 0.45, '#c8641a', lw, amp, seed + 3);
      Art.ell(ctx, cx, cy + s * 0.1, s * 0.4, s * 0.5, '#e07a1f', lw, amp, seed + 6);
      Art.line(ctx, [cx, cy - s * 0.38, cx + s * 0.08, cy - s * 0.6], lw * 1.3, amp, seed + 8, '#4a5a2a');
      const fl = 0.75 + Math.sin(t * 13 + seed) * 0.25;
      ctx.fillStyle = `rgba(255,${200 + 40 * fl | 0},90,${fl})`;
      for (const sx of [-1, 1]) Art.shape(ctx, [cx + sx * s * 0.2, cy - s * 0.1, cx + sx * s * 0.08, cy + s * 0.08, cx + sx * s * 0.32, cy + s * 0.08], ctx.fillStyle, lw * 0.6, amp * 0.5, seed + sx + 20);
      Art.shape(ctx, [cx - s * 0.28, cy + s * 0.2, cx - s * 0.1, cy + s * 0.3, cx, cy + s * 0.22, cx + s * 0.1, cy + s * 0.3, cx + s * 0.28, cy + s * 0.2, cx, cy + s * 0.42], ctx.fillStyle, lw * 0.6, amp * 0.5, seed + 30);
    }
    ctx.restore();
  }

  function wrapLines(ctx, txt, maxW) {
    const words = txt.split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    return lines;
  }
  // draw: helpers from main.js (text, rrect, font), u = screen px per world unit, area = world rect on screen
  // compact card in a corner of the field (screen px); x,y top-left, w,h size
  function draw(ctx, c, x, y, w, h, hp) {
    const { u, text, rrect, font, tr, PCOL, PCOL_D, keys } = hp;
    const pop = Math.min(1, c.t / 0.18), sh = c.shake > 0 ? Math.sin(c.shake * 60) * 4 * u : 0;
    ctx.save();
    ctx.globalAlpha = pop;
    rrect(x, y, w, h, 10 * u, 'rgba(22,15,30,0.94)', PCOL[c.slot], 2.5 * u);
    emblem(ctx, c.theme, x + 16 * u, y + 14 * u, 10 * u, 5 + c.slot, c.t);
    const tt = TITLES[c.theme];
    text(tt ? tt[c.lang === 'en' ? 1 : 0] : tr('qTitle'), x + 30 * u, y + 13 * u, 8.5 * u, '#ffb860', 'left', 700);
    text(c.tag !== undefined ? c.tag : `+1 ${c.rewardName}`, x + w - 10 * u, y + 13 * u, 7.5 * u, PCOL_D[c.slot], 'right', 600);
    ctx.font = font(10.5 * u, 600);
    const lines = wrapLines(ctx, c.text, w - 20 * u).slice(0, 3);
    const ly = y + 38 * u - (lines.length - 1) * 6.5 * u;
    lines.forEach((l, i) => text(l, x + w / 2, ly + i * 13 * u, 10.5 * u, '#efe3c4', 'center', 600));
    const bw = 22 * u, bg = 5 * u, tw = c.nd * bw + (c.nd - 1) * bg, sx = x + w / 2 - tw / 2 + sh, by = y + 72 * u, bh = 30 * u;
    for (let i = 0; i < c.nd; i++) {
      const bx = sx + i * (bw + bg), sel = i === c.cursor && !c.done;
      rrect(bx, by, bw, bh, 5 * u, sel ? '#3d2f4a' : '#221a2a', sel ? PCOL[c.slot] : '#4a3a58', (sel ? 2.5 : 1.2) * u);
      text(String(c.digits[i]), bx + bw / 2, by + bh / 2, 19 * u, '#efe3c4', 'center', 600);
      if (sel) {
        ctx.fillStyle = PCOL[c.slot];
        for (const [yy, d] of [[by - 3 * u, -1], [by + bh + 3 * u, 1]]) { ctx.beginPath(); ctx.moveTo(bx + bw / 2 - 5 * u, yy); ctx.lineTo(bx + bw / 2 + 5 * u, yy); ctx.lineTo(bx + bw / 2, yy + d * 6 * u); ctx.fill(); }
      }
    }
    if (c.unit) text(c.unit, sx + tw + 6 * u, by + bh / 2, 10.5 * u, '#efe3c4', 'left', 600);
    if (c.done) text(`${c.ok ? '✔' : '✖'} ${c.msg}`, x + w / 2, y + h - 22 * u, 10 * u, c.ok ? '#7ee07a' : '#ff6a5a', 'center', 700);
    else {
      if (c.msg) text(c.msg, x + w / 2, y + h - 26 * u, 8.5 * u, '#ff6a5a', 'center', 700);
      text(`${tr('qKeys')} · ${keys.close}`, x + w / 2, y + h - 11 * u, 6.8 * u, '#9a8a9a', 'center', 600);
    }
    ctx.restore();
  }
  // small, quiet offer badge: "RT – račun za +1"
  function badge(ctx, theme, x, y, w, h, slot, t, label, hp) {
    const { u, text, rrect, PCOL } = hp;
    const pulse = 0.75 + 0.25 * Math.sin(t * 3);
    ctx.save();
    ctx.globalAlpha = pulse;
    rrect(x, y, w, h, h / 2, 'rgba(22,15,30,0.88)', PCOL[slot], 1.8 * u);
    ctx.globalAlpha = 1;
    emblem(ctx, theme, x + h / 2 + 2 * u, y + h / 2, h * 0.36, 11 + slot, t);
    text(label, x + h + 4 * u, y + h / 2, 8 * u, '#f5e6c8', 'left', 600);
    ctx.restore();
  }
  return { card, update, draw, badge, typeDigit, makeQuestion, TITLES };
})();
