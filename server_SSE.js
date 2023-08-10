const express = require("express");
const app = express();

function generateRandomComments() {
  const numComments = Math.floor(Math.random() * 11); // Entre 0 et 10 commentaires
  const comments = [];

  for (let i = 0; i < numComments; i++) {
    comments.push(`Commentaire ${i + 1}`);
  }

  return comments;
}
function generateRandomLikes() {
  return Math.floor(Math.random() * 101); // Entre 0 et 100 likes
}

const articles = [
  {
    id: 1,
    title: "Article 1",
    content: "Contenu de l'article 1",
    comments: generateRandomComments(),
    likes: generateRandomLikes(),
  },
  {
    id: 2,
    title: "Article 2",
    content: "Contenu de l'article 2",
    comments: generateRandomComments(),
    likes: generateRandomLikes(),
  },
  // ... autres articles
];

app.use(express.static("public")); // Dossier public pour les fichiers statiques
const clients = new Set(); // Stocker les clients connectés

app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendArticle = (article) => {
    res.write(`data: ${JSON.stringify(article)}\n\n`);
  };

  clients.add(res);

  articles.forEach((article) => {
    sendArticle(article);
  });

  const intervalId = setInterval(() => {
    const newArticle = {
      id: Date.now(),
      title: "Nouvel Article",
      content: "Contenu du nouvel article",
      comments: generateRandomComments(),
    };
    sendArticle(newArticle);
  }, 500);

  req.on("close", () => {
    clearInterval(intervalId);
    clients.delete(res);
  });
});

// Route pour supprimer tous les articles
app.post("/clear-articles", (req, res) => {
  articles.length = 0;
  // Envoyer un message à tous les clients pour supprimer les articles
  clients.forEach((client) => {
    client.write("event: clear\ndata: {}\n\n");
  });
  res.sendStatus(200);
});

app.post("/like-article/:articleId", (req, res) => {
  const articleId = parseInt(req.params.articleId);
  const article = articles.find((a) => a.id === articleId);

  if (article) {
    article.likes += 1;
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur SSE en cours d'exécution sur le port ${PORT}`);
});
