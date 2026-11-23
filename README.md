# Tapkači / Pitterpats

Co-op puzzle game for two players with Xbox controllers: guide a crowd of little wanderers from the balloon to their house.
Two players, two cursors (P1 blue, P2 orange) and **one shared set of tools**: either player can use any tool at any time, and both draw from the same counts – so talk about who uses what. The HUD shows the shared tool bar in the middle; each slot is framed in the colour of the player who has it selected.

**Run:** open `index.html` in Chrome or Firefox (no server needed), or `python3 -m http.server` and open it.
On the title screen each player presses **A** on their own controller (first = P1). Duplicate virtual pads (xboxdrv) are ignored, same as in the train game.
One player only? Just press A to continue.

## Controls
| | Controller | P1 keyboard | P2 keyboard |
|---|---|---|---|
| move cursor | left stick | WASD | arrows |
| use tool on creature | A | Space | Enter |
| choose tool | LB / RB, d-pad ◀ ▶ | Q / E | Delete / PageDown |
| release a stopper | B | C | Backspace |
| precise cursor | LT or X (hold) | left Shift | right Shift |
| fast forward | Y | F | End |
| pause | Start | Esc | P |

The cursor starts slow and speeds up the longer you hold a direction (full speed after ~1.4 s); turning sharply or letting go makes it slow again.

M toggles music. Language (SL/EN) and music are switched on the title screen with Y / X.

## Videz in glasba
Nočni, ročno narisan slog: črnilne obrobe se rahlo »kuhajo« (tresejo) kot v risanki, temne barve, luna, zviti drevesi, nagrobniki, netopirji.
Ozadja (10): pokopališče, ledena noč, kripta, bučna noč ter božična noč (okrašene jelke, darila, sneženje), zima (sneženi možje, breze, sneženje), velika noč (pirhi, zajčki, kresnice), plaža (morje z mesečino, palme, pesek), bazen (ploščice, kopališče, skakalni stolp, lučke) in šola ob polnoči (opeka, ura v stolpu, ograja iz svinčnikov). Vsako ima tudi svoj tematski matematični odmor. Pisave: Eater (logo), Mystery Quest (naslovi), Caveat Brush (besedilo) – vse s šumniki.
Glasba je sintetizirana (`js/audio.js`): valček v d-molu na naslovnici, štiri različne skladbe za stopnje (prikradeni marš, glasbena skrinjica s teremin, pokopališki tango, kromatično plazenje) in tiktakajoča ura med matematičnim odmorom. Inštrumenti: glasbena skrinjica, tuba, pizzicato, koščeni ksilofon, teremin, zbor, harmonika.

## Matematični odmor po vsaki stopnji
Ko stopnjo uspešno rešita, sledi kratek odmor: vsak igralec dobi svoj račun na veliki kartici (ena kartica, če igraš sam). Ko sta oba končana (pravilno ali po 3 poskusih), gre igra s pritiskom A (ali sama čez 2,5 s) na zaslon z rezultatom. Vklop/izklop skupaj z odmorom med igro (meni premora).

**Težavnost za vsakega igralca posebej** – izbere se ob vsakem zagonu igre na naslovnem zaslonu. Oba igralca imata privzeto **4.–5. razred**; tisti, ki želi lažje račune, po pridružitvi pritisne LB/RB (tipkovnica Q/E oz. Delete/PageDown) in dobi **2. razred**, drugi pa samodejno ostane na višjem. Če pritisne še drugi igralec, nižji razred preide nanj. Ponoven pritisk istega igralca ga vrne na 4.–5. razred.
- **4.–5. razred** – računi kot doslej;
- **2. razred** (opravljen 2. razred OŠ): seštevanje in odštevanje do 100 (tudi čez desetico), poštevanka 2, 3, 4, 5 in 10 ter deljenje, manjkajoči seštevanec, dvakratnik in polovica, m/dm/cm, ura/minute, evri in tematske besedilne naloge (»Na levi je 42 pirhov, na desni 28 pirhov …«).

Izbira velja tudi za račune med igro. Igra si je ne zapomni – ob naslednjem zagonu se izbere znova.

## Matematični odmor med igro (nemoteč)
Igra se nikoli sama ne ustavi. V vsaki stopnji: po 12 s (P2 po 17 s) in nato 60 s po vsakem rešenem računu se v igralčevem spodnjem kotu prižge majhna značka »RT · račun za +1« z mehkim zvončkom. Igralec jo odpre, ko mu ustreza (kontroler: RT ali View; tipkovnica: P1 R, P2 PageUp). Kartica se odpre na drugi polovici zaslona, kot je igralčev kurzor, da ne zakrije dogajanja. V dvoje igra in soigralec med reševanjem tečeta naprej; ko igraš sam, igra počaka, dokler je kartica odprta. B (ali ponovno RT) kartico odloži – ob ponovnem odprtju je isti račun. Vnos: gor/dol številka, levo/desno premik, A potrdi (ali vtipkaj števke: P1 zgornja vrsta, P2 številčnica). Pravilen odgovor = +1 orodja, izbranega ob odprtju; po 3 napačnih se pokaže rešitev. Vklop/izklop v meniju premora (Start).

