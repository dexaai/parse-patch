# Parse Git Patch

A TypeScript utility for parsing `git format-patch` output into structured commit objects.

## Features

- **Structured Output:** Convert raw patch data into structured JavaScript/TypeScript objects.
- **Robust Parsing:** Handles multi-line commit messages, including tricky formatting and `[PATCH]` prefixes.
- **TypeScript Support:** Fully typed, making it easy to integrate into TypeScript codebases.
- **Tested & Reliable:** Includes a comprehensive test suite powered by Vitest.

## Installation

```bash
npm install parse-patch
```

## Usage

```typescript
import { parseGitPatch } from "parse-patch";

const patch = `
From 1234567890abcdef1234567890abcdef12345678 Mon Sep 17 00:00:00 2001
From: Jane Doe <jane@example.com>
Date: Wed, 12 Oct 2022 14:38:15 +0200
Subject: [PATCH] Fix a bug in the foo component

Some additional context for the commit message.

---
 file1.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

diff --git a/file1.txt b/file1.txt
index 24967d3..b37620a 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,6 +1,6 @@
Line 1
-Line 2
+Line 2 changed
Line 3
Line 4
Line 5
Line 6
`;

const commits = parseGitPatch(patch);
console.log(commits);
/*
[
  {
    sha: '1234567890abcdef1234567890abcdef12345678',
    authorName: 'Jane Doe',
    authorEmail: 'jane@example.com',
    date: 'Wed, 12 Oct 2022 14:38:15 +0200',
    message: 'Fix a bug in the foo component\n\nSome additional context for the commit message.',
    diff: 'diff --git a/file1.txt b/file1.txt\nindex 24967d3..b37620a 100644\n--- a/file1.txt\n+++ b/file1.txt\n@@ -1,6 +1,6 @@\nLine 1\n-Line 2\n+Line 2 changed\nLine 3\nLine 4\nLine 5\nLine 6'
  }
]
*/
```

## API

```typescript
// Generate patch with `git format-patch --stdout`
parseGitPatch(patch: string): {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
  diff: string;
}[]
```

## License

MIT License
