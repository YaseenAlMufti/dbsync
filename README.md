# MySQL DDL Sync & Drift Detector

A Node.js utility to:
- Extract all **tables** and **stored procedures** DDLs from **dev** and **prod** MySQL databases.
- Compare both environments.
- Output:
  - **New tables & procedures**
  - **Changed tables & procedures**
  - Detailed `.diff` files (VS Code friendly — like Git diffs)
- Deploy confirmed DDL changes to a production database using a controlled CLI.
- Embed your database schema in a vector DB to enable future AI/assistant query generation.

---

## 📄 Project Structure

```
.
├── dev/                # Extracted DDLs from dev database
├── prod/               # Extracted DDLs from prod database
├── changes/            # Diff output and changed scripts
│   ├── procedures/
│   └── tables/
├── deployments/        # Approved .sql files ready to be deployed
├── deployed/           # Successfully deployed .sql files (moved automatically)
├── extract.js          # Extract DDLs
├── compare.js          # Compare and generate diffs
├── prepare-ai.js       # Prepare schema vector embeddings for AI
├── deployChanges.js    # Deploy approved DDL changes safely
├── main.js             # Orchestrator
├── config.js           # DB connection configuration (from .env)
├── .env.example        # Environment variables example
└── package.json
```

---

## 🚀 Usage

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure `.env`
```bash
cp .env.example .env
```

### 3. Extract & Compare
```bash
npm run clean     # Clean previous outputs
npm run sync      # Extract from dev/prod and compare them
```

### 4. AI Embedding (Optional)
```bash
npm run prepareAI -- dev
```
Uploads all `dev/tables/*.sql` schemas into a vector DB named after your DB for use in OpenAI assistant queries.

### 5. Prepare Deployment
- Copy selected files from `changes/` to `deployments/` folder

### 6. Deploy to Production
```bash
npm run deploy         # Executes all .sql files in /deployments
npm run deploy -- --dry  # DRY RUN (no changes, just preview)
```
- Confirms env/dbname before execution
- Logs are saved with timestamps
- Files are moved to `deployed/` on success
- Console shows ✅/❌ per file + a summary table

---

## 🟢 Features
- Ignores non-critical differences:
  - Table `AUTO_INCREMENT` values
  - Whitespace & comments in procedures
- Proper MySQL formatting for procedures:
  - `USE dbname;`
  - `DELIMITER $$` + `DROP PROCEDURE IF EXISTS`
- DRY-RUN support for deployments
- Human-friendly output logs (e.g., `CREATE PROCEDURE OK, 0 row(s) affected`)
- Timestamped logs per deployment file

---

## 📄 Example Table Diff
File: `changes/tables/users.diff`

```diff
--- prod/tables/users.sql
+++ dev/tables/users.sql
@@ -1,5 +1,5 @@
 CREATE TABLE `users` (
-  `email` VARCHAR(100) NOT NULL
+  `email` VARCHAR(150) NOT NULL
 );
```

VS Code will render this beautifully using Git diff view.

---

## 🙌 License & Contribution

ISC licensed. PRs welcome!

Built by [Yaseen Al-Mufti](https://github.com/YaseenAlMufti)
