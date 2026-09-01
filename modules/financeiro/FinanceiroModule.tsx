"use client";
import ContasFinanceiras from "./ContasFinanceiras";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ContasPagar from "./ContasPagar";
import ContasReceber from "./ContasReceber";
import CartoesFinanceiros from "./CartoesFinanceiros";
import FaturasCartoes from "./FaturasCartoes";
import {
  CategoriaFinanceira,
  FormaPagamento,
  LancamentoFinanceiro,
  OrigemLancamento,
  TipoLancamento,
} from "./types";

const CHAVE_LANCAMENTOS = "choqueseg-financeiro-lancamentos";
const PREFIXO_FINANCEIRO = "choqueseg-financeiro-";

const CHAVE_CARTOES = "choqueseg-financeiro-cartoes";
const CHAVE_CONTAS_PAGAR = "choqueseg-financeiro-contas-pagar";
const CHAVE_CONTAS_RECEBER = "choqueseg-financeiro-contas-receber";
const categorias: CategoriaFinanceira[] = [
  "Venda",
  "Serviço",
  "Combustível",
  "Alimentação",
  "Material",
  "Fornecedor",
  "Salário",
  "Imposto",
  "Energia",
  "Internet",
  "Manutenção",
  "Despesa pessoal",
  "Outros",
];

