const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const generateRandomComments = () => {
  const numComments = Math.floor(Math.random() * 11);
  const comments = [];

  for (let i = 0; i < numComments; i++) {
    comments.push(`Commentaire ${i + 1}`);
  }

  return comments;
};

const generateRandomLikes = () => {
  return Math.floor(Math.random() * 101);
};

let articles = [
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

app.use(express.static("public"));

wss.on("connection", (socket) => {
  console.log("Un client s'est connecté");

  // Envoi de l'historique des articles au client
  socket.send(JSON.stringify({ type: "sendHistory", data: articles }));

  socket.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "like") {
      const article = articles.find((a) => a.id === data.articleId);
      if (article) {
        article.likes++;
        // Envoi de la mise à jour des likes à tous les clients connectés
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "updateLikes",
                articleId: data.articleId,
                likes: article.likes,
              })
            );
          }
        });
      }
    }

    if (data.type === "comment") {
      const article = articles.find((a) => a.id === data.articleId);
      if (article) {
        article.comments.push(data.comment);
        // Envoi de la mise à jour des commentaires à tous les clients connectés
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "updateComments",
                articleId: data.articleId,
                comments: article.comments,
              })
            );
          }
        });
      }
    }

    if (data.type === "clearHistory") {
      articles = [];
      // Envoi de l'indication de l'historique effacé à tous les clients connectés
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "historyCleared" }));
        }
      });
    }

    if (data.type === "getHistory") {
      // Envoi de l'historique actuel au client qui en fait la demande
      socket.send(JSON.stringify({ type: "sendHistory", data: articles }));
    }

    if (data.type === "setGenerationInterval") {
      clearInterval(intervalId); // Arrête l'intervalle actuel
      const newInterval = parseInt(data.interval); // Convertit en millisecondes
      console.log("New intervale", newInterval);
      intervalId = setInterval(generateArticle, newInterval); // Démarre le nouvel intervalle
    }
  });

  // Génération automatique d'un nouvel article à l'intervalle spécifié
  let intervalId = setInterval(generateArticle, 1000); // Intervalle initial (1 seconde)

  socket.on("close", () => {
    console.log("Un client s'est déconnecté");
    clearInterval(intervalId); // Arrêter la génération automatique d'articles
  });
});

function generateArticle() {
  const newArticle = {
    id: Date.now(),
    title: "Nouvel Article",
    content: "Contenu du nouvel article",
    comments: generateRandomComments(),
    likes: generateRandomLikes(),
  };
  articles.unshift(newArticle);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "updateArticles",
          data: newArticle,
        })
      );
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
