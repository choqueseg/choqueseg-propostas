"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const CHAVE_RECEBER = "choqueseg-financeiro-contas-receber";
const CHAVE_PAGAR = "choqueseg-financeiro-contas-pagar";
const EVENTO_FINANCEIRO = "choqueseg-financeiro-atualizado";

type AcaoVoz =
  | "receber_criar"
  | "receber_baixar"
  | "pagar_criar"
  | "pagar_baixar"
  | "desconhecida";

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
  cartaoId?: string;
  situacao: "Pendente" | "Pago" | "Atrasado";
  observacao?: string;
  recorrenciaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  criadoEm: string;
};

type ClienteBanco = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
};

type Interpretacao = {
  acao: AcaoVoz;
  transcricao: string;
  pessoa: string;
  descricao: string;
  valor: number;
  vencimento: string;
  parcelas: number;
  categoria: string;
  forma: string;
  contaId?: string;
  saldoAntes?: number;
  saldoDepois?: number;
  candidatos?: ContaReceber[];
  aviso?: string;
};

const PALAVRAS_NUMERO: Record<string, number> = {
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
  dezassete: 17,
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
  return texto
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
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

function converterNumeroFalado(frase: string) {
  const limpo = normalizar(frase).replace(/\be\b/g, " ");
  const tokens = limpo.split(/\s+/).filter(Boolean);

  let total = 0;
  let bloco = 0;
  let encontrou = false;

  for (const token of tokens) {
    if (/^\d+(?:[.,]\d+)?$/.test(token)) {
      const numero = Number(token.replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(numero)) {
        bloco += numero;
        encontrou = true;
      }
      continue;
    }

    if (token === "mil") {
      bloco = (bloco || 1) * 1000;
      total += bloco;
      bloco = 0;
      encontrou = true;
      continue;
    }

    if (token === "milhao" || token === "milhoes") {
      bloco = (bloco || 1) * 1_000_000;
      total += bloco;
      bloco = 0;
      encontrou = true;
      continue;
    }

    const valor = PALAVRAS_NUMERO[token];
    if (valor !== undefined) {
      bloco += valor;
      encontrou = true;
    }
  }

  return encontrou ? total + bloco : 0;
}

function extrairValor(textoOriginal: string) {
  const texto = normalizar(textoOriginal);

  const moedaNumerica = texto.match(
    /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real)?/,
  );

  if (moedaNumerica?.[1]) {
    const bruto = moedaNumerica[1];
    const normalizado =
      bruto.includes(",")
        ? bruto.replace(/\./g, "").replace(",", ".")
        : bruto;
    const numero = Number(normalizado);
    if (Number.isFinite(numero)) return numero;
  }

  const gatilhos = [
    /(?:deve|devendo|valor de|receber|pagou|paguei|pagar|gastei|comprei)\s+(.+?)(?:\s+(?:reais?|real|para|dia|vence|vencimento|em\s+\d+\s+parcelas?|parcelado)|$)/,
    /(?:r\$)\s*(.+?)(?:\s|$)/,
  ];

  for (const regex of gatilhos) {
    const trecho = texto.match(regex)?.[1];
    if (trecho) {
      const numero = converterNumeroFalado(trecho);
      if (numero > 0) return numero;
    }
  }

  const palavrasNumero = texto.match(
    /\b(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil|milhao|milhoes)(?:\s+e?\s*(?:um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil|milhao|milhoes))*/g,
  );

  if (palavrasNumero) {
    const candidatos = palavrasNumero
      .map(converterNumeroFalado)
      .filter((valor) => valor > 0);
    return candidatos.length ? Math.max(...candidatos) : 0;
  }

  return 0;
}

