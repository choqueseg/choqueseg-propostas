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

  // Câmeras adicionais - resoluções e formatos
  { id: "cam-int-bullet-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Bullet 2 MP", nome: "Câmera bullet Intelbras 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-dome-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Dome 2 MP", nome: "Câmera dome Intelbras 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-bullet-5mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Bullet 5 MP", nome: "Câmera bullet Intelbras 5 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-dome-5mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Intelbras", linha: "Dome 5 MP", nome: "Câmera dome Intelbras 5 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-ip-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Intelbras", linha: "IP 2 MP", nome: "Câmera IP Intelbras 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-ip-4mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Intelbras", linha: "IP 4 MP", nome: "Câmera IP Intelbras 4 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-int-ip-5mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Intelbras", linha: "IP 5 MP", nome: "Câmera IP Intelbras 5 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-hik-ip-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Hikvision", linha: "IP 2 MP", nome: "Câmera IP Hikvision 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-hik-ip-4mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Hikvision", linha: "IP 4 MP", nome: "Câmera IP Hikvision 4 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-dahua-hdcvi-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras", marca: "Dahua", linha: "HDCVI 2 MP", nome: "Câmera Dahua HDCVI 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-dahua-ip-2mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Dahua", linha: "IP 2 MP", nome: "Câmera IP Dahua 2 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-dahua-ip-4mp", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras IP", marca: "Dahua", linha: "IP 4 MP", nome: "Câmera IP Dahua 4 MP", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-wifi-interna", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras Wi-Fi", marca: "Genérico", linha: "Interna", nome: "Câmera Wi-Fi interna", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-wifi-externa", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras Wi-Fi", marca: "Genérico", linha: "Externa", nome: "Câmera Wi-Fi externa", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cam-wifi-ptz", segmento: "Segurança eletrônica", categoriaCatalogo: "Câmeras Wi-Fi", marca: "Genérico", linha: "PTZ", nome: "Câmera Wi-Fi PTZ", categoriaEstoque: "Câmera", unidade: "Unidade" },

  // Gravadores e armazenamento
  { id: "dvr-4ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Genérico", linha: "DVR 4 canais", nome: "DVR 4 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "dvr-8ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Genérico", linha: "DVR 8 canais", nome: "DVR 8 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "dvr-16ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores", marca: "Genérico", linha: "DVR 16 canais", nome: "DVR 16 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "nvr-4ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores IP", marca: "Genérico", linha: "NVR 4 canais", nome: "NVR 4 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "nvr-8ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores IP", marca: "Genérico", linha: "NVR 8 canais", nome: "NVR 8 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "nvr-16ch", segmento: "Segurança eletrônica", categoriaCatalogo: "Gravadores IP", marca: "Genérico", linha: "NVR 16 canais", nome: "NVR 16 canais", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "hd-1tb-cftv", segmento: "Segurança eletrônica", categoriaCatalogo: "Armazenamento", marca: "Genérico", linha: "1 TB", nome: "HD para CFTV 1 TB", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "hd-2tb-cftv", segmento: "Segurança eletrônica", categoriaCatalogo: "Armazenamento", marca: "Genérico", linha: "2 TB", nome: "HD para CFTV 2 TB", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "hd-4tb-cftv", segmento: "Segurança eletrônica", categoriaCatalogo: "Armazenamento", marca: "Genérico", linha: "4 TB", nome: "HD para CFTV 4 TB", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "hd-6tb-cftv", segmento: "Segurança eletrônica", categoriaCatalogo: "Armazenamento", marca: "Genérico", linha: "6 TB", nome: "HD para CFTV 6 TB", categoriaEstoque: "Câmera", unidade: "Unidade" },

  // Rede e infraestrutura para CFTV
  { id: "switch-poe-4", segmento: "Segurança eletrônica", categoriaCatalogo: "Rede e PoE", marca: "Genérico", linha: "PoE 4 portas", nome: "Switch PoE 4 portas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "switch-poe-8", segmento: "Segurança eletrônica", categoriaCatalogo: "Rede e PoE", marca: "Genérico", linha: "PoE 8 portas", nome: "Switch PoE 8 portas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "switch-poe-16", segmento: "Segurança eletrônica", categoriaCatalogo: "Rede e PoE", marca: "Genérico", linha: "PoE 16 portas", nome: "Switch PoE 16 portas", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fonte-12v-1a", segmento: "Segurança eletrônica", categoriaCatalogo: "Fontes", marca: "Genérico", linha: "12 V 1 A", nome: "Fonte 12 V 1 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "fonte-12v-5a", segmento: "Segurança eletrônica", categoriaCatalogo: "Fontes", marca: "Genérico", linha: "12 V 5 A", nome: "Fonte 12 V 5 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "balun-video", segmento: "Segurança eletrônica", categoriaCatalogo: "Acessórios CFTV", marca: "Genérico", linha: "Balun", nome: "Balun de vídeo", categoriaEstoque: "Câmera", unidade: "Par" },
  { id: "conector-bnc", segmento: "Segurança eletrônica", categoriaCatalogo: "Acessórios CFTV", marca: "Genérico", linha: "BNC", nome: "Conector BNC", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "conector-p4", segmento: "Segurança eletrônica", categoriaCatalogo: "Acessórios CFTV", marca: "Genérico", linha: "P4", nome: "Conector P4", categoriaEstoque: "Câmera", unidade: "Unidade" },
  { id: "cabo-coaxial-cftv", segmento: "Segurança eletrônica", categoriaCatalogo: "Cabos CFTV", marca: "Genérico", linha: "Coaxial", nome: "Cabo coaxial para CFTV", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "cabo-utp-cat5e", segmento: "Segurança eletrônica", categoriaCatalogo: "Rede e PoE", marca: "Genérico", linha: "CAT5e", nome: "Cabo UTP CAT5e", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "cabo-utp-cat6", segmento: "Segurança eletrônica", categoriaCatalogo: "Rede e PoE", marca: "Genérico", linha: "CAT6", nome: "Cabo UTP CAT6", categoriaEstoque: "Cabo", unidade: "Metro" },

  // Controle de acesso e fechaduras
  { id: "ctrl-acesso-facial", segmento: "Segurança eletrônica", categoriaCatalogo: "Controle de acesso", marca: "Genérico", linha: "Reconhecimento facial", nome: "Controlador de acesso facial", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "ctrl-acesso-biometria", segmento: "Segurança eletrônica", categoriaCatalogo: "Controle de acesso", marca: "Genérico", linha: "Biometria", nome: "Controlador de acesso biométrico", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "ctrl-acesso-rfid", segmento: "Segurança eletrônica", categoriaCatalogo: "Controle de acesso", marca: "Genérico", linha: "RFID", nome: "Controlador de acesso RFID", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-eletroima", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras", marca: "Genérico", linha: "Eletroímã", nome: "Fechadura eletroímã", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-eletrica", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras", marca: "Genérico", linha: "Elétrica", nome: "Fechadura elétrica", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-digital-biometria", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Genérico", linha: "Biometria", nome: "Fechadura digital biométrica", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-digital-senha", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Genérico", linha: "Senha", nome: "Fechadura digital com senha", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-digital-tag", segmento: "Segurança eletrônica", categoriaCatalogo: "Fechaduras digitais", marca: "Genérico", linha: "Tag / RFID", nome: "Fechadura digital com tag", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "fech-digital-wifi", segmento: "Casa inteligente", categoriaCatalogo: "Fechaduras inteligentes", marca: "Genérico", linha: "Wi-Fi", nome: "Fechadura inteligente Wi-Fi", categoriaEstoque: "Automação", unidade: "Unidade" },

  // Incêndio
  { id: "inc-central-end", segmento: "Sistema contra incêndio", categoriaCatalogo: "Centrais", marca: "Genérico", linha: "Endereçável", nome: "Central de alarme de incêndio endereçável", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "inc-central-conv", segmento: "Sistema contra incêndio", categoriaCatalogo: "Centrais", marca: "Genérico", linha: "Convencional", nome: "Central de alarme de incêndio convencional", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "inc-det-fumaca", segmento: "Sistema contra incêndio", categoriaCatalogo: "Detectores", marca: "Genérico", linha: "Fumaça", nome: "Detector de fumaça", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "inc-det-termico", segmento: "Sistema contra incêndio", categoriaCatalogo: "Detectores", marca: "Genérico", linha: "Térmico", nome: "Detector térmico", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "inc-acionador", segmento: "Sistema contra incêndio", categoriaCatalogo: "Acionadores", marca: "Genérico", linha: "Manual", nome: "Acionador manual de incêndio", categoriaEstoque: "Alarme", unidade: "Unidade" },
  { id: "inc-sirene", segmento: "Sistema contra incêndio", categoriaCatalogo: "Sinalização", marca: "Genérico", linha: "Audiovisual", nome: "Sirene audiovisual de incêndio", categoriaEstoque: "Alarme", unidade: "Unidade" },

  // Automação residencial / casa inteligente
  { id: "smart-modulo-1canal", segmento: "Casa inteligente", categoriaCatalogo: "Módulos e relés", marca: "Genérico", linha: "1 canal", nome: "Módulo Wi-Fi 1 canal", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-modulo-2canais", segmento: "Casa inteligente", categoriaCatalogo: "Módulos e relés", marca: "Genérico", linha: "2 canais", nome: "Módulo Wi-Fi 2 canais", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-modulo-4canais", segmento: "Casa inteligente", categoriaCatalogo: "Módulos e relés", marca: "Genérico", linha: "4 canais", nome: "Módulo Wi-Fi 4 canais", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-dimmer", segmento: "Casa inteligente", categoriaCatalogo: "Iluminação", marca: "Genérico", linha: "Dimmer", nome: "Dimmer inteligente Wi-Fi", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-sensor-presenca", segmento: "Casa inteligente", categoriaCatalogo: "Sensores", marca: "Genérico", linha: "Presença", nome: "Sensor inteligente de presença", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-sensor-porta", segmento: "Casa inteligente", categoriaCatalogo: "Sensores", marca: "Genérico", linha: "Porta / janela", nome: "Sensor inteligente de porta e janela", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-ir", segmento: "Casa inteligente", categoriaCatalogo: "Controle universal", marca: "Genérico", linha: "IR", nome: "Controle universal infravermelho Wi-Fi", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "smart-medidor", segmento: "Casa inteligente", categoriaCatalogo: "Medição", marca: "Genérico", linha: "Energia", nome: "Medidor inteligente de energia", categoriaEstoque: "Automação", unidade: "Unidade" },

  // Carregadores veiculares
  { id: "ev-7kw", segmento: "Carregadores veiculares", categoriaCatalogo: "Wallbox", marca: "Genérico", linha: "7 kW", nome: "Carregador veicular Wallbox 7 kW", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "ev-11kw", segmento: "Carregadores veiculares", categoriaCatalogo: "Wallbox", marca: "Genérico", linha: "11 kW", nome: "Carregador veicular Wallbox 11 kW", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "ev-22kw", segmento: "Carregadores veiculares", categoriaCatalogo: "Wallbox", marca: "Genérico", linha: "22 kW", nome: "Carregador veicular Wallbox 22 kW", categoriaEstoque: "Automação", unidade: "Unidade" },
  { id: "ev-cabo-tipo2", segmento: "Carregadores veiculares", categoriaCatalogo: "Acessórios", marca: "Genérico", linha: "Tipo 2", nome: "Cabo para carregador veicular Tipo 2", categoriaEstoque: "Cabo", unidade: "Unidade" },

  // Módulos fotovoltaicos - marcas e potências
  { id: "mod-jinko-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Jinko Solar", linha: "585 W", nome: "Módulo fotovoltaico Jinko Solar 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-jinko-610", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Jinko Solar", linha: "610 W", nome: "Módulo fotovoltaico Jinko Solar 610 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-jinko-630", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Jinko Solar", linha: "630 W", nome: "Módulo fotovoltaico Jinko Solar 630 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-jinko-710", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Jinko Solar", linha: "710 W", nome: "Módulo fotovoltaico Jinko Solar 710 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-canadian-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Canadian Solar", linha: "585 W", nome: "Módulo fotovoltaico Canadian Solar 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-canadian-610", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Canadian Solar", linha: "610 W", nome: "Módulo fotovoltaico Canadian Solar 610 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-ja-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "JA Solar", linha: "585 W", nome: "Módulo fotovoltaico JA Solar 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-ja-610", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "JA Solar", linha: "610 W", nome: "Módulo fotovoltaico JA Solar 610 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-trina-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Trina Solar", linha: "585 W", nome: "Módulo fotovoltaico Trina Solar 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-trina-610", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Trina Solar", linha: "610 W", nome: "Módulo fotovoltaico Trina Solar 610 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-longi-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "LONGi", linha: "585 W", nome: "Módulo fotovoltaico LONGi 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-risen-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Risen", linha: "585 W", nome: "Módulo fotovoltaico Risen 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },
  { id: "mod-astronergy-585", segmento: "Energia solar", categoriaCatalogo: "Módulos fotovoltaicos", marca: "Astronergy", linha: "585 W", nome: "Módulo fotovoltaico Astronergy 585 W", categoriaEstoque: "Módulo solar", unidade: "Unidade" },

  // Inversores string - marcas e potências
  { id: "inv-solplanet-3", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Solplanet", linha: "3 kW", nome: "Inversor Solplanet 3 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-solplanet-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Solplanet", linha: "5 kW", nome: "Inversor Solplanet 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-solplanet-6", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Solplanet", linha: "6 kW", nome: "Inversor Solplanet 6 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-solplanet-7_5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Solplanet", linha: "7,5 kW", nome: "Inversor Solplanet 7,5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-solplanet-10", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Solplanet", linha: "10 kW", nome: "Inversor Solplanet 10 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-growatt-3", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Growatt", linha: "3 kW", nome: "Inversor Growatt 3 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-growatt-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Growatt", linha: "5 kW", nome: "Inversor Growatt 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-growatt-6", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Growatt", linha: "6 kW", nome: "Inversor Growatt 6 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-growatt-10", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Growatt", linha: "10 kW", nome: "Inversor Growatt 10 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-huawei-3", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Huawei", linha: "3 kW", nome: "Inversor Huawei 3 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-huawei-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Huawei", linha: "5 kW", nome: "Inversor Huawei 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-huawei-6", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Huawei", linha: "6 kW", nome: "Inversor Huawei 6 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-huawei-10", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Huawei", linha: "10 kW", nome: "Inversor Huawei 10 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-saj-3", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "SAJ", linha: "3 kW", nome: "Inversor SAJ 3 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-saj-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "SAJ", linha: "5 kW", nome: "Inversor SAJ 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-saj-6", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "SAJ", linha: "6 kW", nome: "Inversor SAJ 6 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-saj-10", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "SAJ", linha: "10 kW", nome: "Inversor SAJ 10 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-foxess-3", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "FoxESS", linha: "3 kW", nome: "Inversor FoxESS 3 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-foxess-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "FoxESS", linha: "5 kW", nome: "Inversor FoxESS 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-foxess-6", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "FoxESS", linha: "6 kW", nome: "Inversor FoxESS 6 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-deye-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Deye", linha: "5 kW", nome: "Inversor Deye 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-deye-8", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Deye", linha: "8 kW", nome: "Inversor Deye 8 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-sungrow-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Sungrow", linha: "5 kW", nome: "Inversor Sungrow 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-sungrow-10", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Sungrow", linha: "10 kW", nome: "Inversor Sungrow 10 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-goodwe-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "GoodWe", linha: "5 kW", nome: "Inversor GoodWe 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "inv-fronius-5", segmento: "Energia solar", categoriaCatalogo: "Inversores string", marca: "Fronius", linha: "5 kW", nome: "Inversor Fronius 5 kW", categoriaEstoque: "Inversor", unidade: "Unidade" },

  // Microinversores
  { id: "micro-hoymiles-1", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "Hoymiles", linha: "1 entrada", nome: "Microinversor Hoymiles 1 entrada", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-hoymiles-2", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "Hoymiles", linha: "2 entradas", nome: "Microinversor Hoymiles 2 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-hoymiles-4", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "Hoymiles", linha: "4 entradas", nome: "Microinversor Hoymiles 4 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-deye-2", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "Deye", linha: "2 entradas", nome: "Microinversor Deye 2 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-deye-4", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "Deye", linha: "4 entradas", nome: "Microinversor Deye 4 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-aps-2", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "APsystems", linha: "2 entradas", nome: "Microinversor APsystems 2 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },
  { id: "micro-aps-4", segmento: "Energia solar", categoriaCatalogo: "Microinversores", marca: "APsystems", linha: "4 entradas", nome: "Microinversor APsystems 4 entradas", categoriaEstoque: "Inversor", unidade: "Unidade" },

  // Estruturas e acessórios solares
  { id: "solar-trilho-aluminio", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Trilho alumínio", nome: "Trilho de alumínio para módulos solares", categoriaEstoque: "Estrutura", unidade: "Metro" },
  { id: "solar-grampo-final", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Grampo final", nome: "Grampo final para módulo solar", categoriaEstoque: "Estrutura", unidade: "Unidade" },
  { id: "solar-grampo-inter", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Grampo intermediário", nome: "Grampo intermediário para módulo solar", categoriaEstoque: "Estrutura", unidade: "Unidade" },
  { id: "solar-gancho-ceramica", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Telha cerâmica", nome: "Gancho para telha cerâmica", categoriaEstoque: "Estrutura", unidade: "Unidade" },
  { id: "solar-suporte-fibro", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Fibrocimento", nome: "Suporte para telha de fibrocimento", categoriaEstoque: "Estrutura", unidade: "Unidade" },
  { id: "solar-suporte-metalica", segmento: "Energia solar", categoriaCatalogo: "Estruturas", marca: "Genérico", linha: "Telha metálica", nome: "Suporte para telha metálica", categoriaEstoque: "Estrutura", unidade: "Unidade" },
  { id: "solar-cabo-4mm", segmento: "Energia solar", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "4 mm²", nome: "Cabo solar 4 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "solar-cabo-6mm", segmento: "Energia solar", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "6 mm²", nome: "Cabo solar 6 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "solar-stringbox-1mppt", segmento: "Energia solar", categoriaCatalogo: "Proteções CC", marca: "Genérico", linha: "1 MPPT", nome: "String box CC 1 MPPT", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "solar-stringbox-2mppt", segmento: "Energia solar", categoriaCatalogo: "Proteções CC", marca: "Genérico", linha: "2 MPPT", nome: "String box CC 2 MPPT", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },

  // Elétrica - bitolas, proteções e comando
  { id: "ele-cabo-1_5", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "1,5 mm²", nome: "Cabo elétrico 1,5 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-cabo-2_5", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "2,5 mm²", nome: "Cabo elétrico 2,5 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-cabo-4", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "4 mm²", nome: "Cabo elétrico 4 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-cabo-6", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "6 mm²", nome: "Cabo elétrico 6 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-cabo-10", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "10 mm²", nome: "Cabo elétrico 10 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-cabo-16", segmento: "Elétrica", categoriaCatalogo: "Cabos", marca: "Genérico", linha: "16 mm²", nome: "Cabo elétrico 16 mm²", categoriaEstoque: "Cabo", unidade: "Metro" },
  { id: "ele-disj-10a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "10 A", nome: "Disjuntor DIN 10 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-16a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "16 A", nome: "Disjuntor DIN 16 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-20a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "20 A", nome: "Disjuntor DIN 20 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-25a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "25 A", nome: "Disjuntor DIN 25 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-32a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "32 A", nome: "Disjuntor DIN 32 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-40a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "40 A", nome: "Disjuntor DIN 40 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-50a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "50 A", nome: "Disjuntor DIN 50 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-disj-63a", segmento: "Elétrica", categoriaCatalogo: "Disjuntores", marca: "Genérico", linha: "63 A", nome: "Disjuntor DIN 63 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-contator-25a", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "25 A", nome: "Contator 25 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-contator-40a", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "40 A", nome: "Contator 40 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-contator-60a", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "60 A", nome: "Contator 60 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },
  { id: "ele-contator-80a", segmento: "Elétrica", categoriaCatalogo: "Comando", marca: "Genérico", linha: "80 A", nome: "Contator 80 A", categoriaEstoque: "Proteção elétrica", unidade: "Unidade" },

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