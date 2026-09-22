---
name: specify
description: Posouvá specifikaci v SPEC/ o kus dál — zjistí, co chybí a co je nepotvrzené, a formou otázek a odpovědí to s člověkem dorozhodne. Použij při /specify (pokračuj tam, kde je největší díra) nebo /specify <oblast> (zaměř se na ni, např. /specify Budovy).
---

# specify

Jedno kolo specifikace. Zjisti, co chybí, zeptej se člověka, zapiš rozhodnutí.

**Pravidlo, které se neporušuje: nic nerozhoduješ sám.** Každé rozhodnutí buď
potvrdí člověk, nebo zůstane v textu označené `[NEPOTVRZENO]`. Nikdy nenapíšeš
do spec větu, která zní jako platná, ale ve skutečnosti sis ji vymyslel.

## Krok 0 — Načti stav

```
cd <korenovy adresar projektu>
cat SPEC/SPEC.md                 # router: co existuje a v jakém stavu
cat SPEC/_TEMPLATE.md            # konvence, pole v hlavičce, prefixy
ls SPEC/features SPEC/architecture SPEC/decisions
cat NOTES.md 2>/dev/null         # surové zadání a nezařazené otázky
```

Pak přečti **všechny** specy a všechna ADR. Bez celého obrazu se ptáš na věci,
které jsou dávno rozhodnuté — a to je ta nejhorší věc, kterou tenhle skill umí.

## Krok 1 — Audit: co chybí a co nesedí

Projdi a vypiš si:

1. **`[NEPOTVRZENO]`** — kde jsou a čeho se týkají
2. **Otevřené otázky** — nezaškrtnuté `- [ ]` napříč specy
3. **Chybějící specy** — `id`, na které se odkazuje v `depends_on` nebo v sekci
   *Rozsah → Nepatří sem*, ale soubor neexistuje
4. **Prázdná místa** — spec, která má sekci `## Data` nebo `## Rozhraní` prázdnou
   nebo jen obecnou
5. **Rozpory** — dvě specy tvrdí něco neslučitelného, nebo spec odporuje zadání
   v `NOTES.md`
6. **Zastaralý router** — spec existuje a v routeru není, nebo `summary` nesedí

Rozpor se zadáním **řekni nahlas hned**, ne až na konci. Je to nejdražší druh chyby.

## Krok 2 — Vyber ohnisko

**Dostal-li jsi argument** (`/specify Budovy`), řeš tu oblast. Dohledej příslušnou
spec; neexistuje-li, tohle kolo ji založí.

**Bez argumentu** vyber to, co **blokuje nejvíc ostatního**. Pořadí zhruba:

1. rozpor se zadáním nebo mezi specy
2. chybějící spec, na kterou se odkazují jiné
3. `[NEPOTVRZENO]` v místě, na kterém staví další rozhodnutí
4. otevřené otázky v `agreed`-kandidátech
5. prázdné `## Rozhraní` u spec, na které někdo závisí

Řekni jednou větou, co jsi vybral a proč, ať to člověk může přesměrovat.

## Krok 3 — Ptej se

**Použij skill `ask`**, ne `AskUserQuestion`. Rozhodnutí v tomhle projektu stojí
na tom, co která varianta stojí a co ruší — a to se do čtyř variant s krátkým
popiskem nevejde. `ask` otevře stránku, která zůstane otevřená celé kolo, takže
se dá k otázce vrátit, doposlat k ní výklad a nechat člověka něco nakreslit.

**Tři až šest otázek na kolo.** Strop je dvacet, ale to je strop, ne cíl; po
prvních odpovědích se kontext stejně změní.

Dobrá otázka do tohohle projektu:

- **je o jednom rozhodnutí**, ne o pěti naráz
- má **varianty, které se opravdu vylučují**
- u každé varianty vyplní `opens`, `costs` a `rewrites` — **co to otevře, co to
  stojí a která dřívější rozhodnutí tím padnou**. Je to na tři pole právě proto,
  aby se cena nedala schovat do popisu. Nemá-li varianta cenu, pole vynech; cenu
  si nevymýšlej a skutečnou nezamlčuj.
