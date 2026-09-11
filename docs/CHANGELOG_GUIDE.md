# Maintaining the OpenWall changelog

The changelog is the plain-language history of changes that matter to households, contributors, deployers, and anyone restoring older OpenWall data. Update `CHANGELOG.md` in the same pull request or commit as every notable change.

For rewards or mobile work, record both the user-visible behavior and the data boundary. Mention migrations whenever a Star value, approval state, redemption, or device-only PIN changes.

```md
### Added
- Added a touch-first personal home and a Rewards shop with configurable Stars.

### Changed
- Task completions now create transparent award or approval activity.

### Security
- Parent PIN remains local-only and is excluded from backups.
```

## When an entry is required

Add an item under **Unreleased** when a change affects any of the following:

- what a person can see or do;
- accessibility, responsive behavior, installation, offline use, or browser support;
- stored household data, backups, restoration, privacy, or security;
- a public interface, supported deployment method, or contributor workflow;
- a dependency change that materially affects behavior, compatibility, or security.

Routine test refactors, internal cleanup with no behavioral effect, formatting, and typo-only corrections do not need entries. If users or operators would reasonably notice or need to prepare for the change, record it.

## How to write an entry

1. Add one concise bullet to the appropriate section of **Unreleased**.
2. Use one of the standard headings: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, or **Security**.
3. Describe the outcome in plain language, not filenames or implementation details.
4. Call out data migration, compatibility, privacy, security, or manual action explicitly.
5. Keep related changes in one bullet; keep unrelated outcomes separate.

Good: `- Added touch-friendly card reordering on tablet and phone layouts.`

Avoid: `- Updated App.tsx and styles.css.`

## Major, minor, and small changes

OpenWall uses Semantic Versioning: `MAJOR.MINOR.PATCH`.

### Major change

Increase **MAJOR** for an incompatible public release: a backup format that older versions cannot read, removal or replacement of a relied-upon feature, an incompatible extension or deployment interface, or a required data reset. Major changes need a prominent changelog section with migration steps, risks, and any rollback path.

Before version 1.0, a breaking change normally increases the **MINOR** number instead, but it must still be labeled **Breaking** and documented with the same care.

### Minor change

Increase **MINOR** for a backward-compatible capability or meaningful product expansion: a new card type, a new household workflow, a major navigation addition, optional synchronization, or a substantial new customization system. Group all related additions and behavior changes beneath that release.

### Small change

Increase **PATCH** for a backward-compatible correction or contained improvement: responsive-layout fixes, accessibility corrections, copy clarification, performance improvements, and small interaction refinements. A patch can contain several small changes as long as none introduce a new broad capability or break compatibility.

Documentation-only changes may remain in **Unreleased** until the next product release unless they correct security, migration, or operating instructions that warrant an immediate patch.

## Cutting a release

1. Confirm every notable merged change appears under **Unreleased**.
2. Choose the next version from the rules above and update `package.json` plus any in-app version or release-note data in the same change.
3. Rename **Unreleased** to `[version] - YYYY-MM-DD` using the release date.
4. Add a fresh empty **Unreleased** section at the top.
5. Update the comparison links at the bottom of `CHANGELOG.md`.
6. Run the complete verification suite, merge or push the release, create the matching `vX.Y.Z` tag, and verify the GitHub Pages deployment when included in the release.

Never rewrite an already published release entry to hide a mistake. Add a corrective entry to **Unreleased**, and amend an old entry only to fix an objectively inaccurate statement.

## Automated changelog check

CI and the Pages deployment run `node scripts/check-changelog.mjs`. If app code, public assets, dependencies, deployment configuration, or user-facing documentation changes, the check requires a new bullet under **Unreleased**. Run it locally with `--base <commit> --head <commit>` before pushing.

For a test-only or internal refactor, add the commit trailer `Changelog: none` or use the pull-request label `changelog: none`. This is an explicit exception, not a replacement for documenting behavior changes. The check never writes release notes automatically.
