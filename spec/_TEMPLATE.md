---
id: FEAT-EXAMPLE
title: Krátký název, 1–3 slova
type: feature
status: draft
parent: SPEC-ROUTER
depends_on: []
tags: []
summary: Jedna věta, co tahle spec pokrývá. Musí dávat smysl i vytržená z kontextu.
updated: 2026-09-19
---

# Krátký název

> Kopii tohohle souboru pojmenuj podle obsahu velkými písmeny — `BUILDING.md`,
> `TIME.md`, `MCP-ACTIONS.md` — a ulož do složky podle `type`.
> Pak **přidej řádek do `SPEC/SPEC.md`**, jinak spec neexistuje.

## Účel

Proč tahle část existuje a jaký problém řeší. Dva až čtyři řádky.
Ne popis řešení — ten je níž.

## Rozsah

**Patří sem:** co tahle spec pokrývá.

**Nepatří sem:** co je sice blízko, ale řeší to jiná spec — a která.
Tenhle odstavec je důležitější, než vypadá; bez něj se specy začnou překrývat.

## Chování

Jak se to chová. Pravidla, kroky, stavy. Pište v přítomném čase a konkrétně:
„Když X, stane se Y," ne „mělo by se zvážit Z".

## Data

Entity a jejich pole, která tahle spec zavádí nebo mění. Jen tvar, ne SQL —
konkrétní úložiště je věc `architecture/`.

## Rozhraní

Co z tohohle používají ostatní specy: akce, události, veřejné hodnoty.
Tohle je smluvní část — změna tady je změna pro všechny v `depends_on`.

## Jak se pozná, že to platí

Kritéria, podle kterých se dá říct, že je tahle část hotová a chová se, jak
je psáno. U **každého** stojí, **kdo ho provede a čím**:

```markdown
- Postavička se po `move` objeví v cílové místnosti do jednoho tiku.
  — *ověří:* server-test `test_move_arrives` · *kde:* `backend/tests/`
- Odkrytý řez ukazuje právě jedno patro.
  — *ověří:* člověk na běžícím klientovi · *jak:* projít tři budovy nad sebou
```

**Kritérium, které nikdo neprovede, je mrtvý text.** Věta, co si ho nikdo
nevezme, do specifikace nepatří — buď se k ní najde vykonavatel, nebo zůstává
otevřenou otázkou. Podepsaná věta, kterou nikdy nikdo nespustil, vypadá roky
jako splněná.

## Okrajové případy

Co se stane, když je prázdno, plno, když to selže, když to někdo udělá dvakrát,
když se to přeruší uprostřed.

## Otevřené otázky

Jedna odrážka na otázku, a u každé **kdo ji rozhodne** a **od kdy visí**.
Bez toho se seznam po pár kolech změní v hromadu, ve které se nepozná, co čeká
na člověka a co na práci:

```markdown
- [ ] Kolik věcí postavička unese?
      — *rozhodne:* člověk · *visí od:* 2026-09-20
- [ ] **Naléhavé.** Jak rychle tiká dřímající svět — 1 s, nebo 1 min?
      — *rozhodne:* člověk · *visí od:* 2026-09-22 · *blokuje:* ADR-232, ADR-142
```

**Naléhavé** je pro to, co blokuje MVP nebo si odporuje s něčím zapsaným.
Ostatní otázky značku nemají; kdyby ji měly všechny, nemá ji žádná.

Dokud tu něco je, spec nemůže mít `status: agreed`.

**Tři stavy, tři zápisy.** Nezaměňuj je — každý se příště řeší jinak:

```markdown
- [ ] Kolik věcí postavička unese?          ← díra: nikdo nic nenavrhl

> **[NEPOTVRZENO]** Návrh: strop je 5 věcí. ← návrh, ale je můj

> **[PŘEDBĚŽNÉ]** Strop je 5 věcí.          ← člověk to zvolil, ale ne natvrdo
```

U `[NEPOTVRZENO]` se příště začíná od nuly; u `[PŘEDBĚŽNÉ]` už směr někdo
zvolil a ptá se jen, jestli to platí. Obě značky brání `status: agreed`.

## Rozhodnutí

Odkazy na `decisions/` u věcí, kde se vybíralo mezi variantami.

---

## Pole v hlavičce

