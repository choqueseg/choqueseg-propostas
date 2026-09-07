"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHAVE_RECEBER = "choqueseg-financeiro-contas-receber";
const CHAVE_PAGAR = "choqueseg-financeiro-contas-pagar";
const EVENTO_FINANCEIRO = "choqueseg-financeiro-atualizado";

type TelaSistema =
  | "dashboard"
  | "propostas"
  | "energia-solar"
  | "seguranca-eletronica"
  | "eletrica"
  | "automacao"
  | "cadastro-produtos"
  | "clientes"
  | "funil"
  | "agenda"
  | "financeiro"
  | "recibos"
  | "funcionarios";

type StatusCliente =
  | "Novo Contato"
  | "Orçamento Solicitado"
  | "Orçamento Enviado"
  | "Retorno em 2 dias"
  | "Negociação"
  | "Serviço Fechado"
  | "Agendado"
  | "Em Execução"
  | "Concluído"
  | "Pós-venda";

type AcaoGlobal =
  | "abrir_modulo"
  | "cliente_buscar"
  | "cliente_criar"
  | "funil_status"
  | "agenda_servico"
  | "agenda_compromisso"
  | "receber_criar"
  | "receber_baixar"
  | "pagar_criar"
  | "desconhecida";

type ClienteBanco = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  endereco: string | null;
  cpf_cnpj?: string | null;
  tipo_servico: string | null;
  origem: string | null;
  observacoes: string | null;
  status: string | null;
};

type ContaReceber = {
  id: string;
  descricao: string;
  cliente: string;
  categoria: string;
  valorTotal: number;
  valorRecebido: number;
  vencimento: string;
  formaRecebimento: string;
  contaFinanceira: string;
  situacao: "Pendente" | "Recebido" | "Atrasado" | "Parcial";
  observacao?: string;
  telefoneCliente?: string;
  recorrenciaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  criadoEm: string;
};

type ContaPagar = {
  id: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  valor: number;
  vencimento: string;
  formaPagamento: string;
  contaFinanceira: string;
  situacao: "Pendente" | "Pago" | "Atrasado";
  observacao?: string;
  recorrenciaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  criadoEm: string;
};

type Interpretacao = {
  acao: AcaoGlobal;
  modulo: string;
  transcricao: string;
  pessoa: string;
  telefone: string;
  cidade: string;
  endereco: string;
  tipoServico: string;
  origem: string;
  descricao: string;
  valor: number;
  vencimento: string;
  parcelas: number;
  data: string;
  horario: string;
  horarioFim: string;
  local: string;
  statusDestino: StatusCliente | "";
  telaDestino: TelaSistema | "";
  categoria: string;
  forma: string;
  contaId?: string;
  saldoAntes?: number;
  saldoDepois?: number;
  candidatosReceber?: ContaReceber[];
  clienteId?: string;
  aviso?: string;
  bloqueado?: boolean;
};

const NUMEROS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
};

function normalizar(texto: string) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hojeISO() {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function numeroFalado(texto: string) {
  const palavras = normalizar(texto).replace(/\be\b/g, " ").split(/\s+/);
  let total = 0;
  let bloco = 0;
  let encontrou = false;

  for (const palavra of palavras) {
    if (/^\d+(?:[.,]\d+)?$/.test(palavra)) {
      bloco += Number(palavra.replace(/\./g, "").replace(",", "."));
      encontrou = true;
      continue;
    }

    if (palavra === "mil") {
      bloco = (bloco || 1) * 1000;
      total += bloco;
      bloco = 0;
      encontrou = true;
      continue;
    }

    if (palavra === "milhao" || palavra === "milhoes") {
      bloco = (bloco || 1) * 1_000_000;
      total += bloco;
      bloco = 0;
      encontrou = true;
      continue;
    }

    if (NUMEROS[palavra] !== undefined) {
      bloco += NUMEROS[palavra];
      encontrou = true;
    }
  }

  return encontrou ? total + bloco : 0;
}

function extrairValor(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  const numero = texto.match(
    /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real)?/,
  )?.[1];

  if (numero) {
    const convertido = Number(
      numero.includes(",") ? numero.replace(/\./g, "").replace(",", ".") : numero,
    );
    if (Number.isFinite(convertido)) return convertido;
  }

  const trecho = texto.match(
    /(?:deve|devendo|pagou|paguei|pagar|valor de|receber|custou|gastei)\s+(.+?)(?:\s+(?:reais?|real|para|dia|vence|vencimento|em\s+\d+\s+parcelas?)|$)/,
  )?.[1];

  return trecho ? numeroFalado(trecho) : 0;
}

function extrairParcelas(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  const numerico =
    texto.match(/\b(?:em|parcelado em|dividido em)\s+(\d+)\s+(?:parcelas?|vezes|x|meses)\b/)?.[1] ||
    texto.match(/\b(\d+)\s*(?:x|parcelas?)\b/)?.[1];

  return numerico ? Math.max(1, Math.min(120, Number(numerico))) : 1;
}

function extrairData(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  const agora = new Date(`${hojeISO()}T12:00:00`);

  if (/\bhoje\b/.test(texto)) return hojeISO();
  if (/\bamanha\b/.test(texto)) {
    agora.setDate(agora.getDate() + 1);
    return agora.toISOString().slice(0, 10);
  }

  const completa = texto.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (completa) {
    const dia = Number(completa[1]);
    const mes = Number(completa[2]);
    let ano = Number(completa[3]);
    if (ano < 100) ano += 2000;
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  const dia = texto.match(/\b(?:dia|vence dia|para dia|vencimento dia)\s+(\d{1,2})\b/)?.[1];
  if (!dia) return "";

  const candidato = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    Number(dia),
    12,
  );
  if (candidato.getTime() < agora.getTime()) candidato.setMonth(candidato.getMonth() + 1);

  return `${candidato.getFullYear()}-${String(candidato.getMonth() + 1).padStart(2, "0")}-${String(
    candidato.getDate(),
  ).padStart(2, "0")}`;
}

