export type PerfilUsuario = "administrador" | "funcionario";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
};

export type Funcionario = {
  id: string;
  nome: string;
  usuario: string;
  nivelAcesso: string;
  status: "Ativo" | "Inativo";
};

export type StatusServico =
  | "Agendado"
  | "Em deslocamento"
  | "Em execução"
  | "Concluído";

export type ItemChecklist = {
  id: string;
  titulo: string;
  concluido: boolean;
};

export type MaterialUtilizado = {
  id: string;
  descricao: string;
  quantidade: string;
  valorUnitario?: number;
  valorTotal?: number;
  observacao?: string;
};

export type FotoServico = {
  id: string;
  etapa: "Antes" | "Durante" | "Depois";
  nome: string;
  dados: string;
  criadaEm: string;
};

export type EventoHistorico = {
  id: string;
  dataHora: string;
  usuario: string;
  descricao: string;
};

export type DespesasServico = {
  combustivel: number;
  alimentacao: number;
  pedagio: number;
  outros: number;
  descricaoOutros?: string;
};

export type Servico = {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone?: string;
  tipoServico: string;
  data: string;
  horario: string;
  endereco: string;
  cidade: string;
  equipe: string;
  descricao: string;
  status: StatusServico;

  checklist?: ItemChecklist[];
  materiais?: MaterialUtilizado[];
  fotos?: FotoServico[];

  observacoesTecnico?: string;
  assinaturaCliente?: string;

  saidaEmpresaEm?: string;
  chegadaClienteEm?: string;

  iniciadoEm?: string;
  iniciadoPor?: string;

  concluidoEm?: string;
  concluidoPor?: string;

  quilometragemInicial?: number;
  quilometragemFinal?: number;

  despesas?: DespesasServico;

  historico?: EventoHistorico[];
};