- má `preview` s konkrétním tvarem (schéma, pseudokód, tvar dat) nebo `svg`,
  jde-li o něco prostorového
- zmiňuje, co varianta **znamená pro MVP** — kolik práce navíc a co se odkládá
- v `unsure` přizná, **čím si u té varianty nejsi jistý ty**

**`depends_on` používej.** Otázka, která dává smysl jen při určité odpovědi, se
má objevit až po ní — a varianta, kterou dřívější odpověď vyloučila, má zmizet.
Jinak člověk prochází stránku voleb, které už neplatí.

**`recommend` je odhad, ne rozhodnutí.** Dej ho tam, kde nějaký opravdu máš,
a důvod napiš do `recommend_why`. Nikdy není předvybraný a nenahrazuje potvrzení.

Nezeptej se na nic, co už je v nějakém ADR rozhodnuté. Narazíš-li na to, že
staré rozhodnutí přestalo dávat smysl, **řekni to** a nabídni ho přehodnotit
(nové ADR se `supersedes`), ne že ho potichu obejdeš.

Nabízej i variantu **„v MVP to nepotřebujeme"**, kdykoli je to reálné. Specifikace
má sklon růst; tohle je jediná protiváha.

### Co dělat s tím, co přijde zpátky

| co přijde | co to znamená | co uděláš |
|---|---|---|
| `explain` | **otázku jsi položil špatně** | vysvětli to a pošli výklad zpátky přes `push` do `notes`; varianty nech být, pokud je výklad sám nezmění |
| `rejected` | **varianty byly špatně** | přeskládej otázku podle toho, co člověk napsal, a pošli ji znovu — neobhajuj seznam, který jsi vymyslel |
| `other` | člověk odpověděl po svém | platná odpověď jako každá jiná — ale **v ADR ji nepřidávej mezi varianty**, viz níž |
| `confidence: tentative` | **není to rozhodnutí**, ale volbu už člověk udělal | zapiš to se značkou `[PŘEDBĚŽNÉ]`, **ne** `[NEPOTVRZENO]` — a příště se ptej „platí to pořád?", ne znovu na směr |
| `sketch` | odpověď je obrázek | přijde jako SVG se souřadnicemi a popisky — **přečti ho**, je to odpověď, ne ozdoba |
| `changed` u něčeho zapsaného | člověk si to rozmyslel | najdi to ADR a přepiš ho; stránka ho varovala, ale opravit to musíš ty |

## Krok 4 — Zapiš

Všechno v jedné změně, ať router nikdy nezastará.

**Za každé potvrzené rozhodnutí** vznikne ADR v `SPEC/decisions/`:

```
ADR-<NNN>-<KRATKY-NAZEV>.md      # NNN = další volné číslo
```

Hlavička podle `_TEMPLATE.md` (`type: decision`, `status: agreed`), tělo:
*Kontext* → *Varianty* (včetně těch, co prohrály, a proč) → *Rozhodnutí* →
*Důsledky*.

**V *Variantách* jsou ty, které jsi nabídl — a jen ty.** Odpověděl-li člověk
po svém (`other`), **nepřipisuj jeho odpověď na seznam, jako by tam byla.**
Napiš nahoru, že vybraná mezi nabídnutými nebyla, nech všechny nabídnuté
i s jejich cenou, a vybranou uveď zvlášť:

```markdown
## Varianty

**Nabídnuté byly tři a vybraná mezi nimi nebyla** — člověk odpověděl po svém:

1. **…** — co to otevíralo a co stálo
2. **…**
3. **…**

**Vybráno: …** — vlastní odpověď, viz *Rozhodnutí*.
```

