# Slike za Ginko Sobe

Stavi fotografije u foldere ispod. U kodu se koriste putanje koje počinju s `/images/...` (bez `public/`).

## Brzi pregled

| Folder | Što tu ide |
|--------|------------|
| `hero/` | 1–2 najbolje slike za naslovnicu i društvene mreže |
| `property/` | Eksterijer, sauna, doručak, dvorište — zajednički prostori |
| `rooms/[slug]/` | Fotografije **jedne konkretne sobe** (5–8 komada) |

---

## `hero/` — naslovnica

| Datoteka | Što staviti |
|----------|-------------|
| `exterior-01.jpg` | Glavna hero slika (fasada ili najljepši kadar objekta) — koristi se i za SEO preview |
| `cta-banner.jpg` | *(opcionalno)* Donji banner na naslovnici |

**Preporuka:** horizontalna slika, min. 1920 px širine.

---

## `property/` — galerija objekta

Fotke koje nisu vezane uz jednu sobu — prikazuju se na `/gallery` i traci na naslovnici.

Primjeri imena (možeš imenovati kako hoćeš, bitno je da kasnije ažuriraš config):

- `exterior-01.jpg`, `exterior-02.jpg` — fasada, ulaz
- `common-sauna.jpg` — sauna / wellness
- `common-breakfast.jpg` — doručak
- `common-garden.jpg` — dvorište, terasa
- `surroundings-daruvar.jpg` — okolica Daruvara

**Preporuka:** 8–12 slika ukupno.

---

## `rooms/[slug]/` — pojedinačne sobe

Za svaku sobu napravi 5–8 fotografija. **Prva slika** (`01-cover.jpg`) je najvažnija — pojavljuje se na kartici i kao glavna u galeriji.

### Imenovanje (preporučeno)

```
01-cover.jpg      ← naslovna (krevet ili najbolji ugao sobe)
02-bedroom.jpg
03-bathroom.jpg
04-terrace.jpg    ← ako ima terasu
05-detail.jpg
```

### Folderi po sobama

| Folder | Soba |
|--------|------|
| `rooms/ginko-1/` | Ginko 1 |
| `rooms/ginko-2/` | Ginko 2 |
| `rooms/ginko-3/` | Ginko 3 |
| `rooms/ginko-4/` | Ginko 4 |
| `rooms/ginko-5/` | Ginko 5 |
| `rooms/ginko-6/` | Ginko 6 |
| `rooms/ginko-spa-2/` | Ginko Spa 2 |

---

## Tehničke napomene

- Format: **`.jpg`** ili **`.webp`**
- Širina: **1600–2000 px** (sobe), **2400 px** (hero)
- Komprimiraj prije uploada (cilj ~150–400 KB po slici)
- Ista slika ne mora biti u više foldera — kopiraj samo ako treba

---

## Nakon što dodaš slike

Javi ili u Agent modu ažuriraj `src/modules/rooms/rooms.config.ts` — zamijeni Unsplash URL-ove s putanjama tipa:

```
/images/rooms/ginko-1/01-cover.jpg
```
