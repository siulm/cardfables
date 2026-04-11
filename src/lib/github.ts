const REPO_OWNER = "siulm";
const REPO_NAME = "cardfables";

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN environment variable is not set");
  return token;
}

async function ghFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res;
}

export async function readFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await ghFetch(`/contents/${path}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function commitFiles(
  files: { path: string; content: string }[],
  message: string
): Promise<void> {
  // 1. Get current HEAD
  const refRes = await ghFetch("/git/refs/heads/main");
  const refData = await refRes.json();
  const headSha = refData.object.sha;

  // 2. Get current tree
  const commitRes = await ghFetch(`/git/commits/${headSha}`);
  const commitData = await commitRes.json();
  const treeSha = commitData.tree.sha;

  // 3. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (f) => {
      const blobRes = await ghFetch("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
      });
      const blobData = await blobRes.json();
      return { path: f.path, sha: blobData.sha, mode: "100644" as const, type: "blob" as const };
    })
  );

  // 4. Create new tree
  const treeRes = await ghFetch("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: treeSha, tree: blobs }),
  });
  const treeData = await treeRes.json();

  // 5. Create commit
  const newCommitRes = await ghFetch("/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [headSha],
    }),
  });
  const newCommitData = await newCommitRes.json();

  // 6. Update ref
  await ghFetch("/git/refs/heads/main", {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommitData.sha }),
  });
}
