/** Commit details parsed from a git patch file */
export type ParsedCommit = {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
  diff: string;
};

/**
 * Parses a git patch file into an array of commits.
 */
export function parseGitPatch(patch: string): ParsedCommit[] {
  const lines = patch.split("\n");
  const commits: ParsedCommit[] = [];

  // We'll accumulate data as we go through the file
  let currentSha = "";
  let currentAuthorName = "";
  let currentAuthorEmail = "";
  let currentDate = "";
  let currentMessageLines: string[] = [];
  let currentDiffLines: string[] = [];
  let inMessageSection = false;
  let inDiffSection = false;

  // Helper function to finalize a commit if we have started one
  const finalizeCommit = () => {
    if (!currentSha) return; // No commit started yet
    commits.push({
      sha: currentSha,
      authorName: currentAuthorName,
      authorEmail: currentAuthorEmail,
      date: currentDate,
      message: currentMessageLines.join("\n").trim(),
      diff: currentDiffLines.join("\n").trim(),
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
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect the start of a new commit
    // Format: From <sha> Mon Sep 17 00:00:00 2001
    const fromMatch = line.match(/^From\s+([0-9a-f]{40})\s/);
    if (fromMatch) {
      // We have a new commit, finalize the previous one first
      finalizeCommit();
      currentSha = fromMatch[1];
      continue;
    }

    // Parse author line: From: Author Name <email>
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

    // Parse subject line and then subsequent message lines until we hit '---' on its own line
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

    if (inMessageSection && line.trim() === "---") {
      // End of message, start of diff section
      inMessageSection = false;
      inDiffSection = true;
      continue;
    }

    if (inMessageSection) {
      // Lines are part of the message
      currentMessageLines.push(line);
      continue;
    }

    if (inDiffSection) {
      // Lines are part of the diff
      currentDiffLines.push(line);
      continue;
    }
  }

  // Finalize the last commit if present
  finalizeCommit();

  return commits;
}