function extrairParcelas(texto: string) {
  const normal = normalizar(texto);
  const numerico =
    normal.match(/\b(?:em|parcelado em|dividido em)\s+(\d{1,3})\s+(?:x|parcelas?|vezes|meses)\b/)?.[1] ??
    normal.match(/\b(\d{1,3})\s*(?:x|parcelas?)\b/)?.[1];

  if (numerico) return Math.max(1, Math.min(120, Number(numerico)));

  const falado = normal.match(
    /\b(?:em|parcelado em|dividido em)\s+([a-z\s]+?)\s+(?:parcelas?|vezes|meses)\b/,
  )?.[1];

  if (falado) {
    const numero = converterNumeroFalado(falado);
    if (numero > 0) return Math.max(1, Math.min(120, Math.round(numero)));
  }

  return 1;
}

function extrairData(texto: string) {
  const normal = normalizar(texto);
  const hoje = new Date(`${hojeISO()}T12:00:00`);

  if (/\bhoje\b/.test(normal)) return hojeISO();

  if (/\bamanha\b/.test(normal)) {
    hoje.setDate(hoje.getDate() + 1);
    return hoje.toISOString().slice(0, 10);
  }

  const completa =
    normal.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/) ??
    normal.match(/\bdia\s+(\d{1,2})\s+do\s+(\d{1,2})\s+de\s+(\d{2,4})\b/);

  if (completa) {
    const dia = Number(completa[1]);
    const mes = Number(completa[2]);
    let ano = Number(completa[3]);
    if (ano < 100) ano += 2000;
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  const diaDoMes = normal.match(/\b(?:dia|vence dia|vencimento dia|para dia)\s+(\d{1,2})\b/)?.[1];

  if (diaDoMes) {
    const dia = Number(diaDoMes);
    const base = new Date(hoje);
    const candidato = new Date(base.getFullYear(), base.getMonth(), dia, 12);

    if (candidato.getTime() < hoje.getTime()) {
      candidato.setMonth(candidato.getMonth() + 1);
    }

    return `${candidato.getFullYear()}-${String(candidato.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(candidato.getDate()).padStart(2, "0")}`;
  }

  return "";
}

function lerLista<T>(chave: string): T[] {
  try {
    const bruto = localStorage.getItem(chave);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? (dados as T[]) : [];
  } catch {
    return [];
  }
}

function salvarLista<T>(chave: string, itens: T[]) {
  localStorage.setItem(chave, JSON.stringify(itens));
  window.dispatchEvent(new CustomEvent(EVENTO_FINANCEIRO));
}

function situacaoReceber(
  valorTotal: number,
  valorRecebido: number,
  vencimento: string,
): ContaReceber["situacao"] {
  if (valorRecebido >= valorTotal) return "Recebido";
  if (valorRecebido > 0) return "Parcial";
  if (vencimento && vencimento < hojeISO()) return "Atrasado";
  return "Pendente";
}

function detectarCategoria(texto: string, tipo: "receber" | "pagar") {
  const t = normalizar(texto);

  if (/\bsolar|energia solar|modulo|inversor\b/.test(t)) return "Energia Solar";
  if (/\bcamera|alarme|cerca|seguranca\b/.test(t)) return "Segurança Eletrônica";
  if (/\beletrica|disjuntor|dps|fio|cabo\b/.test(t)) return tipo === "receber" ? "Elétrica" : "Material";
  if (/\bautomacao|casa inteligente\b/.test(t)) return tipo === "receber" ? "Automação" : "Material";
  if (/\bcombustivel|gasolina|etanol|diesel|posto\b/.test(t)) return "Combustível";
  if (/\balimentacao|almoco|lanche|janta|refeicao\b/.test(t)) return "Alimentação";
  if (/\bfornecedor\b/.test(t)) return "Fornecedor";
  if (/\bsalario\b/.test(t)) return "Salário";
  if (/\bimposto|tributo|taxa\b/.test(t)) return "Imposto";
  if (/\binternet|wifi\b/.test(t)) return "Internet";
  if (/\bmanutencao|conserto|reparo\b/.test(t)) return "Manutenção";

  return tipo === "receber" ? "Serviço" : "Outros";
}

function detectarForma(texto: string) {
  const t = normalizar(texto);
  if (/\bpix\b/.test(t)) return "PIX";
  if (/\bdinheiro|especie\b/.test(t)) return "Dinheiro";
  if (/\bdebito\b/.test(t)) return "Débito";
  if (/\bcredito|cartao\b/.test(t)) return "Crédito";
  if (/\btransferencia\b/.test(t)) return "Transferência";
  if (/\bboleto\b/.test(t)) return "Boleto";
  return "PIX";
}

