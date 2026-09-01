self.addEventListener("push", (event) => {
  let dados = {
    title: "CHOQUESEG PRO",
    body: "Você recebeu uma nova notificação.",
    url: "/",
  };

  if (event.data) {
    try {
      dados = { ...dados, ...event.data.json() };
    } catch {
      dados.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(dados.title || "CHOQUESEG PRO", {
      body: dados.body || "Você recebeu uma nova notificação.",
      icon: "/imagens/logo/brasao-choqueseg.png",
      badge: "/imagens/logo/brasao-choqueseg.png",
      data: { url: dados.url || "/" },
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((janelas) => {
        for (const janela of janelas) {
          if ("focus" in janela) {
            janela.navigate(destino);
            return janela.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(destino);
        }
      }),
  );
});