const formasPagamento: FormaPagamento[] = [
  "Dinheiro",
  "PIX",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

const origens: OrigemLancamento[] = [
  "Empresa",
  "Pessoal",
  "Ordem de Serviço",
  "Venda",
  "Outro",
];

export default function FinanceiroModule({
  usuarioNome,
}: {
  usuarioNome: string;
}) {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  const [tipo, setTipo] = useState<TipoLancamento>("Saída");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [categoria, setCategoria] =
    useState<CategoriaFinanceira>("Outros");
  const [origem, setOrigem] =
    useState<OrigemLancamento>("Empresa");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("PIX");
  const [clienteNome, setClienteNome] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ouvindoVoz, setOuvindoVoz] = useState(false);
  const [textoVoz, setTextoVoz] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<
    | "resumo"
    | "novo"
    | "contas"
    | "cartoes"
    | "faturas"
    | "pagar"
    | "receber"
    | "historico"
    | "backup"
  >("resumo");

  const conteudoFinanceiroRef = useRef<HTMLElement | null>(null);

  function abrirSecaoFinanceiro(
    secao:
      | "resumo"
      | "novo"
      | "contas"
      | "cartoes"
      | "faturas"
      | "pagar"
      | "receber"
      | "historico"
      | "backup",
  ) {
    setSecaoAtiva(secao);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        conteudoFinanceiroRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  const [filtroTipo, setFiltroTipo] = useState<"Todos" | TipoLancamento>(
    "Todos",
  );
  const [filtroOrigem, setFiltroOrigem] = useState<
    "Todas" | OrigemLancamento
  >("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState<
    "Todas" | CategoriaFinanceira
  >("Todas");
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(CHAVE_LANCAMENTOS);

    if (dadosSalvos) {
      try {
        setLancamentos(JSON.parse(dadosSalvos));
      } catch {
        localStorage.removeItem(CHAVE_LANCAMENTOS);
        setLancamentos([]);
        setMensagem(
          "Os dados financeiros estavam inválidos e foram reiniciados.",
        );
      }
    }

    setDadosCarregados(true);
  }, []);

  useEffect(() => {
    if (!dadosCarregados) return;

    localStorage.setItem(
      CHAVE_LANCAMENTOS,
      JSON.stringify(lancamentos),
    );
  }, [lancamentos, dadosCarregados]);

  const lancamentosFiltrados = useMemo(() => {
    return [...lancamentos]
      .filter((lancamento) => {
        const atendeTipo =
          filtroTipo === "Todos" || lancamento.tipo === filtroTipo;

        const atendeOrigem =
          filtroOrigem === "Todas" ||
          lancamento.origem === filtroOrigem;

        const atendeCategoria =
          filtroCategoria === "Todas" ||
          lancamento.categoria === filtroCategoria;

        const atendeMes =
          !filtroMes || lancamento.data.startsWith(filtroMes);

        return (
          atendeTipo &&
          atendeOrigem &&
          atendeCategoria &&
          atendeMes
        );
      })
      .sort((a, b) =>
        `${b.data}-${b.criadoEm}`.localeCompare(
          `${a.data}-${a.criadoEm}`,
        ),
      );
  }, [
    lancamentos,
    filtroTipo,
    filtroOrigem,
    filtroCategoria,
    filtroMes,
  ]);

  const resumo = useMemo(() => {
    const entradas = lancamentosFiltrados
      .filter((item) => item.tipo === "Entrada")
      .reduce((total, item) => total + item.valor, 0);

    const saidas = lancamentosFiltrados
      .filter((item) => item.tipo === "Saída")
      .reduce((total, item) => total + item.valor, 0);

    const empresa = lancamentosFiltrados
      .filter((item) => item.origem === "Empresa")
      .reduce((total, item) => {
        return item.tipo === "Entrada"
          ? total + item.valor
          : total - item.valor;
      }, 0);

    const pessoal = lancamentosFiltrados
      .filter((item) => item.origem === "Pessoal")
      .reduce((total, item) => {
        return item.tipo === "Entrada"
          ? total + item.valor
          : total - item.valor;
      }, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      empresa,
      pessoal,
    };
  }, [lancamentosFiltrados]);


  function normalizarTextoVoz(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function interpretarComandoVoz(transcricao: string) {
    const original = transcricao.trim();
    const texto = normalizarTextoVoz(original);

    const valorEncontrado =
      texto.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real)?/)?.[1] ?? "";

    const valorFormatado = valorEncontrado
      ? valorEncontrado.replace(".", ",")
      : "";

    const ehEntrada =
      /\b(recebi|entrou|entrada|vendi|venda|ganhei|pagaram)\b/.test(texto);

    const novaCategoria: CategoriaFinanceira =
      /\b(combustivel|gasolina|alcool|etanol|diesel|posto)\b/.test(texto)
        ? "Combustível"
        : /\b(lanche|almoco|janta|jantar|cafe|comida|alimentacao|refeicao)\b/.test(texto)
          ? "Alimentação"
          : /\b(material|cabo|fio|disjuntor|camera|modulo|inversor|equipamento)\b/.test(texto)
            ? "Material"
            : /\b(fornecedor)\b/.test(texto)
              ? "Fornecedor"
              : /\b(salario|pagamento funcionario)\b/.test(texto)
                ? "Salário"
                : /\b(imposto|taxa|tributo)\b/.test(texto)
                  ? "Imposto"
                  : /\b(energia|conta de luz)\b/.test(texto)
                    ? "Energia"
                    : /\b(internet|wifi)\b/.test(texto)
                      ? "Internet"
                      : /\b(manutencao|conserto|reparo)\b/.test(texto)
                        ? "Manutenção"
                        : /\b(pessoal|minha conta pessoal|conta pessoal)\b/.test(texto)
                          ? "Despesa pessoal"
                          : ehEntrada && /\b(venda|vendi)\b/.test(texto)
                            ? "Venda"
                            : "Outros";

    const novaOrigem: OrigemLancamento =
      /\b(pessoal|minha conta pessoal|conta pessoal)\b/.test(texto)
        ? "Pessoal"
        : /\b(ordem de servico|os)\b/.test(texto)
          ? "Ordem de Serviço"
          : ehEntrada && /\b(venda|vendi)\b/.test(texto)
            ? "Venda"
            : "Empresa";

    const novaForma: FormaPagamento =
      /\bpix\b/.test(texto)
        ? "PIX"
        : /\b(debito|cartao de debito)\b/.test(texto)
          ? "Débito"
          : /\b(credito|cartao de credito|cartao)\b/.test(texto)
            ? "Crédito"
            : /\b(dinheiro|especie)\b/.test(texto)
              ? "Dinheiro"
              : /\b(transferencia)\b/.test(texto)
                ? "Transferência"
                : /\b(boleto)\b/.test(texto)
                  ? "Boleto"
                  : formaPagamento;

    let novaDescricao = original
      .replace(/choqueseg[:,]?\s*/i, "")
      .replace(/(?:r\$\s*)?\d+(?:[.,]\d{1,2})?\s*(?:reais?|real)?/i, "")
      .replace(/\b(gastei|paguei|comprei|recebi|entrou|vendi|ganhei)\b/gi, "")
      .replace(/\b(na|no|pela|pelo|da|do)\s+(minha\s+)?conta\s+(pessoal|da empresa)\b/gi, "")
      .replace(/\b(pessoal|empresa)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!novaDescricao) {
      novaDescricao =
        novaCategoria === "Outros"
          ? ehEntrada
            ? "Entrada por comando de voz"
            : "Saída por comando de voz"
          : novaCategoria;
    }

    setTipo(ehEntrada ? "Entrada" : "Saída");
    setDescricao(novaDescricao);
    setValor(valorFormatado);
    setCategoria(novaCategoria);
    setOrigem(novaOrigem);
    setFormaPagamento(novaForma);
    setTextoVoz(original);
    setMensagem(
      valorFormatado
        ? "Comando de voz reconhecido. Confira os dados e toque em Salvar lançamento."
        : "Reconheci o comando, mas não identifiquei o valor. Confira o formulário.",
    );

    abrirSecaoFinanceiro("novo");
  }

  function iniciarComandoVoz() {
    setMensagem("");

    const SpeechRecognition =
      (
        window as typeof window & {
          SpeechRecognition?: new () => {
            lang: string;
            continuous: boolean;
            interimResults: boolean;
            start: () => void;
            stop: () => void;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onerror:
              | ((evento: { error?: string }) => void)
              | null;
            onresult:
              | ((evento: {
                  results: ArrayLike<{
                    0: { transcript: string };
                  }>;
                }) => void)
              | null;
          };
          webkitSpeechRecognition?: new () => {
            lang: string;
            continuous: boolean;
            interimResults: boolean;
            start: () => void;
            stop: () => void;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onerror:
              | ((evento: { error?: string }) => void)
              | null;
            onresult:
              | ((evento: {
                  results: ArrayLike<{
                    0: { transcript: string };
                  }>;
                }) => void)
              | null;
          };
        }
      ).SpeechRecognition ||
      (
        window as typeof window & {
          webkitSpeechRecognition?: new () => {
            lang: string;
            continuous: boolean;
            interimResults: boolean;
            start: () => void;
            stop: () => void;
            onstart: (() => void) | null;
            onend: (() => void) | null;
            onerror:
              | ((evento: { error?: string }) => void)
              | null;
            onresult:
              | ((evento: {
                  results: ArrayLike<{
                    0: { transcript: string };
                  }>;
                }) => void)
              | null;
          };
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      window.alert(
        "O reconhecimento de voz não está disponível neste navegador. Tente usar o Chrome no celular.",
      );
      return;
    }

    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;

    reconhecimento.onstart = () => {
      setOuvindoVoz(true);
      setMensagem('Ouvindo... fale, por exemplo: "CHOQUESEG, gastei 5 reais de lanche na conta pessoal".');
    };

    reconhecimento.onresult = (evento) => {
      const transcricao = evento.results?.[0]?.[0]?.transcript ?? "";
      if (transcricao) {
        interpretarComandoVoz(transcricao);
      }
    };

    reconhecimento.onerror = (evento) => {
      setOuvindoVoz(false);
      const erro = evento.error ?? "";
      setMensagem(
        erro === "not-allowed"
          ? "Permissão do microfone negada. Libere o microfone no navegador."
          : "Não consegui entender o comando de voz. Tente novamente.",
      );
    };

    reconhecimento.onend = () => {
      setOuvindoVoz(false);
    };

    reconhecimento.start();
  }

  function salvarLancamento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const valorNumerico = Number(
      valor.replace(".", "").replace(",", "."),
    );

    if (!descricao.trim()) {
      setMensagem("Informe a descrição do lançamento.");
      return;
    }

    if (!data) {
      setMensagem("Informe a data.");
      return;
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem("Informe um valor válido.");
      return;
    }

    const novoLancamento: LancamentoFinanceiro = {
      id: crypto.randomUUID(),
      tipo,
      descricao: descricao.trim(),
      valor: valorNumerico,
      data,
      categoria,
      origem,
      formaPagamento,
      clienteNome: clienteNome.trim() || undefined,
      observacao: observacao.trim() || undefined,
      criadoEm: new Date().toISOString(),
      criadoPor: usuarioNome,
    };

    setLancamentos((atuais) => [
      novoLancamento,
      ...atuais,
    ]);

    setDescricao("");
    setValor("");
    setClienteNome("");
    setObservacao("");
    setMensagem("Lançamento salvo com sucesso.");
  }

  function excluirLancamento(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este lançamento?",
    );

    if (!confirmar) return;

    setLancamentos((atuais) =>
      atuais.filter((item) => item.id !== id),
    );
  }

  function limparFiltros() {
    setFiltroTipo("Todos");
    setFiltroOrigem("Todas");
    setFiltroCategoria("Todas");
    setFiltroMes("");
  }
