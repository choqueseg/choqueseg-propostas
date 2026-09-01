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

export type FotoVistoriaSolar = {
  id: string;
  categoria:
    | "Telhado"
    | "Padrão de entrada"
    | "Quadro elétrico"
    | "Local do inversor"
    | "Sombreamento"
    | "Acesso"
    | "Outros";
  nome: string;
  dados: string;
  criadaEm: string;
  observacao?: string;
};

export type VistoriaTecnicaSolar = {
  tipoImovel?: "Térreo" | "1º andar" | "2º andar ou mais" | "Comercial" | "Outro";
  tipoTelhado?:
    | "Cerâmico"
    | "Fibrocimento"
    | "Metálico"
    | "Laje"
    | "Colonial"
    | "Sanduíche"
    | "Outro";
  estadoTelhado?: "Bom" | "Regular" | "Necessita reparo";
  estruturaTelhado?: "Madeira" | "Metálica" | "Concreto" | "Não verificado" | "Outro";
  acessoTelhado?: "Fácil" | "Médio" | "Difícil";
  necessitaEscadaEspecial?: boolean;
  necessitaAndaime?: boolean;
  alturaAproximadaMetros?: number;

  existeSombreamento?: "Não" | "Parcial" | "Sim";
  origemSombreamento?: string;
  areaDisponivel?: "Suficiente" | "Limitada" | "Não verificada";
  orientacaoTelhado?: "Norte" | "Nordeste" | "Noroeste" | "Leste" | "Oeste" | "Sul" | "Múltiplas águas" | "Não verificada";

  tipoLigacao?: "Monofásica" | "Bifásica" | "Trifásica" | "Não identificado";
  tensaoRede?: "127 V" | "220 V" | "127/220 V" | "380 V" | "Não identificado";
  disjuntorPadrao?: string;
  amperagemDisjuntor?: string;
  bitolaCaboEntrada?: string;
  materialCaboEntrada?: "Cobre" | "Alumínio" | "Não identificado";
  padraoEntrada?: "Interno" | "Externo" | "Poste" | "Muro" | "Outro";
  estadoPadraoEntrada?: "Bom" | "Regular" | "Necessita adequação";
  aterramentoExistente?: "Sim" | "Não" | "Não verificado";
  hasteAterramento?: "Sim" | "Não" | "Não verificado";
  quadroPossuiEspaco?: "Sim" | "Não" | "Limitado";
  drExistente?: "Sim" | "Não" | "Não verificado";
  dpsExistente?: "Sim" | "Não" | "Não verificado";

  localInversor?: "Garagem" | "Área de serviço" | "Corredor" | "Parede externa coberta" | "Outro";
  localInversorObservacao?: string;
  distanciaModulosInversorMetros?: number;
  distanciaInversorQuadroMetros?: number;
  rotaCabos?: "Fácil" | "Média" | "Difícil" | "Não definida";

  quantidadeModulosPrevista?: number;
  potenciaModuloPrevista?: string;
  potenciaInversorPrevista?: string;
  observacoes?: string;

  fotos?: FotoVistoriaSolar[];
  preenchidaEm?: string;
  preenchidaPor?: string;
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

  vistoriaSolar?: VistoriaTecnicaSolar;

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