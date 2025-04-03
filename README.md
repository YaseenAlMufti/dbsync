# MySQL DDL Sync & Drift Detector

A Node.js utility to:
- Extract all **tables** and **stored procedures** DDLs from **dev** and **prod** MySQL databases.
- Compare both environments.
- Output:
  - **New tables & procedures**
  - **Changed tables & procedures**
  - Detailed `.diff` files (Visual Studio Code friendly)

---

## 📄 Project Structure

```
.
├── dev/                # Extracted DDLs from dev database
├── prod/               # Extracted DDLs from prod database
├── changes/            # Diff output and changed scripts
│   ├── procedures/
│   └── tables/
├── extract.js          # Extract DDLs
├── compare.js          # Compare and generate diffs
├── main.js             # Orchestrator
├── db-config.js        # DB connection configuration (from .env)
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

Copy `.env.example` and fill your database credentials:

```bash
cp .env.example .env
```

### 3. Clean & Sync

You can run the entire process in two steps:

```bash
npm run clean
npm run sync
```

This will:
- Clean previous folders (`dev`, `prod`, `changes`)
- Extract DDLs from both environments
- Compare and generate diffs in `changes/` folder

---

## 🟢 Features

- Ignores non-critical differences:
  - Table `AUTO_INCREMENT` values
  - Whitespace & comments in procedures
- Generates **Visual Studio Code friendly diff files**
- New tables will have `AUTO_INCREMENT=1`
- Procedures will include `DROP PROCEDURE IF EXISTS` statement

---

## 🔥 Example

A table diff will look like this in `changes/tables/users.diff`:

```diff
--- prod/tables/users.sql
+++ dev/tables/users.sql
@@ -1,5 +1,5 @@
 CREATE TABLE `users` (
-  `email` VARCHAR(100) NOT NULL
+  `email` VARCHAR(150) NOT NULL
 );
```

VS Code will auto-render this beautifully.

---

## 🙌 Contributions & License

Feel free to fork, modify and use.
ISC Licensed.