function limparFormulario() {
  setTipo("Saída");
  setDescricao("");
  setValor("");
  setData(new Date().toISOString().slice(0, 10));
  setCategoria("Outros");
  setOrigem("Empresa");
  setFormaPagamento("PIX");
  setClienteNome("");
  setObservacao("");
  setMensagem("Formulário limpo.");
}

function limparDadosTeste() {
  const confirmar = window.confirm(
    "Deseja apagar as movimentações de teste?\n\n" +
      "Serão apagados:\n" +
      "- Lançamentos financeiros\n" +
      "- Contas a pagar\n" +
      "- Contas a receber\n" +
      "- Compras e faturas dos cartões\n\n" +
      "Os cartões e cadastros financeiros serão mantidos.",
  );

  if (!confirmar) return;

  localStorage.removeItem(CHAVE_LANCAMENTOS);
  localStorage.removeItem(CHAVE_CONTAS_PAGAR);
  localStorage.removeItem(CHAVE_CONTAS_RECEBER);

  const cartoesSalvos = localStorage.getItem(CHAVE_CARTOES);

  if (cartoesSalvos) {
    try {
      const cartoes = JSON.parse(cartoesSalvos);

      if (Array.isArray(cartoes)) {
        const cartoesLimpos = cartoes.map((cartao) => ({
          ...cartao,
          limiteUtilizado: 0,
          compras: [],
        }));

        localStorage.setItem(
          CHAVE_CARTOES,
          JSON.stringify(cartoesLimpos),
        );
      }
    } catch {
      // Se os dados estiverem inválidos, não interrompe a limpeza.
    }
  }

  window.alert("Dados de teste apagados com sucesso.");
  window.location.reload();
}

