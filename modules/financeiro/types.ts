export type TipoLancamento = "Entrada" | "Saída";

export type OrigemLancamento =
  | "Empresa"
  | "Pessoal"
  | "Ordem de Serviço"
  | "Venda"
  | "Outro";

export type FormaPagamento =
  | "Dinheiro"
  | "PIX"
  | "Débito"
  | "Crédito"
  | "Transferência"
  | "Boleto"
  | "Outro";

export type CategoriaFinanceira =
  | "Venda"
  | "Serviço"
  | "Combustível"
  | "Alimentação"
  | "Material"
  | "Fornecedor"
  | "Salário"
  | "Imposto"
  | "Energia"
  | "Internet"
  | "Manutenção"
  | "Despesa pessoal"
  | "Outros";

export type LancamentoFinanceiro = {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data: string;
  categoria: CategoriaFinanceira;
  origem: OrigemLancamento;
  formaPagamento: FormaPagamento;
  contaId?: string;
  cartaoId?: string;
  clienteNome?: string;
  servicoId?: string;
  observacao?: string;
  criadoEm: string;
  criadoPor: string;
};

export type ContaFinanceira = {
  id: string;
  nome: string;
  tipo: "Conta bancária" | "Caixa" | "Carteira digital";
  origem: "Empresa" | "Pessoal";
  saldoInicial: number;
  ativa: boolean;
};

export type SituacaoCompraCartao = "Aberta" | "Paga" | "Cancelada";

export type CompraCartao = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  fornecedor?: string;
  contaPagarId?: string;
  observacao?: string;
  situacao: SituacaoCompraCartao;
  criadoEm: string;
};

export type CartaoFinanceiro = {
  id: string;
  nome: string;
  bandeira?: string;
  origem: "Empresa" | "Pessoal";

  limite: number;

  /**
   * Valor atualmente comprometido no cartão.
   * O limite disponível será calculado:
   * limite - limiteUtilizado
   */
  limiteUtilizado?: number;

  diaFechamento: number;
  diaVencimento: number;

  compras?: CompraCartao[];

  ativo: boolean;
};