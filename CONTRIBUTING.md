# Contributing to OpenWall

Thanks for helping build a calmer, more private household dashboard.

## Before opening a change

1. Check existing issues and the product roadmap.
2. Keep proposals inside the current milestone.
3. Open an issue before architecture, persistence, authentication, synchronization, privacy, or dependency changes.
4. Never include real household information in issues, tests, screenshots, or commits.

## Local checks

Install dependencies with `pnpm install`, start the app with `pnpm dev`, and run:

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Contributions are submitted under the Apache License 2.0.
