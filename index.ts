export type ParsedCommit = {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
  diff: string;
};

export function parseGitPatch(patch: string): ParsedCommit[] {
  const lines = patch.split("\n");
  const commits: ParsedCommit[] = [];

  let currentSha = "";
  let currentAuthorName = "";
  let currentAuthorEmail = "";
  let currentDate = "";
  let currentMessageLines: string[] = [];
  let currentDiffLines: string[] = [];
  let inMessageSection = false;
  let inDiffSection = false;
  let foundDiffStart = false; // To track when we've hit `diff --git`

  const finalizeCommit = () => {
    if (!currentSha) return; // No commit started yet
    commits.push({
      sha: currentSha,
      authorName: currentAuthorName,
      authorEmail: currentAuthorEmail,
      date: currentDate,
      message: currentMessageLines.join("\n").trim(),
      diff:
        currentDiffLines.join("\n") + (currentDiffLines.length > 0 ? "\n" : ""),
    });
    // Reset for next commit
    currentSha = "";
    currentAuthorName = "";
    currentAuthorEmail = "";
    currentDate = "";
    currentMessageLines = [];
    currentDiffLines = [];
    inMessageSection = false;
    inDiffSection = false;
    foundDiffStart = false;
  };

  for (const line of lines) {
    // Detect the start of a new commit
    const fromMatch = line.match(/^From\s+([0-9a-f]{40})\s/);
    if (fromMatch) {
      finalizeCommit();
      currentSha = fromMatch[1];
      continue;
    }

    // Parse author line: From: Name <email>
    if (line.startsWith("From: ")) {
      const authorLine = line.slice("From: ".length).trim();
      const emailMatch = authorLine.match(/<(.*)>/);
      if (emailMatch) {
        currentAuthorEmail = emailMatch[1];
        currentAuthorName = authorLine.slice(0, authorLine.indexOf("<")).trim();
      } else {
        currentAuthorName = authorLine;
      }
      continue;
    }

    // Parse date line: Date: ...
    if (line.startsWith("Date: ")) {
      currentDate = line.slice("Date: ".length).trim();
      continue;
    }

    // Parse subject line
    if (line.startsWith("Subject: ")) {
      let subject = line.slice("Subject: ".length).trim();
      // Remove leading "[PATCH] " if present
      if (subject.startsWith("[PATCH] ")) {
        subject = subject.slice("[PATCH] ".length);
      }
      currentMessageLines.push(subject);
      inMessageSection = true;
      continue;
    }

    // Check if we are transitioning to diff section
    if (inMessageSection && line.trim() === "---") {
      inMessageSection = false;
      inDiffSection = true;
      continue;
    }

    // If we are in the message section, just append lines to message
    if (inMessageSection) {
      currentMessageLines.push(line);
      continue;
    }

    // If we are in the diff section but haven't found `diff --git` yet
    if (inDiffSection && !foundDiffStart) {
      // Look for the start of the actual diff
      if (line.startsWith("diff --git ")) {
        foundDiffStart = true;
        currentDiffLines.push(line);
      }
      // Ignore everything until we find `diff --git`
      continue;
    }

    // If we are in diff section and already found `diff --git`
    if (inDiffSection && foundDiffStart) {
      // Stop capturing when we hit a line that, after trimming, is `--`
      if (line.trim() === "--") {
        // Don't add this line and don't continue reading the diff
        inDiffSection = false;
        foundDiffStart = false;
        continue;
      }
      currentDiffLines.push(line);
      continue;
    }
  }

  finalizeCommit();

  return commits;
}