function reiniciarFinanceiro() {
  const confirmacao = window.prompt(
    "ATENÇÃO!\n\n" +
      "Esta ação apagará TODOS os dados do Financeiro.\n\n" +
      "Para confirmar, digite exatamente:\n\n" +
      "APAGAR TUDO",
  );

  if (confirmacao !== "APAGAR TUDO") {
    window.alert("Operação cancelada.");
    return;
  }

  const chavesParaExcluir: string[] = [];

  for (let indice = 0; indice < localStorage.length; indice++) {
    const chave = localStorage.key(indice);

    if (chave?.startsWith(PREFIXO_FINANCEIRO)) {
      chavesParaExcluir.push(chave);
    }
  }

  chavesParaExcluir.forEach((chave) =>
    localStorage.removeItem(chave),
  );

  window.alert("Financeiro reiniciado com sucesso.");
  window.location.reload();
}

function exportarBackupFinanceiro() {
  const backup: Record<string, string> = {};

  for (let indice = 0; indice < localStorage.length; indice++) {
    const chave = localStorage.key(indice);

    if (chave?.startsWith(PREFIXO_FINANCEIRO)) {
      const valor = localStorage.getItem(chave);

      if (valor !== null) {
        backup[chave] = valor;
      }
    }
  }

  const arquivo = {
    sistema: "CHOQUESEG PRO",
    modulo: "Financeiro",
    criadoEm: new Date().toISOString(),
    dados: backup,
  };

  const blob = new Blob(
    [JSON.stringify(arquivo, null, 2)],
    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `backup-financeiro-choqueseg-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  setMensagem("Backup financeiro exportado com sucesso.");
}

function restaurarBackupFinanceiro(
  evento: ChangeEvent<HTMLInputElement>,
) {
  const arquivo = evento.target.files?.[0];

  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = () => {
    try {
      const conteudo = String(leitor.result);
      const backup = JSON.parse(conteudo);

      if (
        !backup ||
        backup.sistema !== "CHOQUESEG PRO" ||
        backup.modulo !== "Financeiro" ||
        typeof backup.dados !== "object"
      ) {
        window.alert(
          "Este arquivo não é um backup financeiro válido do CHOQUESEG PRO.",
        );
        return;
      }

      const confirmar = window.confirm(
        "Deseja restaurar este backup?\n\n" +
          "Os dados financeiros atuais serão substituídos.",
      );

      if (!confirmar) return;

      const chavesAtuais: string[] = [];

      for (
        let indice = 0;
        indice < localStorage.length;
        indice++
      ) {
        const chave = localStorage.key(indice);

        if (chave?.startsWith(PREFIXO_FINANCEIRO)) {
          chavesAtuais.push(chave);
        }
      }

      chavesAtuais.forEach((chave) =>
        localStorage.removeItem(chave),
      );

      Object.entries(backup.dados).forEach(
        ([chave, valor]) => {
          if (
            chave.startsWith(PREFIXO_FINANCEIRO) &&
            typeof valor === "string"
          ) {
            localStorage.setItem(chave, valor);
          }
        },
      );

      window.alert("Backup restaurado com sucesso.");
      window.location.reload();
    } catch {
      window.alert(
        "Não foi possível restaurar o backup. Arquivo inválido.",
      );
    }
  };

  leitor.readAsText(arquivo);

  evento.target.value = "";
}
  const secoes = [
    { id: "resumo", icone: "📊", titulo: "Resumo" },
    { id: "novo", icone: "➕", titulo: "Novo lançamento" },
    { id: "contas", icone: "💰", titulo: "Contas e caixa" },
    { id: "cartoes", icone: "💳", titulo: "Cartões" },
    { id: "faturas", icone: "🧾", titulo: "Faturas" },
    { id: "pagar", icone: "📤", titulo: "Contas a pagar" },
    { id: "receber", icone: "📥", titulo: "Contas a receber" },
    { id: "historico", icone: "📚", titulo: "Histórico" },
    { id: "backup", icone: "⚙️", titulo: "Backup e manutenção" },
  ] as const;

  return (
    <section className="p-4 md:p-7">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Gestão financeira
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase">Financeiro</h2>
        <p className="mt-2 text-zinc-400">
          Escolha uma opção no menu para abrir somente o que você precisa.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-black p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-yellow-400">
              🎙️ Comando de voz CHOQUESEG
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Ex.: “CHOQUESEG, gastei 5 reais de lanche na minha conta pessoal.”
            </p>
            {textoVoz && (
              <p className="mt-2 text-xs text-zinc-500">
                Último comando: {textoVoz}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={iniciarComandoVoz}
            disabled={ouvindoVoz}
            className="min-h-12 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ouvindoVoz ? "🎙️ Ouvindo..." : "🎤 Falar gasto"}
          </button>
        </div>
      </div>

      {mensagem && (
        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-zinc-800 bg-black p-2">
            <p className="px-3 py-2 text-xs font-black uppercase text-zinc-500">
              Menu financeiro
            </p>

            <div className="flex flex-col gap-2">
              {secoes.map((secao) => {
                const ativa = secaoAtiva === secao.id;

                return (
                  <button
                    key={secao.id}
                    type="button"
                    onClick={() => abrirSecaoFinanceiro(secao.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition ${
                      ativa
                        ? "bg-yellow-400 text-black"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
                    }`}
                  >
                    <span className="text-lg">{secao.icone}</span>
                    <span>{secao.titulo}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main ref={conteudoFinanceiroRef} className="min-w-0 flex-1 scroll-mt-4">
          {secaoAtiva === "resumo" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div>
                <p className="text-xs font-black uppercase text-yellow-400">
                  Visão geral
                </p>
                <h3 className="mt-1 text-xl font-black uppercase text-white">
                  Resumo financeiro
                </h3>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <CardResumo titulo="Entradas" valor={resumo.entradas} />
                <CardResumo titulo="Saídas" valor={resumo.saidas} />
                <CardResumo titulo="Saldo" valor={resumo.saldo} />
                <CardResumo titulo="Resultado empresa" valor={resumo.empresa} />
                <CardResumo titulo="Resultado pessoal" valor={resumo.pessoal} />
              </div>
            </section>
          )}

          {secaoAtiva === "novo" && (
            <form
              onSubmit={salvarLancamento}
              className="rounded-3xl border border-yellow-400/30 bg-black p-5"
            >
              <h3 className="text-xl font-black uppercase text-yellow-400">
                Novo lançamento
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CampoSelect
                  label="Tipo"
                  valor={tipo}
                  onChange={(valor) => setTipo(valor as TipoLancamento)}
                  opcoes={["Entrada", "Saída"]}
                />
                <CampoTexto
                  label="Descrição"
                  valor={descricao}
                  onChange={setDescricao}
                  placeholder="Ex.: combustível do veículo"
                />
                <CampoTexto
                  label="Valor"
                  valor={valor}
                  onChange={setValor}
                  placeholder="Ex.: 150,00"
                />
                <CampoTexto
                  label="Data"
                  valor={data}
                  onChange={setData}
                  tipo="date"
                />
                <CampoSelect
                  label="Categoria"
                  valor={categoria}
                  onChange={(valor) =>
                    setCategoria(valor as CategoriaFinanceira)
                  }
                  opcoes={categorias}
                />
                <CampoSelect
                  label="Origem"
                  valor={origem}
                  onChange={(valor) =>
                    setOrigem(valor as OrigemLancamento)
                  }
                  opcoes={origens}
                />
                <CampoSelect
                  label="Forma de pagamento"
                  valor={formaPagamento}
                  onChange={(valor) =>
                    setFormaPagamento(valor as FormaPagamento)
                  }
                  opcoes={formasPagamento}
                />
                <CampoTexto
                  label="Cliente"
                  valor={clienteNome}
                  onChange={setClienteNome}
                  placeholder="Opcional"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
                  Observação
                </label>
                <textarea
                  value={observacao}
                  onChange={(evento) => setObservacao(evento.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais do lançamento"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-black uppercase text-black"
                >
                  Salvar lançamento
                </button>
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-xl border border-zinc-600 px-6 py-3 font-black uppercase text-zinc-300"
                >
                  Limpar formulário
                </button>
              </div>
            </form>
          )}

          {secaoAtiva === "contas" && <ContasFinanceiras />}
          {secaoAtiva === "cartoes" && <CartoesFinanceiros />}
          {secaoAtiva === "faturas" && <FaturasCartoes />}
          {secaoAtiva === "pagar" && <ContasPagar />}
          {secaoAtiva === "receber" && <ContasReceber />}

          {secaoAtiva === "backup" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div>
                <p className="text-xs font-black uppercase text-yellow-400">
                  Administração financeira
                </p>
                <h3 className="mt-1 text-xl font-black uppercase text-white">
                  Backup e manutenção
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Faça backup ou limpe os dados financeiros do sistema.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportarBackupFinanceiro}
                  className="rounded-xl border border-yellow-400/60 px-5 py-3 text-sm font-black uppercase text-yellow-400"
                >
                  Exportar backup
                </button>

                <label className="cursor-pointer rounded-xl border border-emerald-500/60 px-5 py-3 text-sm font-black uppercase text-emerald-400">
                  Restaurar backup
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={restaurarBackupFinanceiro}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={limparDadosTeste}
                  className="rounded-xl border border-orange-500/60 px-5 py-3 text-sm font-black uppercase text-orange-400"
                >
                  Limpar dados de teste
                </button>

                <button
                  type="button"
                  onClick={reiniciarFinanceiro}
                  className="rounded-xl border border-red-500/60 px-5 py-3 text-sm font-black uppercase text-red-400"
                >
                  Reiniciar financeiro
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-zinc-500">
                <strong className="text-red-400">Reiniciar financeiro</strong>{" "}
                apaga permanentemente contas, cartões, faturas e movimentações.
                Faça um backup antes de usar esta opção.
              </div>
            </section>
          )}

          {secaoAtiva === "historico" && (
            <section className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase text-yellow-400">
                    Histórico financeiro
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Use os filtros para consultar os lançamentos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-black uppercase text-zinc-300"
                >
                  Limpar filtros
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CampoSelect
                  label="Tipo"
                  valor={filtroTipo}
                  onChange={(valor) =>
                    setFiltroTipo(valor as "Todos" | TipoLancamento)
                  }
                  opcoes={["Todos", "Entrada", "Saída"]}
                />
                <CampoSelect
                  label="Origem"
                  valor={filtroOrigem}
                  onChange={(valor) =>
                    setFiltroOrigem(valor as "Todas" | OrigemLancamento)
                  }
                  opcoes={["Todas", ...origens]}
                />
                <CampoSelect
                  label="Categoria"
                  valor={filtroCategoria}
                  onChange={(valor) =>
                    setFiltroCategoria(valor as "Todas" | CategoriaFinanceira)
                  }
                  opcoes={["Todas", ...categorias]}
                />
                <CampoTexto
                  label="Mês"
                  valor={filtroMes}
                  onChange={setFiltroMes}
                  tipo="month"
                />
              </div>

              <div className="mt-6 space-y-3">
                {lancamentosFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                    Nenhum lançamento encontrado.
                  </div>
                ) : (
                  lancamentosFiltrados.map((lancamento) => (
                    <article
                      key={lancamento.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${
                                lancamento.tipo === "Entrada"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-red-500/15 text-red-400"
                              }`}
                            >
                              {lancamento.tipo}
                            </span>
                            <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                              {lancamento.categoria}
                            </span>
                            <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                              {lancamento.origem}
                            </span>
                          </div>

                          <h4 className="mt-3 text-lg font-black text-white">
                            {lancamento.descricao}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatarData(lancamento.data)} ·{" "}
                            {lancamento.formaPagamento}
                            {lancamento.clienteNome
                              ? ` · Cliente: ${lancamento.clienteNome}`
                              : ""}
                          </p>
                          {lancamento.observacao && (
                            <p className="mt-2 text-sm text-zinc-400">
                              {lancamento.observacao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4 lg:justify-end">
                          <p
                            className={`text-xl font-black ${
                              lancamento.tipo === "Entrada"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {lancamento.tipo === "Entrada" ? "+" : "-"}{" "}
                            {formatarMoeda(lancamento.valor)}
                          </p>

                          <button
                            type="button"
                            onClick={() => excluirLancamento(lancamento.id)}
                            className="rounded-xl border border-red-500/50 px-4 py-2 text-sm font-black uppercase text-red-400"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <p className="text-xs font-black uppercase text-zinc-500">
        {titulo}
      </p>

      <p
        className={`mt-3 text-2xl font-black ${
          valor < 0 ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {formatarMoeda(valor)}
      </p>
    </div>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">
        {label}
      </label>

      <select
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00`));
}