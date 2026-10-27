# P3.1 · GitHub-hosted encrypted D1 backup (not executed)

## Goal
Backup Cloudflare D1 `trainingbot-db` from GitHub Actions, not from the owner's Windows machine. The production site and database must not be changed. A D1 export temporarily blocks queries; **do not run it without explicit owner authorization for the short interruption**.

## Safety constraints
- Repo `Gamevalentine/trainingbot-cloudflare` is **public**. Never commit plaintext D1 SQL or customer/admin/contact information.
- The export job only runs once when an approved merge commit on `main` carries the exact `[TRAININGBOT-D1-BACKUP-APPROVED]` marker, or manually via `workflow_dispatch` from the default branch with typed `BACKUP-TRAININGBOT-D1` confirmation. PR updates run mock-only syntax/API contract tests, without secrets and without accessing Cloudflare. There is no cron and no D1 SQL writes/restore.
- It checks that the Cloudflare API target is database `trainingbot-db` and UUID `7c070ec3-1f46-4d6e-9dda-0509518488f8`, exports via the official D1 REST export/polling API, verifies a nonempty SQL schema, compresses, symmetrically encrypts using GPG AES-256, uploads **only ciphertext** and its SHA-256 manifest as a GitHub Actions artifact.
- `actions/upload-artifact` retention is 90 days (the maximum for public repositories). This is **not perpetual offsite archival**; a private long-term backup repository or private object storage should supplement it.
- The encrypted archive can be downloaded by users with repository read access. Do not lose the strong decryption passphrase; do not put it in source code, logs, chat, or the artifact.
- R2 video objects are NOT covered.
- SQL is checked for nonemptiness and table definitions, **not restored or proven identical to every production row**. Staging restore verification is a separate follow-up.

## Required one-time account authorization
Only the owner can configure private secrets in GitHub. In **repository Settings → Secrets and variables → Actions**, set:
1. `TRAININGBOT_D1_EXPORT_TOKEN`: a Cloudflare API token restricted to this account and to the D1 read/export operations required by the official API. Never paste it into chat or commit it.
2. `TRAININGBOT_BACKUP_PASSPHRASE`: a unique, randomly generated passphrase of at least 32 characters. Store a recoverable copy in the owner's password manager; GitHub secrets cannot be read back later.

The workflow intentionally fails without secrets. Authentication cannot be inferred from GitHub Pages/Cloudflare integration. After explicit owner authorization for this backup and its temporary D1 query interruption, merge this independent backup-only PR with a specially marked `[TRAININGBOT-D1-BACKUP-APPROVED]` merge title to run the export once automatically. Without that exact marker, the merge will NOT start an export. A manual run remains available from the main branch using **Actions → TrainingBot D1 encrypted GitHub backup (manual) → Run workflow**, confirming the phrase. Prefer low traffic.

**Do not merge this PR using an approved-run marker or run export without explicit owner authorization.** Merging to `main` may separately trigger the site's Cloudflare Pages build; the PR only changes GitHub workflow and backup script, not page code.

## Verification
A successful run must have a `trainingbot-db-encrypted-<run-id>` artifact containing a timestamped `.sql.gz.gpg` file and matching `.sha256` file. A successful workflow is evidence of export + encrypted artifact creation, not restoration validity.

To recover privately, download the artifact, verify ciphertext SHA-256, decrypt with GPG using the retained passphrase, decompress, then import into a **separate staging database** only. Never restore directly over production without a fresh, explicit decision.

References:
- https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts

**Status: workflow, exporter and offline mock tests implemented in Draft PR, not executed. No production D1 export, archive, or changes occurred.**
