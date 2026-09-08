# Parfume Compare

Search perfumes, compare their notes/accords side by side, and find similar fragrances —
backed by a local SQLite DB built from an open Fragrantica dataset. No scraping, no auth.

## Setup

```bash
npm install
```

### 1. Get the data

Data comes from the [Fragrantica.com Fragrance Dataset](https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset)
on Kaggle (134k fragrances). You need a free Kaggle account and API key:

1. Create a Kaggle account, then go to Account Settings → "Create New API Token" to download `kaggle.json`.
2. Put it at `~/.kaggle/kaggle.json` (`chmod 600` it).
3. `pip install kaggle` (or `pipx install kaggle`).
4. Download the dataset:
   ```bash
   kaggle datasets download olgagmiufana1/fragrantica-com-fragrance-dataset -p data --unzip
   ```

**Just want to try the app first?** A tiny 5-perfume sample CSV is already at `data/sample.csv` —
skip straight to step 2.

### 2. Import into SQLite

```bash
npm run import-dataset
```

This reads whichever CSV it finds in `data/` and populates `data/parfumes.db`. The dataset's exact
column names can vary between exports — the importer resolves columns by alias
(see `COLUMN_ALIASES` in `scripts/import-dataset.ts`). If it can't find a column it needs, it'll
tell you which headers it actually saw so you can add the real name to the alias list.

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## How it works

- **Search** (`/`) — live search by perfume or brand name.
- **Detail** (`/perfume/[id]`) — note pyramid (top/middle/base), accords, and a "similar perfumes" list.
- **Compare** (`/compare?ids=1,2,3`) — side-by-side note/accord comparison, shared items highlighted.
- **Similarity** — weighted Jaccard similarity over notes + accords (accords count double, since
  they're a broader signal than any single note). See `lib/similarity.ts`.
