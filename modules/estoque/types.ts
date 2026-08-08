export type CategoriaEstoque =
  | "Módulo solar"
  | "Inversor"
  | "Estrutura"
  | "Cabo"
  | "Proteção elétrica"
  | "Câmera"
  | "Alarme"
  | "Automação"
  | "Ferramenta"
  | "Outros";

export type UnidadeEstoque =
  | "Unidade"
  | "Metro"
  | "Rolo"
  | "Caixa"
  | "Kit"
  | "Par";

export type ProdutoEstoque = {
  id: string;
  nome: string;
  categoria: CategoriaEstoque;
  fabricante?: string;
  modelo?: string;
  codigo?: string;
  unidade: UnidadeEstoque;
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoUnitario: number;
  fornecedor?: string;
  localArmazenamento?: string;
  observacao?: string;
  imagemUrl?: string;
  paginaProdutoUrl?: string;
  manualUrl?: string;
  especificacoes?: Record<string, string>;
  ativo: boolean;
  criadoEm: string;
};

export type TipoMovimentacaoEstoque =
  | "Entrada"
  | "Saída"
  | "Ajuste positivo"
  | "Ajuste negativo";

export type MovimentacaoEstoque = {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number;
  custoUnitario?: number;
  motivo: string;
  servicoId?: string;
  clienteNome?: string;
  fornecedor?: string;
  data: string;
  criadoEm: string;
  criadoPor: string;
};