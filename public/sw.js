const CACHE_NAME = "choqueseg-propostas-v3";

const ARQUIVOS_INICIAIS = [
  "/",
  "/imagens/logo/brasao-choqueseg.png",
  "/imagens/capa/capa.proposta.png",
  "/imagens/capa/capa.gerador.png",
  "/icones/icon-192.png",
  "/icones/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ARQUIVOS_INICIAIS))
      .catch((erro) => {
        console.error("Erro ao criar cache:", erro);
      }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_NAME)
          .map((chave) => caches.delete(chave)),
      ),
    ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copia);
        });

        return resposta;
      })
      .catch(async () => {
        const arquivoSalvo = await caches.match(event.request);

        if (arquivoSalvo) return arquivoSalvo;

        if (event.request.mode === "navigate") {
          return caches.match("/");
        }

        return Response.error();
      }),
  );
});