function extrairPessoa(textoOriginal: string, acao: AcaoVoz) {
  const original = textoOriginal.trim();

  const padroes: RegExp[] =
    acao === "receber_criar"
      ? [
          /cliente\s+(.+?)(?:,|\s+deve\b|\s+devendo\b|\s+vai pagar\b)/i,
          /^(.+?)\s+(?:deve|esta devendo|vai pagar)\b/i,
        ]
      : acao === "receber_baixar"
        ? [
            /^(.+?)\s+(?:pagou|me pagou|depositou|transferiu)\b/i,
            /cliente\s+(.+?)\s+(?:pagou|me pagou)\b/i,
          ]
        : acao === "pagar_criar"
          ? [
              /fornecedor\s+(.+?)(?:,|\s+valor\b|\s+de\s+r?\$|\s+de\s+\d|\s+vence\b)/i,
              /(?:conta|boleto)\s+(?:do|da)\s+(.+?)(?:,|\s+de\s+r?\$|\s+vence\b)/i,
            ]
          : [];

  for (const padrao of padroes) {
    const valor = original.match(padrao)?.[1]?.trim();
    if (valor) return valor;
  }

  return "";
}

function detectarAcao(textoOriginal: string): AcaoVoz {
  const texto = normalizar(textoOriginal);

  if (/\b(pagou|me pagou|recebi do cliente|recebimento do cliente)\b/.test(texto)) {
    return "receber_baixar";
  }

  if (/\b(deve|esta devendo|conta a receber|vai pagar|tenho a receber)\b/.test(texto)) {
    return "receber_criar";
  }

  if (/\b(paguei|foi pago|marcar como pago|quitei)\b/.test(texto) && /\b(conta|fornecedor|boleto)\b/.test(texto)) {
    return "pagar_baixar";
  }

  if (
    /\b(conta a pagar|tenho que pagar|preciso pagar|fornecedor|boleto|vence|cartao)\b/.test(texto) &&
    !/\bcliente\b/.test(texto)
  ) {
    return "pagar_criar";
  }

  return "desconhecida";
}

function nomeCurto(texto: string) {
  return texto.trim().replace(/\s+/g, " ");
}

