import { GITHUB_CONFIG } from '../config';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchUsersFromGithub() {
  try {
    const repo = GITHUB_CONFIG.repo;
    const branch = GITHUB_CONFIG.branch || 'main';
    const path = GITHUB_CONFIG.usersPath || 'data/users.json';
    const targetUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

    // Requête simple sans headers custom pour éviter la pré-vérification CORS
    const response = await fetch(`${targetUrl}?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    const users = await response.json();
    console.log("Comptes chargés depuis GitHub :", users);
    
    localStorage.setItem('revisio_users', JSON.stringify(users));
    return users;
  } catch (error) {
    console.warn('Erreur de lecture sur GitHub Raw. Repli sur le LocalStorage :', error);
    
    try {
      const cachedUsers = localStorage.getItem('revisio_users');
      return cachedUsers ? JSON.parse(cachedUsers) : [];
    } catch (e) {
      localStorage.removeItem('revisio_users');
      return [];
    }
  }
}

export async function loginUser(username, password) {
  const users = await fetchUsersFromGithub();
  
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const inputHash = await hashPassword(cleanPassword);

  console.log("--> Tentative de connexion pour :", cleanUsername);

  const user = users.find((u) => {
    const uUsername = String(u.username || '').trim().toLowerCase();
    const uId = String(u.id || '').trim().toLowerCase();
    const uHash = String(u.passwordHash || '').trim().toLowerCase();

    const isMatchUser = uUsername === cleanUsername || uId === cleanUsername;
    const isMatchHash = uHash === inputHash.toLowerCase();

    if (isMatchUser && !isMatchHash) {
      console.warn("Utilisateur trouvé, mais le mot de passe est incorrect !");
    }

    return isMatchUser && isMatchHash;
  });

  if (user) {
    console.log("Connexion réussie pour :", user.username);
    const { passwordHash, ...sessionUser } = user;
    localStorage.setItem('revisio_session', JSON.stringify(sessionUser));
    return sessionUser;
  }

  console.warn("Aucun utilisateur correspondant trouvé.");
  return null;
}

export async function pushUsersToGithub(updatedUsers) {
  const token = localStorage.getItem('revisio_gh_token');
  if (!token) throw new Error("Clé Personal Access Token (PAT) absente.");

  const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.usersPath}`;

  const getRes = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  });
  
  if (!getRes.ok) throw new Error("Impossible d'obtenir les métadonnées de users.json sur GitHub API.");
  const fileData = await getRes.json();

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(updatedUsers, null, 2))));

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `[RevisIO] Synchronisation des points/progression`,
      content: content,
      sha: fileData.sha,
      branch: GITHUB_CONFIG.branch || 'main'
    })
  });

  if (!putRes.ok) {
    throw new Error(`Erreur lors de l'enregistrement sur GitHub (${putRes.status})`);
  }

  return await putRes.json();
}

export function getCurrentUser() {
  const session = localStorage.getItem('revisio_session');
  return session ? JSON.parse(session) : null;
}

export function logoutUser() {
  localStorage.removeItem('revisio_session');
}