Je to rozdíl, na kterém záleží: ADR má ukázat, **z čeho se vybíralo**, a taky
to, že nabídka byla vedle. Kdo to čte za rok, jinak uvidí seznam, na kterém
vítěz vypadá jako jedna z připravených možností — a nepozná, že ho nikdo
nenabídl. Důsledky piš poctivě — hlavně to, co tím rozhodnutím **vzniklo
za nový problém**.

**V dotčených specech**: smaž značku `[NEPOTVRZENO]`, zaškrtni otázku, doplň
odkaz `→ ADR-NNN`, aktualizuj `updated`. Posunul-li se stav, změň `status`.

**Nové poznatky, které nikdo nepotvrdil**, piš rovnou se značkou. Rozlišuj,
čí to je:

```markdown
> **[NEPOTVRZENO]** Návrh: vzkaz vidí každý, kdo vejde do místnosti.
> **[PŘEDBĚŽNÉ]** Vzkaz vidí každý, kdo vejde do místnosti.
```

`[NEPOTVRZENO]` je **tvůj** návrh, ke kterému se člověk nevyjádřil.
`[PŘEDBĚŽNÉ]` je **jeho** volba, kterou označil za předběžnou (`tentative`).
Splést si to stojí kolo navíc — u prvního se ptáš na směr, u druhého jen na
závazek.

**Router** (`SPEC/SPEC.md`): doplň nové řádky, oprav `summary` a `status`,
dokresli strom.

**A pošli do otevřené stránky, co jsi zapsal** — `push` s `written` a `written_by`.
Člověk pak vidí, v co se jeho odpovědi proměnily, a než některou změní, stránka
mu řekne, které ADR se tím přepisuje. Teprve pak `close`.

## Krok 5 — Shrň a nabídni další krok

Člověku 4–8 řádků:

- co se tímhle kolem rozhodlo (jedna odrážka na ADR)
- co z toho **nově vyplynulo** jako otevřená otázka
- kolik `[NEPOTVRZENO]` a otevřených otázek zbývá celkem
- **co je nejbližší díra k MVP** a návrh, čím pokračovat

Skonči návrhem, ne otázkou do prázdna: „další na řadě by byly patra v budovách,
protože na nich visí mapa i pohyb — pokračovat?"

## Kdy MVP stačí

Specifikace je pro MVP hotová, když platí všechno tohle:

- žádná spec potřebná pro MVP nemá `[NEPOTVRZENO]`
- hlavní průchod jde popsat od začátku do konce: hráč získá postavičku →
  připojí model přes MCP → postavička se pohne, něco udělá, něco zanechá →
  divák to na mapě uvidí
- je rozhodnuté, **co v MVP není** — a je to zapsané, ne jen nevyřčené
- `## Rozhraní` je vyplněné u všech specí, na kterých někdo závisí

Řekni to člověku, jakmile to nastane. Nespecifikuj donekonečna — od jistého bodu
je další rozhodnutí lepší udělat na postavené věci než na papíře.

## Zákazy

- **Nerozhoduj za člověka.** Ani „to je přece jasné", ani „zatím to napíšu takhle
  a pak se to změní".
- **Nevydávej jeho předběžnou volbu za svůj návrh, ani naopak.** `[PŘEDBĚŽNÉ]`
  a `[NEPOTVRZENO]` nejsou totéž.
- **Nepiš kód.** Tenhle skill specifikuje, nestaví.
- **Neptej se na rozhodnuté věci** — projdi ADR dřív, než otevřeš pusu.
- **Neschovávej rozpor** se zadáním do otevřených otázek; řekni ho rovnou.
- **Neroztahuj MVP.** Featura, kterou nikdo nevyžádal, do specifikace nepatří.
- **Neuzavírej kolo sám.** `close` až po tom, co člověk stránku předá — dokud ji
  má otevřenou, může se k otázce vrátit a odpověď změnit.
- **Nedomýšlej nezodpovězenou otázku.** Nechal-li ji být, zůstává otevřená;
  neodvozuj ji z jiné odpovědi.
