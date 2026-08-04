export type CategoriaProduto =
  | "Segurança Eletrônica"
  | "Elétrica"
  | "Automação"
  | "Energia Solar"
  | "Mão de Obra"
  | "Outros";

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaProduto;
  unidade: string;
  valorCusto: number;
  valorVenda: number;
  ativo: boolean;
};

export const produtosIniciais: Produto[] = [
  {
    id: "camera-bullet",
    nome: "Câmera Bullet",
    descricao: "Câmera de segurança para área interna ou externa",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 89.90,
    valorVenda: 179.50,
    ativo: true,
  },
  {
    id: "camera-dome",
    nome: "Câmera Dome",
    descricao: "Câmera de segurança com formato dome",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "dvr",
    nome: "DVR",
    descricao: "Gravador digital para sistema de câmeras",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "nvr",
    nome: "NVR",
    descricao: "Gravador de vídeo para câmeras IP",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "hd-vigilancia",
    nome: "HD para Vigilância",
    descricao: "Disco rígido próprio para gravação contínua",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "fonte-camera",
    nome: "Fonte para Câmeras",
    descricao: "Fonte de alimentação para sistema de câmeras",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "cabo-coaxial",
    nome: "Cabo Coaxial",
    descricao: "Cabo para instalação de câmeras analógicas",
    categoria: "Segurança Eletrônica",
    unidade: "metro",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "cabo-rede",
    nome: "Cabo de Rede",
    descricao: "Cabo de rede para câmeras IP e equipamentos",
    categoria: "Segurança Eletrônica",
    unidade: "metro",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "conector-bnc",
    nome: "Conector BNC",
    descricao: "Conector para câmeras analógicas",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "conector-p4",
    nome: "Conector P4",
    descricao: "Conector de alimentação para câmeras",
    categoria: "Segurança Eletrônica",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "fechadura-digital",
    nome: "Fechadura Digital",
    descricao: "Fechadura com senha, biometria ou aplicativo",
    categoria: "Automação",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "interruptor-inteligente",
    nome: "Interruptor Inteligente",
    descricao: "Interruptor Wi-Fi com controle por aplicativo",
    categoria: "Automação",
    unidade: "unidade",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
  {
    id: "mao-de-obra-seguranca",
    nome: "Mão de Obra de Instalação",
    descricao: "Instalação, configuração e testes do sistema",
    categoria: "Mão de Obra",
    unidade: "serviço",
    valorCusto: 0,
    valorVenda: 0,
    ativo: true,
  },
];