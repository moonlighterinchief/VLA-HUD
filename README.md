# VLA HUD v0.3.7.1 Beta

P0 Data Continuity hotfix on top of v0.3.7 Beta.

Adds:
- Recovery Center
- Portable full-state JSON backups
- Full restore with checksum validation
- Local rolling snapshots
- Automatic state checkpoints
- Pre/post restore safety snapshots
- Recovery package export
- Visible last-backup / snapshot integrity status
- Network-first service-worker update behavior to reduce stale Home Screen PWA versions

Engineering principle:
The HUD is replaceable. The history is not.

IMPORTANT:
Local snapshots still live in browser storage. They protect against ordinary state corruption and bad edits, but not deletion of all site/app data. Portable backup files must be kept outside the PWA until cloud/device-independent persistence is implemented.
