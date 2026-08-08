import {
  CategoriaEstoque,
  UnidadeEstoque,
} from "./types";

export type ItemCatalogoProduto = {
  id: string;
  segmento: string;
  categoriaCatalogo: string;
  marca: string;
  linha: string;
  nome: string;
  categoriaEstoque: CategoriaEstoque;
  unidade: UnidadeEstoque;
  codigo?: string;
  imagemUrl?: string;
  paginaProdutoUrl?: string;
  manualUrl?: string;
  especificacoes?: Record<string, string>;
  observacao?: string;
};

export const catalogoProdutos: ItemCatalogoProduto[] = [
  // Câmeras e gravação
  { id: "cam-int-bullet-hdcvi", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "HDCVI / Multi HD", nome: "Câmera bullet Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-dome-hdcvi", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "HDCVI / Multi HD", nome: "Câmera dome Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-ip-bullet", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "IP", nome: "Câmera IP bullet Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-ip-dome", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "IP", nome: "Câmera IP dome Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-wifi", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Wi-Fi", nome: "Câmera Wi-Fi Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-fullcolor", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Full Color", nome: "Câmera Full Color Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-speed", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Speed dome", nome: "Câmera speed dome Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-hik-bullet", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Hikvision", linha: "HDTVI", nome: "Câmera bullet Hikvision", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-hik-dome", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Hikvision", linha: "HDTVI", nome: "Câmera dome Hikvision", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-hik-ip", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Hikvision", linha: "IP", nome: "Câmera IP Hikvision", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "dvr-int", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Intelbras", linha: "DVR", nome: "DVR Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "nvr-int", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Intelbras", linha: "NVR", nome: "NVR Intelbras", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "dvr-hik", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Hikvision", linha: "DVR", nome: "DVR Hikvision", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "nvr-hik", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Hikvision", linha: "NVR", nome: "NVR Hikvision", categoriaEstoque: "Câmera", unidade: "Unidade" },

  // Alarmes, cerca, sensores
  { id: "alarme-int-monitorada", segmento: "Segurança eletrônica", categoriaCatalogo: "Alarmes", marca: "Intelbras", linha: "Central monitorada", nome: "Central de alarme monitorada Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "alarme-int-naomonitorada", segmento: "Segurança eletrônica", categoriaCatalogo: "Alarmes", marca: "Intelbras", linha: "Central não monitorada", nome: "Central de alarme não monitorada Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "alarme-jfl-monitorada", segmento: "Segurança eletrônica", categoriaCatalogo: "Alarmes", marca: "JFL", linha: "Central monitorada", nome: "Central de alarme monitorada JFL", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "alarme-jfl-naomonitorada", segmento: "Segurança eletrônica", categoriaCatalogo: "Alarmes", marca: "JFL", linha: "Central não monitorada", nome: "Central de alarme não monitorada JFL", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "sensor-int-pir", segmento: "Segurança eletrônica", categoriaCatalogo: "Sensores", marca: "Intelbras", linha: "PIR", nome: "Sensor de presença Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "sensor-int-pet", segmento: "Segurança eletrônica", categoriaCatalogo: "Sensores", marca: "Intelbras", linha: "PET", nome: "Sensor PET Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "sensor-int-abertura", segmento: "Segurança eletrônica", categoriaCatalogo: "Sensores", marca: "Intelbras", linha: "Abertura", nome: "Sensor de abertura Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "sensor-jfl-pir", segmento: "Segurança eletrônica", categoriaCatalogo: "Sensores", marca: "JFL", linha: "PIR", nome: "Sensor de presença JFL", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "cerca-int", segmento: "Segurança eletrônica", categoriaCatalogo: "Cerca elétrica", marca: "Intelbras", linha: "Eletrificador", nome: "Central de cerca elétrica Intelbras", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "cerca-jfl", segmento: "Segurança eletrônica", categoriaCatalogo: "Cerca elétrica", marca: "JFL", linha: "Eletrificador", nome: "Central de cerca elétrica JFL", categoriaEstoque: "Alarme", unidade: "Unidade" },

  // Interfonia e vídeo porteiro
  { id: "interfone-int-res", segmento: "Segurança eletrônica", categoriaCatalogo: "Interfonia", marca: "Intelbras", linha: "Residencial", nome: "Interfone residencial Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "interfone-int-cond", segmento: "Segurança eletrônica", categoriaCatalogo: "Interfonia", marca: "Intelbras", linha: "Condominial", nome: "Interfone condominial Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "videoporteiro-int", segmento: "Segurança eletrônica", categoriaCatalogo: "Vídeo porteiro", marca: "Intelbras", linha: "Residencial", nome: "Vídeo porteiro Intelbras", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "videoporteiro-hik", segmento: "Segurança eletrônica", categoriaCatalogo: "Vídeo porteiro", marca: "Hikvision", linha: "IP", nome: "Vídeo porteiro IP Hikvision", categoriaEstoque: "Automação", unidade: "Kit" },

  // Fechaduras digitais
  { id: "fech-int-sobrepor", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Intelbras", linha: "Sobrepor", nome: "Fechadura digital de sobrepor Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-int-embutir", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Intelbras", linha: "Embutir", nome: "Fechadura digital de embutir Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-int-vidro", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Intelbras", linha: "Porta de vidro", nome: "Fechadura digital para porta de vidro Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-int-smart", segmento: "Casa inteligente", categoriaCatalogo: "Fechaduras inteligentes", marca: "Intelbras", linha: "Smart", nome: "Fechadura inteligente Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },

  // Automatizadores
  { id: "motor-ppa-desl", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "PPA", linha: "Deslizante", nome: "Motor PPA deslizante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-ppa-basc", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "PPA", linha: "Basculante", nome: "Motor PPA basculante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-ppa-pivot", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "PPA", linha: "Pivotante", nome: "Motor PPA pivotante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-ppa-aero", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "PPA", linha: "Aero", nome: "Motor PPA Aero", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-rossi-desl", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "Rossi", linha: "Deslizante", nome: "Motor Rossi deslizante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-rossi-basc", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "Rossi", linha: "Basculante", nome: "Motor Rossi basculante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-rossi-pivot", segmento: "Automatizadores", categoriaCatalogo: "Motores", marca: "Rossi", linha: "Pivotante", nome: "Motor Rossi pivotante", categoriaEstoque: "Automação", unidade: "Kit" },
  { id: "motor-acessorio-cremalheira", segmento: "Automatizadores", categoriaCatalogo: "Acessórios", marca: "PPA / Rossi", linha: "Cremalheira", nome: "Cremalheira para automatizador", categoriaEstoque: "Automação", unidade: "Metro" },
  { id: "motor-acessorio-controle", segmento: "Automatizadores", categoriaCatalogo: "Acessórios", marca: "PPA / Rossi", linha: "Controle remoto", nome: "Controle remoto para portão", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "motor-acessorio-fotocelula", segmento: "Automatizadores", categoriaCatalogo: "Acessórios", marca: "PPA / Rossi", linha: "Fotocélula", nome: "Fotocélula para automatizador", categoriaEstoque: "Automação", unidade: "Par" },

  // Casa inteligente
  { id: "smart-int-1t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "Intelbras", linha: "1 tecla", nome: "Interruptor inteligente Intelbras 1 tecla", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-int-2t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "Intelbras", linha: "2 teclas", nome: "Interruptor inteligente Intelbras 2 teclas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-int-3t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "Intelbras", linha: "3 teclas", nome: "Interruptor inteligente Intelbras 3 teclas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-ecasa-1t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "eCasa", linha: "1 tecla", nome: "Interruptor inteligente eCasa 1 tecla", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-ecasa-2t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "eCasa", linha: "2 teclas", nome: "Interruptor inteligente eCasa 2 teclas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-ecasa-3t", segmento: "Casa inteligente", categoriaCatalogo: "Interruptores", marca: "eCasa", linha: "3 teclas", nome: "Interruptor inteligente eCasa 3 teclas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-tomada-int", segmento: "Casa inteligente", categoriaCatalogo: "Tomadas e plugues", marca: "Intelbras", linha: "Tomada inteligente", nome: "Tomada inteligente Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-tomada-ecasa", segmento: "Casa inteligente", categoriaCatalogo: "Tomadas e plugues", marca: "eCasa", linha: "Tomada inteligente", nome: "Tomada inteligente eCasa", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-rele-int", segmento: "Casa inteligente", categoriaCatalogo: "Módulos e relés", marca: "Intelbras", linha: "Relé inteligente", nome: "Relé inteligente Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-rele-ecasa", segmento: "Casa inteligente", categoriaCatalogo: "Módulos e relés", marca: "eCasa", linha: "Relé inteligente", nome: "Relé inteligente eCasa", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-hub-int", segmento: "Casa inteligente", categoriaCatalogo: "Hubs", marca: "Intelbras", linha: "Hub", nome: "Hub de automação Intelbras", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-hub-ecasa", segmento: "Casa inteligente", categoriaCatalogo: "Hubs", marca: "eCasa", linha: "Hub", nome: "Hub de automação eCasa", categoriaEstoque: "Automação", unidade: "Unidade" },

  // Materiais elétricos
  { id: "ele-disj-1p", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "Disjuntor monopolar", nome: "Disjuntor monopolar DIN", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-2p", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "Disjuntor bipolar", nome: "Disjuntor bipolar DIN", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-3p", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "Disjuntor tripolar", nome: "Disjuntor tripolar DIN", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-dr-2p", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "DR bipolar", nome: "DR bipolar", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-dr-4p", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "DR tetrapolar", nome: "DR tetrapolar", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-dps-ca", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "DPS CA", nome: "DPS para corrente alternada", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-dps-cc", segmento: "Elétrica", categoriaCatalogo: "Proteção", marca: "Genérico", linha: "DPS CC", nome: "DPS para corrente contínua", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-quadro", segmento: "Elétrica", categoriaCatalogo: "Quadros e caixas", marca: "Genérico", linha: "Quadro de distribuição", nome: "Quadro de distribuição", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-caixa-protecao", segmento: "Elétrica", categoriaCatalogo: "Quadros e caixas", marca: "Genérico", linha: "Caixa de proteção", nome: "Caixa de proteção elétrica", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-stringbox", segmento: "Elétrica", categoriaCatalogo: "Quadros e caixas", marca: "Genérico", linha: "String box", nome: "String box", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-contator", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "Contator", nome: "Contator", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-rele", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "Relé", nome: "Relé de comando", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-barramento", segmento: "Elétrica", categoriaCatalogo: "Conexão", marca: "Genérico", linha: "Barramento", nome: "Barramento elétrico", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-terminal-tubular", segmento: "Elétrica", categoriaCatalogo: "Conexão", marca: "Genérico", linha: "Terminal tubular", nome: "Terminal tubular", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-conector", segmento: "Elétrica", categoriaCatalogo: "Conexão", marca: "Genérico", linha: "Conector", nome: "Conector elétrico", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-cabo", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "Cabo elétrico", nome: "Cabo elétrico", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "solar-cabo", segmento: "Energia solar", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "Cabo solar", nome: "Cabo solar", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "solar-mc4", segmento: "Energia solar", categoriaCatalogo: "Conectores", marca: "Genérico", linha: "MC4", nome: "Conector MC4", categoriaEstoque: "Proteção elétrica", unidade: "Par" },
  { id: "ele-eletroduto", segmento: "Elétrica", categoriaCatalogo: "Infraestrutura", marca: "Genérico", linha: "Eletroduto", nome: "Eletroduto", categoriaEstoque: "Estrutura", unidade: "Metro" },
  { id: "ele-canaleta", segmento: "Elétrica", categoriaCatalogo: "Infraestrutura", marca: "Genérico", linha: "Canaleta", nome: "Canaleta", categoriaEstoque: "Estrutura", unidade: "Metro" },
  { id: "ele-condulete", segmento: "Elétrica", categoriaCatalogo: "Infraestrutura", marca: "Genérico", linha: "Condulete", nome: "Condulete", categoriaEstoque: "Estrutura", unidade: "Unidade" },
];

export const segmentosCatalogo = Array.from(
  new Set(catalogoProdutos.map((item) => item.segmento)),
).sort();

export function filtrarCatalogo({
  segmento,
  categoria,
  marca,
  linha,
}: {
  segmento?: string;
  categoria?: string;
  marca?: string;
  linha?: string;
}) {
  return catalogoProdutos.filter((item) => {
    if (segmento && item.segmento !== segmento) return false;
    if (categoria && item.categoriaCatalogo !== categoria) return false;
    if (marca && item.marca !== marca) return false;
    if (linha && item.linha !== linha) return false;
    return true;
  });
}