function extrairHorarios(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  const intervalo = texto.match(
    /(?:das?|de)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?\s*(?:as|ate|a)\s+(\d{1,2})(?::(\d{2}))?/,
  );

  if (intervalo) {
    const inicio = `${String(Number(intervalo[1])).padStart(2, "0")}:${intervalo[2] || "00"}`;
    const fim = `${String(Number(intervalo[3])).padStart(2, "0")}:${intervalo[4] || "00"}`;
    return { inicio, fim };
  }

  const unico = texto.match(/(?:as|às|a partir das?)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?/);
  if (unico) {
    const inicio = `${String(Number(unico[1])).padStart(2, "0")}:${unico[2] || "00"}`;
    return { inicio, fim: "" };
  }

  return { inicio: "", fim: "" };
}

function adicionarMeses(dataISO: string, quantidade: number) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const base = new Date(ano, mes - 1 + quantidade, 1);
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const diaSeguro = Math.min(dia, ultimoDia);

  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    diaSeguro,
  ).padStart(2, "0")}`;
}

function lerLista<T>(chave: string): T[] {
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarLista<T>(chave: string, lista: T[]) {
  localStorage.setItem(chave, JSON.stringify(lista));
  window.dispatchEvent(new CustomEvent(EVENTO_FINANCEIRO));
}

function calcularSituacaoReceber(total: number, recebido: number, vencimento: string): ContaReceber["situacao"] {
  if (recebido >= total) return "Recebido";
  if (recebido > 0) return "Parcial";
  if (vencimento && vencimento < hojeISO()) return "Atrasado";
  return "Pendente";
}

function detectarForma(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  if (/\bpix\b/.test(texto)) return "PIX";
  if (/\bdinheiro|especie\b/.test(texto)) return "Dinheiro";
  if (/\bdebito\b/.test(texto)) return "Débito";
  if (/\bcredito|cartao\b/.test(texto)) return "Crédito";
  if (/\btransferencia\b/.test(texto)) return "Transferência";
  if (/\bboleto\b/.test(texto)) return "Boleto";
  return "PIX";
}

function detectarCategoria(textoOriginal: string, tipo: "receber" | "pagar") {
  const texto = normalizar(textoOriginal);
  if (/\bsolar|energia solar|modulo|inversor\b/.test(texto)) return tipo === "receber" ? "Energia Solar" : "Material";
  if (/\bcamera|alarme|cerca|seguranca\b/.test(texto)) return tipo === "receber" ? "Segurança Eletrônica" : "Material";
  if (/\beletrica|disjuntor|dps|fio|cabo\b/.test(texto)) return tipo === "receber" ? "Elétrica" : "Material";
  if (/\bautomacao|casa inteligente\b/.test(texto)) return tipo === "receber" ? "Automação" : "Material";
  if (/\bcombustivel|gasolina|etanol|diesel|posto\b/.test(texto)) return "Combustível";
  if (/\balimentacao|almoco|lanche|janta|refeicao\b/.test(texto)) return "Alimentação";
  if (/\bfornecedor\b/.test(texto)) return "Fornecedor";
  if (/\bsalario\b/.test(texto)) return "Salário";
  if (/\bimposto|tributo|taxa\b/.test(texto)) return "Imposto";
  if (/\binternet|wifi\b/.test(texto)) return "Internet";
  if (/\bmanutencao|conserto|reparo\b/.test(texto)) return "Manutenção";
  return tipo === "receber" ? "Serviço" : "Outros";
}

function detectarTipoServico(textoOriginal: string) {
  const texto = normalizar(textoOriginal);
  if (/\bsolar|energia solar|placa solar|fotovoltaico\b/.test(texto)) return "Energia Solar";
  if (/\bcamera|cftv|alarme|cerca eletrica|seguranca\b/.test(texto)) return "Segurança Eletrônica";
  if (/\beletrica|quadro|disjuntor|dps|tomada|iluminacao\b/.test(texto)) return "Elétrica";
  if (/\bautomacao|casa inteligente|interruptor inteligente|fechadura digital\b/.test(texto)) return "Automação";
  return "";
}

function detectarStatus(textoOriginal: string): StatusCliente | "" {
  const texto = normalizar(textoOriginal);
  if (/orcamento solicitado|pediu orcamento/.test(texto)) return "Orçamento Solicitado";
  if (/orcamento enviado|proposta enviada/.test(texto)) return "Orçamento Enviado";
  if (/retorno em 2 dias|aguardando retorno/.test(texto)) return "Retorno em 2 dias";
  if (/negociacao|negociando/.test(texto)) return "Negociação";
  if (/servico fechado|fechou o servico|adiantamento pago/.test(texto)) return "Serviço Fechado";
  if (/agendado|servico agendado/.test(texto)) return "Agendado";
  if (/em execucao|iniciou o servico/.test(texto)) return "Em Execução";
  if (/concluido|servico concluido|finalizado/.test(texto)) return "Concluído";
  if (/pos-venda|pos venda/.test(texto)) return "Pós-venda";
  if (/novo contato|novo cliente/.test(texto)) return "Novo Contato";
  return "";
}

function extrairPessoa(textoOriginal: string, acao: AcaoGlobal) {
  const padroes: RegExp[] =
    acao === "cliente_buscar"
      ? [
          /(?:busque|buscar|procure|procurar|localize|localizar|ache|encontre|mostrar|mostre)\s+(?:o\s+)?cliente\s+(.+?)(?:,|$)/i,
          /cliente\s+(.+?)(?:,|$)/i,
        ]
      : acao === "receber_criar"
      ? [
          /cliente\s+(.+?)(?:,|\s+deve\b|\s+esta devendo\b)/i,
          /^(.+?)\s+(?:deve|esta devendo)\b/i,
        ]
      : acao === "receber_baixar"
        ? [/^(.+?)\s+(?:pagou|me pagou)\b/i, /cliente\s+(.+?)\s+(?:pagou|me pagou)\b/i]
        : acao === "pagar_criar"
          ? [/fornecedor\s+(.+?)(?:,|\s+de\s+|\s+vence\b)/i]
          : acao === "funil_status"
            ? [/(?:passe|mova|coloque)\s+(?:o cliente\s+)?(.+?)\s+(?:para|em)\s+/i, /^(.+?)\s+(?:fechou|entrou|passou)\b/i]
            : acao === "agenda_servico"
              ? [/(?:agende|agendar)\s+(?:o cliente\s+)?(.+?)\s+(?:para|dia|amanha|hoje)/i]
              : [];

  for (const padrao of padroes) {
    const valor = textoOriginal.match(padrao)?.[1]?.trim();
    if (valor) return valor.replace(/^cliente\s+/i, "").trim();
  }

  return "";
}

function detectarModuloAbrir(textoOriginal: string): TelaSistema | "" {
  const texto = normalizar(textoOriginal);
  if (/abrir|abra|ir para|va para/.test(texto)) {
    if (/financeiro/.test(texto)) return "financeiro";
    if (/agenda/.test(texto)) return "agenda";
    if (/funil/.test(texto)) return "funil";
    if (/clientes?/.test(texto)) return "clientes";
    if (/propostas?/.test(texto)) return "propostas";
    if (/recibos?/.test(texto)) return "recibos";
    if (/funcionarios?/.test(texto)) return "funcionarios";
    if (/energia solar/.test(texto)) return "energia-solar";
    if (/seguranca eletronica/.test(texto)) return "seguranca-eletronica";
    if (/eletrica/.test(texto)) return "eletrica";
    if (/automacao|casa inteligente/.test(texto)) return "automacao";
  }
  return "";
}

function detectarAcao(textoOriginal: string): AcaoGlobal {
  const texto = normalizar(textoOriginal);
  if (detectarModuloAbrir(textoOriginal)) return "abrir_modulo";
  if (
    /\b(busque|buscar|procure|procurar|localize|localizar|ache|encontre|mostrar|mostre)\b/.test(texto) &&
    /\bcliente\b/.test(texto)
  ) return "cliente_buscar";
  if (/\b(cadastre|cadastrar|novo cliente|adicionar cliente)\b/.test(texto)) return "cliente_criar";
  if (/\b(passe|mova|coloque)\b/.test(texto) && detectarStatus(textoOriginal)) return "funil_status";
  if (/\b(fechou o servico|orcamento enviado|proposta enviada|servico concluido)\b/.test(texto)) return "funil_status";
  if (/\b(agende|agendar)\b/.test(texto) && /\b(cliente|servico|instalacao|visita|vistoria|manutencao|solar|camera|cerca|eletrica|automacao)\b/.test(texto)) return "agenda_servico";
  if (/\b(compromisso|reuniao|lembrete|visita pessoal|atividade)\b/.test(texto) && /\b(dia|hoje|amanha|as|das)\b/.test(texto)) return "agenda_compromisso";
  if (/\b(pagou|me pagou|recebi do cliente)\b/.test(texto)) return "receber_baixar";
  if (/\b(deve|esta devendo|conta a receber|tenho a receber|vai pagar)\b/.test(texto)) return "receber_criar";
  if (/\b(conta a pagar|tenho que pagar|preciso pagar|fornecedor|boleto)\b/.test(texto)) return "pagar_criar";
  return "desconhecida";
}

function extrairTelefone(textoOriginal: string) {
  const encontrado = textoOriginal.match(/(?:telefone|whatsapp|numero)\s*[:,-]?\s*([\d\s().+-]{8,})/i)?.[1] || "";
  return encontrado.replace(/\D/g, "");
}

function extrairCidade(textoOriginal: string) {
  return (
    textoOriginal.match(/(?:cidade|em)\s+([A-Za-zÀ-ÿ\s]+?)(?:,|\s+telefone|\s+whatsapp|\s+endereco|\s+servico|$)/i)?.[1] || ""
  ).trim();
}

function extrairDescricaoCompromisso(textoOriginal: string) {
  return textoOriginal
    .replace(/^(crie|criar|adicione|adicionar)?\s*/i, "")
    .replace(/\b(compromisso|reuniao|lembrete|atividade)\b/i, "")
    .replace(/\b(hoje|amanha|dia\s+\d{1,2})\b/gi, "")
    .replace(/(?:das?|de)\s+\d{1,2}(?::\d{2})?\s*(?:as|ate|a)\s+\d{1,2}(?::\d{2})?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CentralVozGlobal({
  alterarTela,
}: {
  alterarTela: (tela: TelaSistema) => void;
}) {
  const [clientes, setClientes] = useState<ClienteBanco[]>([]);
  const [ouvindo, setOuvindo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [interpretacao, setInterpretacao] = useState<Interpretacao | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    void carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id,nome,telefone,cidade,endereco,cpf_cnpj,tipo_servico,origem,observacoes,status")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Central de Voz - clientes:", error);
      return;
    }

    setClientes((data ?? []) as ClienteBanco[]);
  }

  function limparNomeBusca(nome: string) {
    return normalizar(nome)
      .replace(/\b(sr|senhor|sra|senhora|seu|dona|cliente)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function melhorCorrespondencia(lista: ClienteBanco[], nomeFalado: string) {
    const procurado = limparNomeBusca(nomeFalado);
    if (!procurado) return undefined;

    const tokensBusca = procurado.split(" ").filter((token) => token.length >= 2);

    const pontuados = lista
      .map((cliente) => {
        const nome = limparNomeBusca(cliente.nome);
        const tokensNome = nome.split(" ").filter(Boolean);

        let pontos = 0;

        if (nome === procurado) pontos += 100;
        if (nome.startsWith(procurado) || procurado.startsWith(nome)) pontos += 60;
        if (nome.includes(procurado) || procurado.includes(nome)) pontos += 50;

        const tokensEncontrados = tokensBusca.filter((token) =>
          tokensNome.some(
            (parte) =>
              parte === token ||
              parte.startsWith(token) ||
              token.startsWith(parte),
          ),
        ).length;

        pontos += tokensEncontrados * 20;

        if (tokensBusca.length > 0 && tokensEncontrados === tokensBusca.length) {
          pontos += 30;
        }

        return { cliente, pontos };
      })
      .filter((item) => item.pontos >= 20)
      .sort((a, b) => b.pontos - a.pontos);

    if (pontuados.length === 0) return undefined;

    const primeiro = pontuados[0];
    const segundo = pontuados[1];

    if (segundo && primeiro.pontos === segundo.pontos && primeiro.pontos < 100) {
      return undefined;
    }

    return primeiro.cliente;
  }

  function localizarCliente(nomeFalado: string) {
    return melhorCorrespondencia(clientes, nomeFalado);
  }

  async function localizarClienteAtualizado(nomeFalado: string) {
    const local = localizarCliente(nomeFalado);
    if (local) return local;

    const { data, error } = await supabase
      .from("clientes")
      .select("id,nome,telefone,cidade,endereco,cpf_cnpj,tipo_servico,origem,observacoes,status")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Central de Voz - busca atualizada de clientes:", error);
      return undefined;
    }

    const lista = (data ?? []) as ClienteBanco[];
    setClientes(lista);

    return melhorCorrespondencia(lista, nomeFalado);
  }

  const tituloAcao = useMemo(() => {
    const mapa: Record<AcaoGlobal, string> = {
      abrir_modulo: "Abrir módulo",
      cliente_buscar: "Localizar cliente",
      cliente_criar: "Cadastrar cliente",
      funil_status: "Atualizar Funil",
      agenda_servico: "Agendar serviço",
      agenda_compromisso: "Criar compromisso",
      receber_criar: "Criar conta a receber",
      receber_baixar: "Registrar recebimento",
      pagar_criar: "Criar conta a pagar",
      desconhecida: "Comando não identificado",
    };
    return interpretacao ? mapa[interpretacao.acao] : "";
  }, [interpretacao]);

  async function interpretarComando(textoOriginal: string) {
    const acao = detectarAcao(textoOriginal);
    const valor = extrairValor(textoOriginal);
    const vencimento = extrairData(textoOriginal);
    const parcelas = extrairParcelas(textoOriginal);
    const horarios = extrairHorarios(textoOriginal);
    const tipoServico = detectarTipoServico(textoOriginal);
    const statusDestino = detectarStatus(textoOriginal);
    const telaDestino = detectarModuloAbrir(textoOriginal);
    const categoria = detectarCategoria(textoOriginal, acao.startsWith("receber") ? "receber" : "pagar");
    const forma = detectarForma(textoOriginal);

    let pessoa = extrairPessoa(textoOriginal, acao);
    let cliente = pessoa ? await localizarClienteAtualizado(pessoa) : undefined;
    if (cliente) pessoa = cliente.nome;

    if (acao === "abrir_modulo") {
      setInterpretacao(baseInterpretacao(acao, textoOriginal, { telaDestino, modulo: "Navegação" }));
      return;
    }

    if (acao === "cliente_buscar") {
      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Clientes",
          pessoa: cliente?.nome || pessoa,
          clienteId: cliente?.id,
          telefone: cliente?.telefone || "",
          cidade: cliente?.cidade || "",
          endereco: cliente?.endereco || "",
          tipoServico: cliente?.tipo_servico || "",
          telaDestino: "clientes",
          aviso: cliente
            ? `Cliente localizado: ${cliente.nome}.`
            : "Cliente não encontrado. Confira o nome e tente novamente.",
          bloqueado: false,
        }),
      );
      return;
    }

    if (acao === "cliente_criar") {
      const nome =
        textoOriginal.match(/(?:cadastre|cadastrar|adicione|adicionar)\s+(?:o cliente\s+|cliente\s+)?(.+?)(?:,|\s+telefone|\s+whatsapp|\s+cidade|\s+em\s+|$)/i)?.[1]?.trim() || "";
      const telefone = extrairTelefone(textoOriginal);
      const cidade = extrairCidade(textoOriginal);

      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Clientes",
          pessoa: nome,
          telefone,
          cidade,
          tipoServico,
          origem: /instagram/i.test(textoOriginal)
            ? "Instagram"
            : /google/i.test(textoOriginal)
              ? "Google"
              : /indicacao|indicação/i.test(textoOriginal)
                ? "Indicação"
                : "WhatsApp",
          aviso: !nome || !telefone ? "Informe pelo menos nome e telefone antes de confirmar." : undefined,
          bloqueado: !nome || !telefone,
        }),
      );
      return;
    }

    if (acao === "funil_status") {
      if (!cliente && pessoa) cliente = await localizarClienteAtualizado(pessoa);
      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Funil",
          pessoa: cliente?.nome || pessoa,
          clienteId: cliente?.id,
          statusDestino,
          aviso: !cliente
            ? "Cliente não encontrado. Corrija o nome antes de confirmar."
            : !statusDestino
              ? "Não identifiquei a etapa do Funil."
              : undefined,
          bloqueado: !cliente || !statusDestino,
        }),
      );
      return;
    }

    if (acao === "agenda_servico") {
      if (!cliente && pessoa) cliente = await localizarClienteAtualizado(pessoa);
      let aviso: string | undefined;
      let bloqueado = false;

      if (!cliente) {
        aviso = "Cliente não encontrado. Cadastre ou corrija o nome antes de agendar.";
        bloqueado = true;
      } else if (!vencimento || !horarios.inicio || !horarios.fim) {
        aviso = "O serviço precisa de data, horário inicial e horário final.";
        bloqueado = true;
      } else {
        const { data: conflitos, error } = await supabase
          .from("servicos")
          .select("id,cliente_nome,horario,horario_fim,status")
          .eq("data", vencimento);

        if (!error) {
          const inicioNovo = horarios.inicio;
          const fimNovo = horarios.fim;
          const conflito = (conflitos ?? []).find((item: any) => {
            const inicioExistente = String(item.horario ?? "").slice(0, 5);
            const fimExistente = String(item.horario_fim ?? "").slice(0, 5);
            if (!inicioExistente || !fimExistente || String(item.status).toLowerCase() === "concluído") return false;
            return inicioNovo < fimExistente && inicioExistente < fimNovo;
          });

          if (conflito) {
            aviso = `Conflito de horário com ${String(conflito.cliente_nome ?? "outro serviço")} (${String(
              conflito.horario ?? "",
            ).slice(0, 5)} às ${String(conflito.horario_fim ?? "").slice(0, 5)}). Corrija o horário.`;
            bloqueado = true;
          }
        }
      }

      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Agenda",
          pessoa: cliente?.nome || pessoa,
          clienteId: cliente?.id,
          telefone: cliente?.telefone || "",
          cidade: cliente?.cidade || "",
          endereco: cliente?.endereco || "",
          tipoServico: tipoServico || cliente?.tipo_servico || "Serviço",
          data: vencimento,
          horario: horarios.inicio,
          horarioFim: horarios.fim,
          descricao: tipoServico || cliente?.tipo_servico || "Serviço agendado por voz",
          aviso,
          bloqueado,
        }),
      );
      return;
    }

    if (acao === "agenda_compromisso") {
      const descricao = extrairDescricaoCompromisso(textoOriginal) || "Compromisso";
      const bloqueado = !vencimento || !horarios.inicio;
      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Agenda",
          descricao,
          data: vencimento,
          horario: horarios.inicio,
          horarioFim: horarios.fim,
          local: textoOriginal.match(/(?:local|em)\s+(.+?)(?:,|$)/i)?.[1]?.trim() || "",
          aviso: bloqueado ? "Informe pelo menos data e horário do compromisso." : undefined,
          bloqueado,
        }),
      );
      return;
    }

    if (acao === "receber_baixar") {
      const contas = lerLista<ContaReceber>(CHAVE_RECEBER).filter((conta) => conta.situacao !== "Recebido");
      const nomeProcurado = normalizar(pessoa);
      const candidatas = contas
        .filter((conta) => {
          const nome = normalizar(conta.cliente);
          return nome === nomeProcurado || nome.includes(nomeProcurado) || nomeProcurado.includes(nome);
        })
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      const conta = candidatas[0];
      const saldoAntes = conta ? Math.max(0, conta.valorTotal - conta.valorRecebido) : undefined;

      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: "Financeiro / Contas a Receber",
          pessoa,
          valor,
          contaId: conta?.id,
          descricao: conta?.descricao || "Recebimento",
          saldoAntes,
          saldoDepois: saldoAntes !== undefined ? Math.max(0, saldoAntes - valor) : undefined,
          candidatosReceber: candidatas,
          aviso: candidatas.length === 0 ? "Não encontrei conta em aberto para esse cliente." : undefined,
          bloqueado: candidatas.length === 0 || valor <= 0,
        }),
      );
      return;
    }

    if (acao === "receber_criar" || acao === "pagar_criar") {
      setInterpretacao(
        baseInterpretacao(acao, textoOriginal, {
          modulo: acao === "receber_criar" ? "Financeiro / Contas a Receber" : "Financeiro / Contas a Pagar",
          pessoa,
          valor,
          vencimento,
          parcelas,
          categoria,
          forma,
          descricao:
            acao === "receber_criar"
              ? `Recebimento de ${pessoa || "cliente"}`
              : categoria || "Conta a pagar",
          aviso: valor <= 0 || !vencimento ? "Confira valor e vencimento antes de confirmar." : undefined,
          bloqueado: valor <= 0 || !vencimento,
        }),
      );
      return;
    }

    setInterpretacao(
      baseInterpretacao("desconhecida", textoOriginal, {
        modulo: "Central de Voz",
        aviso: "Não consegui identificar a ação. Você pode corrigir ou falar novamente.",
        bloqueado: true,
      }),
    );
  }

  function baseInterpretacao(
    acao: AcaoGlobal,
    transcricao: string,
    parcial: Partial<Interpretacao>,
  ): Interpretacao {
    return {
      acao,
      modulo: "",
      transcricao,
      pessoa: "",
      telefone: "",
      cidade: "",
      endereco: "",
      tipoServico: "",
      origem: "WhatsApp",
      descricao: "",
      valor: 0,
      vencimento: "",
      parcelas: 1,
      data: "",
      horario: "",
      horarioFim: "",
      local: "",
      statusDestino: "",
      telaDestino: "",
      categoria: "",
      forma: "PIX",
      ...parcial,
    };
  }

  function iniciarVoz() {
    setMensagem("");
    const navegador = window as typeof window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition = navegador.SpeechRecognition || navegador.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensagem("Reconhecimento de voz indisponível. Use Chrome ou Edge e permita o microfone.");
      return;
    }

    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;

    reconhecimento.onstart = () => {
      setOuvindo(true);
      setMensagem("Ouvindo... fale o comando completo.");
    };

    reconhecimento.onresult = (evento: any) => {
      const texto = evento.results?.[0]?.[0]?.transcript || "";
      if (texto) void interpretarComando(texto);
    };

    reconhecimento.onerror = (evento: any) => {
      setOuvindo(false);
      setMensagem(
        evento.error === "not-allowed"
          ? "Microfone bloqueado. Libere a permissão no navegador."
          : "Não consegui entender. Tente novamente.",
      );
    };

    reconhecimento.onend = () => setOuvindo(false);
    reconhecimento.start();
  }

  function atualizarCampo<K extends keyof Interpretacao>(campo: K, valor: Interpretacao[K]) {
    setInterpretacao((atual) => (atual ? { ...atual, [campo]: valor, bloqueado: false, aviso: undefined } : atual));
  }

  async function confirmar() {
    if (!interpretacao || interpretacao.bloqueado) return;
    setProcessando(true);
    setMensagem("");

    try {
      if (interpretacao.acao === "abrir_modulo") {
        if (!interpretacao.telaDestino) throw new Error("Módulo não identificado.");
        alterarTela(interpretacao.telaDestino);
      } else if (interpretacao.acao === "cliente_criar") {
        await confirmarCliente(interpretacao);
      } else if (interpretacao.acao === "funil_status") {
        await confirmarFunil(interpretacao);
      } else if (interpretacao.acao === "agenda_servico") {
        await confirmarServico(interpretacao);
      } else if (interpretacao.acao === "agenda_compromisso") {
        await confirmarCompromisso(interpretacao);
      } else if (interpretacao.acao === "receber_criar") {
        confirmarContaReceber(interpretacao);
      } else if (interpretacao.acao === "receber_baixar") {
        confirmarBaixaReceber(interpretacao);
      } else if (interpretacao.acao === "pagar_criar") {
        confirmarContaPagar(interpretacao);
      } else {
        throw new Error("Comando não identificado.");
      }

      setInterpretacao(null);
      setMensagem("✅ Comando confirmado e executado com sucesso.");
      await carregarClientes();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível executar o comando.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCliente(dados: Interpretacao) {
    if (!dados.pessoa.trim() || !dados.telefone.trim()) throw new Error("Nome e telefone são obrigatórios.");
    const id = crypto.randomUUID();
    const { error } = await supabase.from("clientes").insert({
      id,
      nome: dados.pessoa.trim(),
      telefone: dados.telefone.trim(),
      cidade: dados.cidade.trim(),
      endereco: dados.endereco.trim(),
      tipo_servico: dados.tipoServico || "Energia Solar",
      origem: dados.origem || "WhatsApp",
      observacoes: "Cadastrado pela Central de Voz.",
      status: "Novo Contato",
      criado_em: new Date().toISOString(),
      retorno_em: null,
    });
    if (error) throw error;
  }

  async function confirmarFunil(dados: Interpretacao) {
    if (!dados.clienteId || !dados.statusDestino) throw new Error("Cliente ou etapa do Funil não identificados.");
    const retornoEm =
      dados.statusDestino === "Orçamento Enviado"
        ? new Date(Date.now() + 2 * 86_400_000).toISOString()
        : null;
    const { error } = await supabase
      .from("clientes")
      .update({ status: dados.statusDestino, ...(retornoEm ? { retorno_em: retornoEm } : {}) })
      .eq("id", dados.clienteId);
    if (error) throw error;
  }

  async function confirmarServico(dados: Interpretacao) {
    if (!dados.clienteId || !dados.data || !dados.horario || !dados.horarioFim) {
      throw new Error("Cliente, data e horários são obrigatórios.");
    }

    const { error } = await supabase.from("servicos").insert({
      id: crypto.randomUUID(),
      cliente_id: dados.clienteId,
      cliente_nome: dados.pessoa,
      cliente_telefone: dados.telefone,
      tipo_servico: dados.tipoServico || "Serviço",
      data: dados.data,
      horario: dados.horario,
      horario_fim: dados.horarioFim,
      endereco: dados.endereco,
      cidade: dados.cidade,
      equipe: "",
      descricao: dados.descricao || "Agendado pela Central de Voz",
      status: "Agendado",
    });
    if (error) throw error;

    const { error: erroCliente } = await supabase
      .from("clientes")
      .update({ status: "Agendado" })
      .eq("id", dados.clienteId);
    if (erroCliente) throw erroCliente;
  }

  async function confirmarCompromisso(dados: Interpretacao) {
    if (!dados.data || !dados.horario) throw new Error("Data e horário são obrigatórios.");
    const { error } = await supabase.from("agenda_compromissos").insert({
      id: crypto.randomUUID(),
      tipo: "Compromisso rápido",
      titulo: dados.descricao || "Compromisso",
      data: dados.data,
      horario: dados.horario,
      horario_fim: dados.horarioFim || dados.horario,
      responsavel: "Administração",
      local: dados.local,
      descricao: "Criado pela Central de Voz.",
    });
    if (error) throw error;
  }

  function confirmarContaReceber(dados: Interpretacao) {
    if (!dados.pessoa.trim() || dados.valor <= 0 || !dados.vencimento) throw new Error("Cliente, valor e vencimento são obrigatórios.");
    const contas = lerLista<ContaReceber>(CHAVE_RECEBER);
    const quantidade = Math.max(1, dados.parcelas);
    const recorrenciaId = quantidade > 1 ? crypto.randomUUID() : undefined;
    const valorParcela = Number((dados.valor / quantidade).toFixed(2));
    const cliente = localizarCliente(dados.pessoa);

    const novas: ContaReceber[] = Array.from({ length: quantidade }, (_, indice) => {
      const valorAtual =
        indice === quantidade - 1
          ? Number((dados.valor - valorParcela * (quantidade - 1)).toFixed(2))
          : valorParcela;
      const vencimentoAtual = adicionarMeses(dados.vencimento, indice);
      return {
        id: crypto.randomUUID(),
        descricao:
          quantidade > 1 ? `${dados.descricao} - Parcela ${indice + 1}/${quantidade}` : dados.descricao,
        cliente: dados.pessoa,
        categoria: dados.categoria || "Serviço",
        valorTotal: valorAtual,
        valorRecebido: 0,
        vencimento: vencimentoAtual,
        formaRecebimento: dados.forma || "PIX",
        contaFinanceira: "",
        situacao: calcularSituacaoReceber(valorAtual, 0, vencimentoAtual),
        telefoneCliente: cliente?.telefone || undefined,
        observacao: "Criado pela Central de Voz.",
        recorrenciaId,
        parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
        totalParcelas: quantidade > 1 ? quantidade : undefined,
        criadoEm: new Date().toISOString(),
      };
    });
    salvarLista(CHAVE_RECEBER, [...novas, ...contas]);
  }

  function confirmarBaixaReceber(dados: Interpretacao) {
    if (!dados.contaId || dados.valor <= 0) throw new Error("Conta e valor recebido são obrigatórios.");
    const contas = lerLista<ContaReceber>(CHAVE_RECEBER);
    const conta = contas.find((item) => item.id === dados.contaId);
    if (!conta) throw new Error("Conta não encontrada.");
    const restante = Math.max(0, conta.valorTotal - conta.valorRecebido);
    if (dados.valor > restante) throw new Error(`O valor ultrapassa o saldo de ${formatarMoeda(restante)}.`);
    const recebido = conta.valorRecebido + dados.valor;
    salvarLista(
      CHAVE_RECEBER,
      contas.map((item) =>
        item.id === conta.id
          ? {
              ...item,
              valorRecebido: recebido,
              situacao: calcularSituacaoReceber(conta.valorTotal, recebido, conta.vencimento),
            }
          : item,
      ),
    );
  }

  function confirmarContaPagar(dados: Interpretacao) {
    if (dados.valor <= 0 || !dados.vencimento) throw new Error("Valor e vencimento são obrigatórios.");
    const contas = lerLista<ContaPagar>(CHAVE_PAGAR);
    const quantidade = Math.max(1, dados.parcelas);
    const recorrenciaId = quantidade > 1 ? crypto.randomUUID() : undefined;
    const valorParcela = Number((dados.valor / quantidade).toFixed(2));

    const novas: ContaPagar[] = Array.from({ length: quantidade }, (_, indice) => ({
      id: crypto.randomUUID(),
      descricao:
        quantidade > 1 ? `${dados.descricao || "Conta"} - Parcela ${indice + 1}/${quantidade}` : dados.descricao || "Conta",
      categoria: dados.categoria || "Outros",
      fornecedor: dados.pessoa,
      valor:
        indice === quantidade - 1
          ? Number((dados.valor - valorParcela * (quantidade - 1)).toFixed(2))
          : valorParcela,
      vencimento: adicionarMeses(dados.vencimento, indice),
      formaPagamento: dados.forma || "PIX",
      contaFinanceira: "",
      situacao: "Pendente",
      observacao: "Criado pela Central de Voz.",
      recorrenciaId,
      parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
      totalParcelas: quantidade > 1 ? quantidade : undefined,
      criadoEm: new Date().toISOString(),
    }));

    salvarLista(CHAVE_PAGAR, [...novas, ...contas]);
  }

  function selecionarContaReceber(contaId: string) {
    if (!interpretacao) return;
    const conta = interpretacao.candidatosReceber?.find((item) => item.id === contaId);
    if (!conta) return;
    const saldo = Math.max(0, conta.valorTotal - conta.valorRecebido);
    setInterpretacao({
      ...interpretacao,
      contaId: conta.id,
      descricao: conta.descricao,
      saldoAntes: saldo,
      saldoDepois: Math.max(0, saldo - interpretacao.valor),
      bloqueado: false,
      aviso: undefined,
    });
  }

  return (
    <section className="h-full rounded-3xl border-2 border-yellow-400/50 bg-black p-4 shadow-[0_0_30px_rgba(250,204,21,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">🎙️ Central de Voz CHOQUESEG PRO</p>
          <h3 className="mt-1 text-2xl font-black uppercase text-white">Um comando. O sistema inteiro.</h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-zinc-400">
            Clientes, Funil, Agenda e Financeiro em um só lugar. Ações que alteram dados sempre pedem confirmação.
          </p>
        </div>
        <button
          type="button"
          onClick={iniciarVoz}
          disabled={ouvindo}
          className="min-h-16 shrink-0 rounded-2xl bg-yellow-400 px-7 py-4 text-base font-black uppercase text-black disabled:opacity-60"
        >
          {ouvindo ? "🎙️ Ouvindo..." : "🎤 Falar comando"}
        </button>
      </div>

      <div className="mt-3 grid gap-1 text-[11px] text-zinc-500 sm:grid-cols-2">
        <p>“Passe Marcelo para orçamento enviado.”</p>
        <p>“Agende João amanhã das 8 às 12.”</p>
        <p>“Marcelo pagou dois mil.”</p>
        <p>“Cadastre cliente Carlos, telefone...”</p>
      </div>

      {mensagem && (
        <div className="mt-4 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200">
          {mensagem}
        </div>
      )}

      {interpretacao && (
        <div className="mt-5 rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-yellow-400">Entendi o seguinte</p>
              <h4 className="mt-1 text-xl font-black uppercase text-white">{tituloAcao}</h4>
              <p className="mt-1 text-xs font-bold uppercase text-blue-300">Módulo: {interpretacao.modulo || "—"}</p>
            </div>
            <span className="max-w-xl rounded-xl bg-black px-3 py-2 text-xs text-zinc-400">“{interpretacao.transcricao}”</span>
          </div>

          {interpretacao.aviso && (
            <div className="mt-4 rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2 text-sm font-bold text-orange-200">
              ⚠️ {interpretacao.aviso}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {["cliente_buscar", "cliente_criar", "funil_status", "agenda_servico", "receber_criar", "receber_baixar", "pagar_criar"].includes(
              interpretacao.acao,
            ) && (
              <Campo label={interpretacao.acao === "pagar_criar" ? "Fornecedor" : "Cliente"} valor={interpretacao.pessoa} onChange={(v) => atualizarCampo("pessoa", v)} />
            )}

            {interpretacao.acao === "cliente_criar" && (
              <>
                <Campo label="Telefone" valor={interpretacao.telefone} onChange={(v) => atualizarCampo("telefone", v)} />
                <Campo label="Cidade" valor={interpretacao.cidade} onChange={(v) => atualizarCampo("cidade", v)} />
                <Campo label="Tipo de serviço" valor={interpretacao.tipoServico} onChange={(v) => atualizarCampo("tipoServico", v)} />
              </>
            )}

            {interpretacao.acao === "funil_status" && (
              <Campo label="Nova etapa" valor={interpretacao.statusDestino} onChange={(v) => atualizarCampo("statusDestino", v as StatusCliente)} />
            )}

            {["agenda_servico", "agenda_compromisso"].includes(interpretacao.acao) && (
              <>
                <Campo label="Data" tipo="date" valor={interpretacao.data} onChange={(v) => atualizarCampo("data", v)} />
                <Campo label="Início" tipo="time" valor={interpretacao.horario} onChange={(v) => atualizarCampo("horario", v)} />
                <Campo label="Fim" tipo="time" valor={interpretacao.horarioFim} onChange={(v) => atualizarCampo("horarioFim", v)} />
                <Campo label={interpretacao.acao === "agenda_servico" ? "Serviço" : "Compromisso"} valor={interpretacao.descricao} onChange={(v) => atualizarCampo("descricao", v)} />
              </>
            )}

            {["receber_criar", "receber_baixar", "pagar_criar"].includes(interpretacao.acao) && (
              <Campo
                label="Valor"
                valor={interpretacao.valor ? String(interpretacao.valor) : ""}
                onChange={(v) => atualizarCampo("valor", Number(v.replace(/\./g, "").replace(",", ".")) || 0)}
              />
            )}

            {["receber_criar", "pagar_criar"].includes(interpretacao.acao) && (
              <>
                <Campo label="Vencimento" tipo="date" valor={interpretacao.vencimento} onChange={(v) => atualizarCampo("vencimento", v)} />
                <Campo label="Parcelas" tipo="number" valor={String(interpretacao.parcelas)} onChange={(v) => atualizarCampo("parcelas", Math.max(1, Number(v) || 1))} />
                <Campo label="Descrição" valor={interpretacao.descricao} onChange={(v) => atualizarCampo("descricao", v)} />
              </>
            )}
          </div>

          {interpretacao.acao === "receber_baixar" && (interpretacao.candidatosReceber?.length ?? 0) > 0 && (
            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase text-zinc-500">Conta que será baixada</label>
              <select
                value={interpretacao.contaId || ""}
                onChange={(e) => selecionarContaReceber(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                {interpretacao.candidatosReceber?.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.descricao} · saldo {formatarMoeda(Math.max(0, conta.valorTotal - conta.valorRecebido))}
                  </option>
                ))}
              </select>
            </div>
          )}

          {interpretacao.saldoAntes !== undefined && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Resumo label="Saldo antes" valor={formatarMoeda(interpretacao.saldoAntes)} />
              <Resumo label="Saldo depois" valor={formatarMoeda(interpretacao.saldoDepois ?? interpretacao.saldoAntes)} />
            </div>
          )}

          {interpretacao.acao === "cliente_buscar" && interpretacao.clienteId && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Resumo label="Telefone" valor={interpretacao.telefone || "—"} />
              <Resumo label="Cidade" valor={interpretacao.cidade || "—"} />
              <Resumo label="Endereço" valor={interpretacao.endereco || "—"} />
              <Resumo label="Serviço" valor={interpretacao.tipoServico || "—"} />
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {interpretacao.acao === "cliente_buscar" ? (
              <button
                type="button"
                onClick={() => alterarTela("clientes")}
                disabled={!interpretacao.clienteId}
                className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black disabled:opacity-40"
              >
                👤 Abrir cadastro do cliente
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void confirmar()}
                disabled={processando || interpretacao.bloqueado || interpretacao.acao === "desconhecida"}
                className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-black uppercase text-black disabled:opacity-40"
              >
                {processando ? "Executando..." : "✅ Confirmar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMensagem("Corrija os campos acima e depois toque em Confirmar.")}
              className="rounded-xl border border-yellow-400/60 px-5 py-3 font-black uppercase text-yellow-300"
            >
              ✏️ Corrigir
            </button>
            <button
              type="button"
              onClick={() => {
                setInterpretacao(null);
                setMensagem("Comando cancelado. Nada foi gravado.");
              }}
              className="rounded-xl border border-red-500/50 px-5 py-3 font-black uppercase text-red-300"
            >
              ✖ Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Campo({
  label,
  valor,
  onChange,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-3">
      <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black text-yellow-400">{valor}</p>
    </div>
  );
}
