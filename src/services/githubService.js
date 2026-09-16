import { GITHUB_CONFIG } from '../config';

export async function pushUsersToGithub(token, usersList) {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.usersPath}`;

  try {
    // 1. Récupération du SHA courant du fichier
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let sha = '';
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Encodage Base64 (support UTF-8)
    const jsonString = JSON.stringify(usersList, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

    // 3. Mise à jour du fichier sur le repo
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'update progress users via RevisIO',
        content: contentBase64,
        sha: sha || undefined,
        branch: GITHUB_CONFIG.branch
      }),
    });

    if (!putRes.ok) {
      throw new Error(`Erreur HTTP : ${putRes.status}`);
    }

    return await putRes.json();
  } catch (error) {
    console.error('Échec de la synchronisation GitHub :', error);
    throw error;
  }
}