Odmor je tematski: naslov, okraski (nagrobnik, snežinka, netopir, buča, darilo, sneženi mož, pirh, školjka, rešilni obroč, svinčnik) in večina besedilnih nalog so vezani na vzdušje stopnje – pokopališče, ledena noč, kripta, bučna noč, božič, zima, velika noč, plaža, bazen ali šola (npr. »V kripti visi 7 jat netopirjev …«). Igralca nikoli ne dobita iste vrste naloge.

## Tools
Classic: Climber · Floater (leaf parachute) · Stopper · Builder (12-step stairs) · Basher (horizontal tunnel) · Digger (down) · Miner (diagonal down).

**Every level offers all 27 tools**: the level's own tools (shown on the level card, first in the tool bar) with the counts the puzzle needs, plus 3 of every other tool. The tool bar shows 9 slots and scrolls with LB/RB (‹ › mark more; an orange line separates the level's tools from the extras).

Tribe tools, one of each kind of ability, with our own names and drawings:
| | SL | what it does |
|---|---|---|
| Runner | Tekač | walks twice as fast, for good (beat the clock) |
| Jumper / Hopper / Pole Vaulter | Skakač / Žabec / Palični skakač | one jump (~20 px high, 45 px far) / 12 small hops / one huge vault (~45 px high) |
| Slider | Drsalec | slides down any wall face without fall damage, for good |
| Glider | Jadralec | glides 2 px forward per 1 px down instead of falling, for good |
| Balloonist | Balonar | rises up to 80 px drifting forward, then the balloon pops and it floats down |
| Jetpacker | Raketar | climbs a little and flies level for 200 px |
| Swimmer | Plavalec | swims instead of drowning and climbs out on the far bank (up to 12 px), for good |
| Bomber | Bombaš | plants a pumpkin bomb and walks on; after ~3 s it blasts a crater (nobody gets hurt) |
| Bazooka / Mortar | Bazukaš / Topničar | fires a rocket straight ahead / lobs a shell ~100 px; both blast a hole where they hit |
| Laser | Laserist | burns a 45° tunnel up and forward (90 px) |
| Fencer | Mečevalec | tunnels forward and gently upward (1 up per 2 across) |
| Spearer | Kopjanik | throws a spear that sticks in the next wall as a 24 px plank pointing back – a bridge over a crack |
| Stacker | Zidar | builds a 16 px wall in front (everyone turns there) |
| Platformer | Mostar | builds a flat bridge (12 planks, ~50 px) |
| Filler | Peskar | pours sand that piles up and fills pits |
| Musician | Godec | plays for 6 s; everyone within 40 px stops to dance |
| Monkey | Opica | grabs a ceiling up to 16 px above the head and swings along it until it ends |

Falls higher than 60 px are fatal, steel cannot be dug or blasted, water drowns (except swimmers).

## Levels
50 levels: 1–14 classic tools, 15–26 the tribe tools in the six new settings, 27–50 obstacle courses that chain two or three tested obstacles (built from segments, every one checked by `node tools/test.js`). The level select is a 10 × 5 grid; the chosen level's name, tools and goal are shown below it.

## Development
- `node tools/test.js` – plays every level with its scripted solution (`solution` in `js/levels.js`) and checks it is winnable, and that doing nothing loses. Add `-v` for an action log, or a level index (0-based).
- `python3 tools/serve.py` – local server on http://localhost:8765/ that forbids browser caching (a plain `python3 -m http.server` lets the browser keep old js files, which mixes old and new code after an update).
- `node tools/smoke.js [--quick]` – runs the whole game in node (fake canvas, ~2–3 min) and presses keys through the title, level select, intro, play, maths card, pause menu and a result screen for every level, then plays every level's solution and draws every pose, rocket, bomb and background; any error fails it.
- `index.html#lv5` – jump straight into level 5 (`-coop` joins both players, `-auto` lets the scripted solution play, `-ff30` fast-forwards 30 s, `#all` unlocks all levels, `#select` opens the level select, `-quiz` opens the maths break immediately).
- `js/sim.js` simulation (no DOM), `js/levels.js` levels, `js/art.js` drawing, `js/input.js` controllers (from the train game), `js/main.js` screens + HUD.
