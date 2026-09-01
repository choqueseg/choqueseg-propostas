const fs = require("fs");
const webpush = require("web-push");

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

fs.writeFileSync(".vapid-public.txt", publicKey, "utf8");
fs.writeFileSync(".vapid-private.txt", privateKey, "utf8");

console.log("PAR VAPID GERADO COM SUCESSO.");
console.log("Arquivos criados:");
console.log(".vapid-public.txt");
console.log(".vapid-private.txt");
console.log("Não compartilhe o conteúdo de .vapid-private.txt.");