| Pole | Povinné | Význam |
|---|---|---|
| `id` | ano | Unikátní, `PREFIX-NAZEV`. Nikdy se nemění — cituje se v `depends_on`. |
| `title` | ano | Lidský název. |
| `type` | ano | `feature` / `architecture` / `decision` |
| `status` | ano | `draft` → `review` → `agreed` → `superseded` |
| `parent` | ano | `id` nadřazené spec, nebo `SPEC-ROUTER` u kořenových. |
| `depends_on` | ano | Seznam `id`, bez kterých tahle spec nedává smysl. Prázdné `[]` je platné. |
| `tags` | ne | Volné štítky pro hledání napříč stromem (`world`, `mcp`, `ui`, `time`). |
| `summary` | ano | Jedna věta. Tahle věta se kopíruje do routeru. |
| `updated` | ano | Datum poslední věcné změny, `RRRR-MM-DD`. |

### Prefixy podle typu

| Typ | Prefix | Složka | Co tam patří |
|---|---|---|---|
| `feature` | `FEAT-` | `features/` | Co ve světě je a co se s tím děje — pravidla, chování, ovládání |
| `architecture` | `ARCH-` | `architecture/` | Čím je to postavené — vrstvy, procesy, úložiště, protokoly |
| `decision` | `ADR-` | `decisions/` | Jedno rozhodnutí: varianty, co vyhrálo a proč |

### Featura vs. architektura

Dvě osy. Rozdíl je v otázce, na kterou spec odpovídá:

| | Odpovídá na | Příklad |
|---|---|---|
| `FEAT-*` | **Co to je, jaká pravidla platí a co s tím kdo dělá** | Budova má patra; místnost má kapacitu; kdo vejde do plné, dostane důvod |
| `ARCH-*` | **Čím** je to postavené | Kterým enginem se to kreslí, kde leží stav, jak vypadá MCP přenos |

Featura drží **jedno téma celé** — co to je, jak se to chová, jak se to ovládá
a co z toho kdo vidí. Nerozděluje se na „pojem" a „použití", to jsou dvě půlky
téhož a rozdělené se rozejdou.

Architektura o featurách ví, featury o architektuře ne. Featura popisuje, že
postavička je vždy právě v jedné místnosti; že to drží tabulka v Postgresu,
do ní nepatří.

**Test, když váháš:** kdybys vyměnil celý stack, zůstala by ta věta pravdivá?
Ano → `FEAT-*`. Ne → `ARCH-*`.

### Status

- **`draft`** — píše se, nespoléhej na to
- **`review`** — hotové, čeká na přečtení
- **`agreed`** — platí; podle tohohle se staví. Žádné otevřené otázky.
- **`superseded`** — nahrazeno; v hlavičce přibude `superseded_by: <id>`

### Závislosti

`depends_on` míří **nahoru a do stran**, nikdy zpět dolů na vlastní potomky.
Vznikne-li cyklus, jsou to ve skutečnosti jedna spec, nebo chybí třetí.

Změníš-li `## Rozhraní`, projdi všechny specy, které tuhle mají v `depends_on`,
a zkontroluj, jestli pořád platí.

**A pak druhý směr, na který se zapomíná:** co si ostatní berou z téhle spec,
aniž by to bylo v `## Rozhraní`. Chová-li se někdo podle věty ze sekce
`## Chování`, je to nepsaná závislost — buď ji dopiš do rozhraní, nebo mu ji
vezmi. Seznam „kdo mě má v `depends_on`" ji neukáže; ta chyba se pozná až
tím, že se rozbije něco, co si nikdo nesliboval.

### Čísla jsou sliby

Každé číslo v spec — strop, tempo, cena, sazba, prodleva, zaokrouhlení — je
slib a **dopočítá se dřív, než se napíše**, a to na obou koncích: co dělá při
nule, při jedné, při stropu, po dni běhu.

**Dvě zapsaná čísla, která si na kraji odporují, jsou chyba specifikace, ne
implementace.** Poznat se to má tady, ne na tom, že se to nedá postavit.
Mění-li se číslo, projdi ta, která se od něj odvozují, a hlavně **měření, která
s ním počítala** — to staré měření neplatí a musí se říct nahlas.

### Co spec neříká

**Mlčení není zamítnutí.** Chybí-li v spec téma, znamená to, že se jím nikdo
nezabýval — ne že ve světě nebude. Zamítnutí se píše naplno, s důvodem, a patří
do ADR nebo do sekce „Co v MVP vědomě chybí" v routeru.

Proto se do spec nepíše „tohle nepotřebujeme" o věci, o které nikdo
nerozhodoval. Buď se to rozhodne, nebo se to zapíše jako otevřená otázka.
