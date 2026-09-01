const fs = require("fs");
const crypto = require("crypto");

const texto = fs.readFileSync(".env.local", "utf8");

function pegar(nome) {
  const linha = texto
    .split(/\r?\n/)
    .find((item) => item.startsWith(nome + "="));

  if (!linha) return "";

  return linha
    .slice(nome.length + 1)
    .replace(/^"|"$/g, "")
    .trim();
}

const publicKey = pegar("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
const privateKey = pegar("VAPID_PRIVATE_KEY");

if (!publicKey || !privateKey) {
  console.log("FALTANDO VARIAVEL VAPID");
  process.exit();
}

const ec = crypto.createECDH("prime256v1");

ec.setPrivateKey(
  Buffer.from(
    privateKey.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  )
);

const publicKeyCalculada = ec.getPublicKey().toString("base64url");

if (publicKeyCalculada === publicKey) {
  console.log("CHAVES VAPID: CORRETAS");
} else {
  console.log("CHAVES VAPID: NAO CORRESPONDEM");
}