export default function CentralVozFinanceiro({
  usuarioNome,
}: {
  usuarioNome: string;
}) {
  const [ouvindo, setOuvindo] = useState(false);
  const [transcricao, setTranscricao] = useState("");
  const [interpretacao, setInterpretacao] = useState<Interpretacao | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [clientes, setClientes] = useState<ClienteBanco[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregarClientes() {
      const { data, error } = await supabase
        .from("clientes")
        .select("id,nome,telefone,cidade")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Central de Voz - erro ao carregar clientes:", error);
        return;
      }

      setClientes((data ?? []) as ClienteBanco[]);
    }

    void carregarClientes();

    return () => {
      ativo = false;
    };
  }, []);

  const resumoAcao = useMemo(() => {
    if (!interpretacao) return "";
    const nomes: Record<AcaoVoz, string> = {
      receber_criar: "Criar conta a receber",
      receber_baixar: "Registrar recebimento",
      pagar_criar: "Criar conta a pagar",
      pagar_baixar: "Baixar conta a pagar",
      desconhecida: "Comando não identificado",
    };
    return nomes[interpretacao.acao];
  }, [interpretacao]);

  async function interpretar(transcricaoRecebida: string) {
    const original = transcricaoRecebida.trim();
    const acao = detectarAcao(original);
    const valor = extrairValor(original);
    const parcelas = extrairParcelas(original);
    const vencimento = extrairData(original);
    let pessoa = nomeCurto(extrairPessoa(original, acao));
    const categoria =
      acao.startsWith("receber") ? detectarCategoria(original, "receber") : detectarCategoria(original, "pagar");
    const forma = detectarForma(original);

    if (pessoa && acao.startsWith("receber")) {
      const pessoaNormal = normalizar(pessoa);
      const encontrado = clientes.find((cliente) => {
        const nome = normalizar(cliente.nome);
        return nome === pessoaNormal || nome.startsWith(pessoaNormal) || pessoaNormal.startsWith(nome);
      });

      if (encontrado) {
        pessoa = encontrado.nome;
      }
    }

    if (acao === "receber_baixar") {
      const contas = lerLista<ContaReceber>(CHAVE_RECEBER).filter(
        (conta) => conta.situacao !== "Recebido",
      );

      const pessoaNormal = normalizar(pessoa);
      const candidatas = contas
        .filter((conta) => {
          const nome = normalizar(conta.cliente);
          return (
            nome === pessoaNormal ||
            nome.includes(pessoaNormal) ||
            pessoaNormal.includes(nome)
          );
        })
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

      const conta = candidatas[0];
      const saldoAntes = conta
        ? Math.max(0, conta.valorTotal - conta.valorRecebido)
        : undefined;

      setInterpretacao({
        acao,
        transcricao: original,
        pessoa,
        descricao: conta?.descricao || "Recebimento",
        valor,
        vencimento: conta?.vencimento || "",
        parcelas: 1,
        categoria: conta?.categoria || categoria,
        forma: conta?.formaRecebimento || forma,
        contaId: conta?.id,
        saldoAntes,
        saldoDepois:
          saldoAntes !== undefined && valor > 0
            ? Math.max(0, saldoAntes - valor)
            : undefined,
        candidatos: candidatas,
        aviso:
          candidatas.length === 0
            ? "Não encontrei conta em aberto para esse cliente."
            : candidatas.length > 1
              ? "Há mais de uma conta em aberto. Confira a conta selecionada antes de confirmar."
              : undefined,
      });
      return;
    }

    setInterpretacao({
      acao,
      transcricao: original,
      pessoa,
      descricao:
        acao === "receber_criar"
          ? `Recebimento de ${pessoa || "cliente"}`
          : acao === "pagar_criar"
            ? categoria
            : "Pagamento",
      valor,
      vencimento,
      parcelas,
      categoria,
      forma,
      aviso:
        acao === "desconhecida"
          ? "Não consegui identificar se é conta a receber, recebimento ou conta a pagar."
          : undefined,
    });
  }

  function iniciarVoz() {
    setMensagem("");

    const SpeechRecognition =
      (
        window as typeof window & {
          SpeechRecognition?: new () => any;
          webkitSpeechRecognition?: new () => any;
        }
      ).SpeechRecognition ||
      (
        window as typeof window & {
          webkitSpeechRecognition?: new () => any;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensagem(
        "O reconhecimento de voz não está disponível neste navegador. Use Chrome/Edge e permita o microfone.",
      );
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
      const texto = evento.results?.[0]?.[0]?.transcript ?? "";
      setTranscricao(texto);
      if (texto) void interpretar(texto);
    };

    reconhecimento.onerror = (evento: any) => {
      setOuvindo(false);
      setMensagem(
        evento.error === "not-allowed"
          ? "Microfone bloqueado. Libere a permissão do microfone no navegador."
          : "Não consegui entender. Tente falar novamente.",
      );
    };

    reconhecimento.onend = () => {
      setOuvindo(false);
    };

    reconhecimento.start();
  }

  function atualizarInterpretacao<K extends keyof Interpretacao>(
    campo: K,
    valor: Interpretacao[K],
  ) {
    setInterpretacao((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  }

  function selecionarContaReceber(contaId: string) {
    if (!interpretacao) return;
    const conta = interpretacao.candidatos?.find((item) => item.id === contaId);
    if (!conta) return;

    const saldo = Math.max(0, conta.valorTotal - conta.valorRecebido);

    setInterpretacao({
      ...interpretacao,
      contaId: conta.id,
      descricao: conta.descricao,
      categoria: conta.categoria,
      forma: conta.formaRecebimento,
      vencimento: conta.vencimento,
      saldoAntes: saldo,
      saldoDepois: Math.max(0, saldo - interpretacao.valor),
    });
  }

  function confirmarReceberCriar(dados: Interpretacao) {
    if (!dados.pessoa.trim()) throw new Error("Informe o cliente.");
    if (!dados.valor || dados.valor <= 0) throw new Error("Informe um valor válido.");
    if (!dados.vencimento) throw new Error("Informe o vencimento.");

    const contas = lerLista<ContaReceber>(CHAVE_RECEBER);
    const quantidade = Math.max(1, dados.parcelas);
    const recorrenciaId = quantidade > 1 ? crypto.randomUUID() : undefined;
    const valorParcela = Number((dados.valor / quantidade).toFixed(2));

    const clienteBanco = clientes.find(
      (cliente) => normalizar(cliente.nome) === normalizar(dados.pessoa),
    );

    const novas: ContaReceber[] = Array.from({ length: quantidade }, (_, indice) => ({
      id: crypto.randomUUID(),
      descricao:
        quantidade > 1
          ? `${dados.descricao} - Parcela ${indice + 1}/${quantidade}`
          : dados.descricao,
      cliente: dados.pessoa.trim(),
      categoria: dados.categoria || "Serviço",
      valorTotal:
        indice === quantidade - 1
          ? Number((dados.valor - valorParcela * (quantidade - 1)).toFixed(2))
          : valorParcela,
      valorRecebido: 0,
      vencimento: adicionarMeses(dados.vencimento, indice),
      formaRecebimento: dados.forma || "PIX",
      contaFinanceira: "",
      situacao: "Pendente",
      observacao: `Criado pela Central de Voz por ${usuarioNome}. Comando: ${dados.transcricao}`,
      telefoneCliente: clienteBanco?.telefone || undefined,
      recorrenciaId,
      parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
      totalParcelas: quantidade > 1 ? quantidade : undefined,
      criadoEm: new Date().toISOString(),
    }));

    salvarLista(CHAVE_RECEBER, [...novas, ...contas]);
  }

  function confirmarReceberBaixar(dados: Interpretacao) {
    if (!dados.contaId) throw new Error("Selecione a conta que será baixada.");
    if (!dados.valor || dados.valor <= 0) throw new Error("Informe o valor recebido.");

    const contas = lerLista<ContaReceber>(CHAVE_RECEBER);
    const conta = contas.find((item) => item.id === dados.contaId);
    if (!conta) throw new Error("A conta selecionada não foi encontrada.");

    const restante = Math.max(0, conta.valorTotal - conta.valorRecebido);
    if (dados.valor > restante) {
      throw new Error(
        `O valor informado ultrapassa o saldo de ${formatarMoeda(restante)}.`,
      );
    }

    const recebido = conta.valorRecebido + dados.valor;
    const atualizada: ContaReceber = {
      ...conta,
      valorRecebido: recebido,
      situacao: situacaoReceber(conta.valorTotal, recebido, conta.vencimento),
      observacao: [
        conta.observacao,
        `Baixa por voz: ${formatarMoeda(dados.valor)} em ${new Date().toLocaleString(
          "pt-BR",
        )} por ${usuarioNome}.`,
      ]
        .filter(Boolean)
        .join(" | "),
    };

    salvarLista(
      CHAVE_RECEBER,
      contas.map((item) => (item.id === conta.id ? atualizada : item)),
    );
  }

  function confirmarPagarCriar(dados: Interpretacao) {
    if (!dados.valor || dados.valor <= 0) throw new Error("Informe um valor válido.");
    if (!dados.vencimento) throw new Error("Informe o vencimento.");

    const contas = lerLista<ContaPagar>(CHAVE_PAGAR);
    const quantidade = Math.max(1, dados.parcelas);
    const recorrenciaId = quantidade > 1 ? crypto.randomUUID() : undefined;
    const valorParcela = Number((dados.valor / quantidade).toFixed(2));

    const novas: ContaPagar[] = Array.from({ length: quantidade }, (_, indice) => ({
      id: crypto.randomUUID(),
      descricao:
        quantidade > 1
          ? `${dados.descricao || "Conta"} - Parcela ${indice + 1}/${quantidade}`
          : dados.descricao || "Conta por comando de voz",
      categoria: dados.categoria || "Outros",
      fornecedor: dados.pessoa.trim(),
      valor:
        indice === quantidade - 1
          ? Number((dados.valor - valorParcela * (quantidade - 1)).toFixed(2))
          : valorParcela,
      vencimento: adicionarMeses(dados.vencimento, indice),
      formaPagamento: dados.forma || "PIX",
      contaFinanceira: "",
      situacao: "Pendente",
      observacao: `Criado pela Central de Voz por ${usuarioNome}. Comando: ${dados.transcricao}`,
      recorrenciaId,
      parcelaAtual: quantidade > 1 ? indice + 1 : undefined,
      totalParcelas: quantidade > 1 ? quantidade : undefined,
      criadoEm: new Date().toISOString(),
    }));

    salvarLista(CHAVE_PAGAR, [...novas, ...contas]);
  }

  function confirmarPagarBaixar(dados: Interpretacao) {
    const contas = lerLista<ContaPagar>(CHAVE_PAGAR);
    const texto = normalizar(dados.transcricao);

    const conta = contas
      .filter((item) => item.situacao !== "Pago")
      .find((item) => {
        const descricao = normalizar(item.descricao);
        const fornecedor = normalizar(item.fornecedor);
        return (
          (dados.pessoa && fornecedor.includes(normalizar(dados.pessoa))) ||
          texto.includes(descricao)
        );
      });

    if (!conta) throw new Error("Não encontrei a conta a pagar em aberto.");

    salvarLista(
      CHAVE_PAGAR,
      contas.map((item) =>
        item.id === conta.id ? { ...item, situacao: "Pago" as const } : item,
      ),
    );
  }

  function confirmar() {
    if (!interpretacao) return;

    setProcessando(true);
    setMensagem("");

    try {
      if (interpretacao.acao === "receber_criar") {
        confirmarReceberCriar(interpretacao);
      } else if (interpretacao.acao === "receber_baixar") {
        confirmarReceberBaixar(interpretacao);
      } else if (interpretacao.acao === "pagar_criar") {
        confirmarPagarCriar(interpretacao);
      } else if (interpretacao.acao === "pagar_baixar") {
        confirmarPagarBaixar(interpretacao);
      } else {
        throw new Error("Comando não identificado. Corrija os dados ou fale novamente.");
      }

      setMensagem("✅ Comando confirmado e gravado com sucesso.");
      setInterpretacao(null);
      setTranscricao("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível executar o comando.");
    } finally {
      setProcessando(false);
    }
  }

  function cancelar() {
    setInterpretacao(null);
    setTranscricao("");
    setMensagem("Comando cancelado. Nada foi gravado.");
  }

  return (
    <section className="rounded-3xl border-2 border-yellow-400/50 bg-black p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
            🎙️ Central de Comandos por Voz
          </p>
          <h3 className="mt-1 text-2xl font-black uppercase text-white">
            Fale. Confira. Confirme.
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Nenhuma ação é gravada automaticamente. A Central mostra o que entendeu e só
            executa depois da sua confirmação.
          </p>
        </div>

        <button
          type="button"
          onClick={iniciarVoz}
          disabled={ouvindo}
          className="min-h-14 rounded-2xl bg-yellow-400 px-6 py-4 text-base font-black uppercase text-black disabled:opacity-60"
        >
          {ouvindo ? "🎙️ Ouvindo..." : "🎤 Falar comando"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-zinc-500 md:grid-cols-3">
        <p>“Cliente Marcelo deve cinco mil para dia 10.”</p>
        <p>“Marcelo pagou dois mil.”</p>
        <p>“Fornecedor ABC, três mil em 3 parcelas, vence dia 15.”</p>
      </div>

      {mensagem && (
        <div className="mt-4 rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200">
          {mensagem}
        </div>
      )}

      {transcricao && !interpretacao && (
        <p className="mt-4 text-sm text-zinc-400">
          Último comando: <strong className="text-white">{transcricao}</strong>
        </p>
      )}

      {interpretacao && (
        <div className="mt-5 rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-yellow-400">
                Entendi o seguinte
              </p>
              <h4 className="mt-1 text-xl font-black uppercase text-white">
                {resumoAcao}
              </h4>
            </div>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
              “{interpretacao.transcricao}”
            </span>
          </div>

          {interpretacao.aviso && (
            <div className="mt-4 rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2 text-sm font-bold text-orange-200">
              ⚠️ {interpretacao.aviso}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(interpretacao.acao === "receber_criar" ||
              interpretacao.acao === "receber_baixar" ||
              interpretacao.acao === "pagar_criar") && (
              <Campo
                label={
                  interpretacao.acao.startsWith("receber") ? "Cliente" : "Fornecedor"
                }
                valor={interpretacao.pessoa}
                onChange={(valor) => atualizarInterpretacao("pessoa", valor)}
              />
            )}

            <Campo
              label="Valor"
              valor={interpretacao.valor ? String(interpretacao.valor) : ""}
              onChange={(valor) =>
                atualizarInterpretacao(
                  "valor",
                  Number(valor.replace(/\./g, "").replace(",", ".")) || 0,
                )
              }
            />

            {interpretacao.acao !== "receber_baixar" && (
              <Campo
                label="Vencimento"
                valor={interpretacao.vencimento}
                tipo="date"
                onChange={(valor) => atualizarInterpretacao("vencimento", valor)}
              />
            )}

            {(interpretacao.acao === "receber_criar" ||
              interpretacao.acao === "pagar_criar") && (
              <Campo
                label="Parcelas"
                valor={String(interpretacao.parcelas)}
                tipo="number"
                onChange={(valor) =>
                  atualizarInterpretacao(
                    "parcelas",
                    Math.max(1, Math.min(120, Number(valor) || 1)),
                  )
                }
              />
            )}

            {(interpretacao.acao === "receber_criar" ||
              interpretacao.acao === "pagar_criar") && (
              <Campo
                label="Descrição"
                valor={interpretacao.descricao}
                onChange={(valor) => atualizarInterpretacao("descricao", valor)}
              />
            )}
          </div>

          {interpretacao.acao === "receber_baixar" &&
            (interpretacao.candidatos?.length ?? 0) > 0 && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                  Conta que será baixada
                </label>
                <select
                  value={interpretacao.contaId || ""}
                  onChange={(evento) => selecionarContaReceber(evento.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                >
                  {interpretacao.candidatos?.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.descricao} · saldo{" "}
                      {formatarMoeda(
                        Math.max(0, conta.valorTotal - conta.valorRecebido),
                      )}{" "}
                      · vence {conta.vencimento}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {interpretacao.acao === "receber_baixar" &&
            interpretacao.saldoAntes !== undefined && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Resumo label="Saldo antes" valor={formatarMoeda(interpretacao.saldoAntes)} />
                <Resumo
                  label="Saldo após confirmar"
                  valor={formatarMoeda(interpretacao.saldoDepois ?? interpretacao.saldoAntes)}
                />
              </div>
            )}

          {interpretacao.parcelas > 1 &&
            (interpretacao.acao === "receber_criar" ||
              interpretacao.acao === "pagar_criar") &&
            interpretacao.valor > 0 && (
              <div className="mt-4 rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-sm font-bold text-blue-200">
                Serão criadas {interpretacao.parcelas} parcelas mensais de aproximadamente{" "}
                {formatarMoeda(interpretacao.valor / interpretacao.parcelas)}.
              </div>
            )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={confirmar}
              disabled={processando || interpretacao.acao === "desconhecida"}
              className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-black uppercase text-black disabled:opacity-50"
            >
              {processando ? "Gravando..." : "✅ Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setMensagem("Corrija os campos acima e depois toque em Confirmar.")}
              className="rounded-xl border border-yellow-400/60 px-5 py-3 font-black uppercase text-yellow-300"
            >
              ✏️ Corrigir
            </button>
            <button
              type="button"
              onClick={cancelar}
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
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
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