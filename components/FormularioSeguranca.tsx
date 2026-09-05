"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { produtosIniciais } from "@/components/produtos";
import { createClient } from "@/utils/supabase/client";
import PreviewSeguranca, {
  type DadosPreviewSeguranca,
  type ItemSegurancaPreview,
  type UnidadeOrcamento,
} from "./PreviewSeguranca";

const supabase = createClient();

const WHATSAPP_CHOQUESEG = "5579999390653";
const CHAVE_PROPOSTA_EDICAO = "choqueseg-pro-proposta-edicao-id";

type PropostaBanco = {
  id: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_cidade?: string | null;
  cliente_endereco?: string | null;
  cliente_cpf_cnpj?: string | null;
  tipo_proposta?: string | null;
  valor_total?: number | null;
  observacoes?: string | null;
  status?: string | null;
  criada_em?: string | null;
  atualizada_em?: string | null;
};

type ClienteCadastrado = {
  id: string;
  nome: string;
  telefone?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  cpf_cnpj?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
};

type ItemOrcamento = ItemSegurancaPreview & {
  produtoId: string;
};

const produtosSeguranca = produtosIniciais.filter(
  (produto) =>
    produto.categoria === "Segurança Eletrônica" ||
    produto.categoria === "Mão de Obra",
);

const unidades: UnidadeOrcamento[] = [
  "Unidade",
  "Metro",
  "Rolo",
  "Caixa",
  "Kit",
  "Par",
  "Serviço",
];

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function opcoesFallback(descricao: string) {
  const texto = descricao.toLowerCase();

  if (texto.includes("hd")) {
    return ["500 GB", "1 TB", "2 TB", "3 TB", "4 TB", "6 TB", "8 TB"];
  }

  if (texto === "dvr" || texto.startsWith("dvr ")) {
    return ["4 canais", "8 canais", "16 canais", "32 canais"];
  }

  if (texto === "nvr" || texto.startsWith("nvr ")) {
    return ["4 canais", "8 canais", "16 canais", "32 canais"];
  }

  if (texto.includes("câmera bullet") || texto.includes("camera bullet")) {
    return ["Analógica", "IP"];
  }

  if (texto.includes("câmera dome") || texto.includes("camera dome")) {
    return ["Analógica", "IP"];
  }

  if (texto.includes("câmera wi-fi") || texto.includes("camera wi-fi")) {
    return ["Interna", "Externa", "PTZ", "Fixa"];
  }

  if (texto.includes("central") && texto.includes("cerca")) {
    return ["Convencional", "Monitorada", "Com Wi-Fi"];
  }

  if (texto.includes("bateria")) {
    return ["12V 7Ah", "12V 9Ah"];
  }

  if (texto.includes("motor de portão") || texto.includes("motor de portao")) {
    return ["Deslizante", "Basculante", "Pivotante"];
  }

  return [];
}

function marcasFallback(descricao: string) {
  const texto = descricao.toLowerCase();

  if (texto.includes("hd")) {
    return [
      "Western Digital Purple",
      "Seagate SkyHawk",
      "Toshiba",
      "Intelbras",
      "Outra",
    ];
  }

  if (
    texto.includes("dvr") ||
    texto.includes("nvr") ||
    texto.includes("câmera") ||
    texto.includes("camera")
  ) {
    return ["Intelbras", "Hikvision", "Dahua", "Giga", "JFL", "Outra"];
  }

  if (texto.includes("central") && texto.includes("cerca")) {
    return ["Intelbras", "JFL", "PPA", "Outra"];
  }

  if (texto.includes("sensor")) {
    return ["Intelbras", "JFL", "PPA", "Outra"];
  }

  if (texto.includes("motor") || texto.includes("controle")) {
    return ["PPA", "Rossi", "Garen", "Intelbras", "PCN", "Outra"];
  }

  return [];
}

function inferirUnidade(nome: string): UnidadeOrcamento {
  const texto = nome.toLowerCase();

  if (
    texto.includes("cabo") ||
    texto.includes("fio")
  ) {
    return "Metro";
  }

  if (texto.includes("mão de obra") || texto.includes("instalação")) {
    return "Serviço";
  }

  if (texto.includes("par")) return "Par";
  if (texto.includes("kit")) return "Kit";
  if (texto.includes("rolo")) return "Rolo";
  if (texto.includes("caixa")) return "Caixa";

  return "Unidade";
}


type TipoKitSeguranca = "cerca" | "cftv" | "motor";

type KitBanco = {
  id: string;
  nome: string;
  tipo: TipoKitSeguranca;
};

type KitItemBanco = {
  id: string;
  kit_id: string;
  descricao: string;
  unidade: UnidadeOrcamento;
  quantidade_padrao: number;
  ordem: number;
  ativo: boolean;
  tipo_quantidade?: "metro" | "unidade" | null;
  opcoes?: string[] | null;
  marcas?: string[] | null;
};

type ItemConfigurador = {
  id: string;
  origemId?: string;
  selecionado: boolean;
  descricao: string;
  unidade: UnidadeOrcamento;
  quantidade: number;
  valorUnitario: number;
  tipoQuantidade: "metro" | "unidade";
  opcoes: string[];
  marcas: string[];
  opcaoSelecionada: string;
  marcaSelecionada: string;
  novo?: boolean;
};

async function esperarImagens(elemento: HTMLElement) {
  const imagens = Array.from(elemento.querySelectorAll("img"));

  await Promise.all(
    imagens.map(
      (imagem) =>
        new Promise<void>((resolve) => {
          if (imagem.complete) {
            resolve();
            return;
          }

          const finalizar = () => resolve();
          imagem.addEventListener("load", finalizar, { once: true });
          imagem.addEventListener("error", finalizar, { once: true });
          setTimeout(finalizar, 5000);
        }),
    ),
  );
}

export default function FormularioSeguranca() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [clientes, setClientes] = useState<ClienteCadastrado[]>([]);
  const [clienteIdSelecionado, setClienteIdSelecionado] = useState("");
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [salvandoProposta, setSalvandoProposta] = useState(false);
  const [propostaEmEdicaoId, setPropostaEmEdicaoId] = useState("");
  const [statusPropostaEmEdicao, setStatusPropostaEmEdicao] = useState("Rascunho");
  const [carregandoPropostaEdicao, setCarregandoPropostaEdicao] = useState(false);

  const [kitSelecionado, setKitSelecionado] = useState<TipoKitSeguranca | "">("");
  const [kitAtual, setKitAtual] = useState<KitBanco | null>(null);
  const [itensConfigurador, setItensConfigurador] = useState<ItemConfigurador[]>([]);
  const [configuradorAberto, setConfiguradorAberto] = useState(false);
  const [carregandoKit, setCarregandoKit] = useState(false);
  const [salvandoModeloKit, setSalvandoModeloKit] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [percentualCartao, setPercentualCartao] = useState(0);
  const [parcelasCartao, setParcelasCartao] = useState(1);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [mostrarMensagemWhatsApp, setMostrarMensagemWhatsApp] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [gerandoPDFCelular, setGerandoPDFCelular] = useState(false);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);
  const previewCelularRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregarClientes() {
      try {
        setCarregandoClientes(true);
        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .order("nome", { ascending: true });

        if (error) throw error;
        setClientes((data ?? []) as ClienteCadastrado[]);
      } catch (erro) {
        console.error("Erro ao carregar clientes:", erro);
      } finally {
        setCarregandoClientes(false);
      }
    }

    void carregarClientes();
  }, []);

  async function carregarPropostaParaEdicao(propostaId: string) {
    try {
      setCarregandoPropostaEdicao(true);

      const { data, error } = await supabase
        .from("propostas")
        .select(
          "id,cliente_id,cliente_nome,cliente_telefone,cliente_cidade,cliente_endereco,cliente_cpf_cnpj,tipo_proposta,valor_total,observacoes,status,criada_em,atualizada_em",
        )
        .eq("id", propostaId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("A proposta não foi localizada no histórico.");
      }

      const proposta = data as PropostaBanco;

      if (
        String(proposta.tipo_proposta ?? "").trim().toLowerCase() !==
        "seguranca_eletronica"
      ) {
        throw new Error(
          "Esta proposta não é de Segurança Eletrônica e não pode ser aberta neste formulário.",
        );
      }

      let detalhes: {
        desconto?: number;
        percentualCartao?: number;
        parcelasCartao?: number;
        observacoes?: string;
        itens?: Array<{
          produtoId?: string;
          descricao?: string;
          unidade?: UnidadeOrcamento;
          quantidade?: number;
          valorUnitario?: number;
        }>;
      } = {};

      if (proposta.observacoes) {
        try {
          const parsed = JSON.parse(proposta.observacoes);
          if (parsed && typeof parsed === "object") {
            detalhes = parsed;
          }
        } catch {
          detalhes = { observacoes: proposta.observacoes };
        }
      }

      setPropostaEmEdicaoId(proposta.id);
      setStatusPropostaEmEdicao(proposta.status || "Rascunho");
      setClienteIdSelecionado(proposta.cliente_id ?? "");
      setNome(proposta.cliente_nome ?? "");
      setTelefone(proposta.cliente_telefone ?? "");
      setCidade(proposta.cliente_cidade ?? "");
      setEndereco(proposta.cliente_endereco ?? "");
      setObservacoes(String(detalhes.observacoes ?? ""));
      setDesconto(Number(detalhes.desconto ?? 0));
      setPercentualCartao(Number(detalhes.percentualCartao ?? 0));
      setParcelasCartao(Math.max(1, Number(detalhes.parcelasCartao ?? 1)));

      const itensCarregados: ItemOrcamento[] = Array.isArray(detalhes.itens)
        ? detalhes.itens.map((item, indice) => ({
            id: `edit-${proposta.id}-${indice}`,
            produtoId: String(item.produtoId ?? ""),
            descricao: String(item.descricao ?? "Item"),
            unidade: (item.unidade ?? "Unidade") as UnidadeOrcamento,
            quantidade: Number(item.quantidade ?? 0),
            valorUnitario: Number(item.valorUnitario ?? 0),
          }))
        : [];

      setItens(itensCarregados);
    } catch (erro) {
      console.error("Erro ao abrir proposta para edição:", erro);
      alert(
        erro instanceof Error
          ? `Não foi possível abrir a proposta: ${erro.message}`
          : "Não foi possível abrir a proposta para edição.",
      );
    } finally {
      setCarregandoPropostaEdicao(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const propostaId = localStorage.getItem(CHAVE_PROPOSTA_EDICAO);
    if (!propostaId) return;

    localStorage.removeItem(CHAVE_PROPOSTA_EDICAO);
    void carregarPropostaParaEdicao(propostaId);
  }, []);

  function selecionarCliente(clienteId: string) {
    setClienteIdSelecionado(clienteId);
    const cliente = clientes.find((item) => item.id === clienteId);
    if (!cliente) return;

    setNome(cliente.nome ?? "");
    setTelefone(cliente.telefone ?? "");
    setCidade(cliente.cidade ?? "");
    setEndereco(cliente.endereco ?? "");
  }

  async function salvarPropostaNaNuvem() {
    if (!clienteIdSelecionado) {
      alert("Selecione um cliente cadastrado antes de salvar a proposta.");
      return;
    }
    if (itens.length === 0) {
      alert("Adicione pelo menos um item à proposta antes de salvar.");
      return;
    }
    if (totais.totalFinal <= 0) {
      alert("O valor final da proposta precisa ser maior que zero.");
      return;
    }

    const cliente = clientes.find((item) => item.id === clienteIdSelecionado);
    if (!cliente) {
      alert("Cliente selecionado não foi localizado.");
      return;
    }

    try {
      setSalvandoProposta(true);

      const detalhes = {
        subtotal: totais.subtotal,
        desconto: totais.descontoAplicado,
        total: totais.totalFinal,
        percentualCartao,
        parcelasCartao,
        totalCartao: pagamentoCartao.totalCartao,
        parcelaCartao: pagamentoCartao.valorParcela,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          total: item.quantidade * item.valorUnitario,
        })),
        observacoes,
      };

      const agora = new Date().toISOString();

      const dadosSalvar = {
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone ?? telefone,
        cliente_cidade: cliente.cidade ?? cidade,
        cliente_endereco: cliente.endereco ?? endereco,
        cliente_cpf_cnpj:
          cliente.cpf_cnpj?.trim() ||
          cliente.cpf?.trim() ||
          cliente.cnpj?.trim() ||
          "",
        tipo_proposta: "seguranca_eletronica",
        valor_total: totais.totalFinal,
        observacoes: JSON.stringify(detalhes),
        status: statusPropostaEmEdicao || "Rascunho",
        atualizada_em: agora,
      };

      let propostaSalva: {
        id: string;
        cliente_nome?: string | null;
        tipo_proposta?: string | null;
        valor_total?: number | null;
        status?: string | null;
        criada_em?: string | null;
      } | null = null;

      if (propostaEmEdicaoId) {
        const { data, error } = await supabase
          .from("propostas")
          .update(dadosSalvar)
          .eq("id", propostaEmEdicaoId)
          .select("id,cliente_nome,tipo_proposta,valor_total,status,criada_em")
          .single();

        if (error) throw error;
        propostaSalva = data;
      } else {
        const { data, error } = await supabase
          .from("propostas")
          .insert({
            ...dadosSalvar,
            status: "Rascunho",
            criada_em: agora,
          })
          .select("id,cliente_nome,tipo_proposta,valor_total,status,criada_em")
          .single();

        if (error) throw error;
        propostaSalva = data;
      }

      if (!propostaSalva?.id) {
        throw new Error(
          "O Supabase não confirmou o ID da proposta salva.",
        );
      }

      const { data: confirmacao, error: erroConfirmacao } = await supabase
        .from("propostas")
        .select("id")
        .eq("id", propostaSalva.id)
        .maybeSingle();

      if (erroConfirmacao) throw erroConfirmacao;

      if (!confirmacao?.id) {
        throw new Error(
          "A proposta foi enviada ao banco, mas não foi localizada na conferência.",
        );
      }

      if (propostaEmEdicaoId) {
        alert(
          `Proposta atualizada com sucesso!\n\nCliente: ${cliente.nome}\nValor: ${moeda(
            totais.totalFinal,
          )}\nCódigo: ${propostaSalva.id}`,
        );
      } else {
        setPropostaEmEdicaoId(propostaSalva.id);
        setStatusPropostaEmEdicao("Rascunho");

        alert(
          `Proposta salva na plataforma com sucesso!\n\nCliente: ${cliente.nome}\nValor: ${moeda(
            totais.totalFinal,
          )}\nCódigo: ${propostaSalva.id}`,
        );
      }
    } catch (erro) {
      console.error("Erro ao salvar proposta:", erro);

      const mensagemErro =
        erro && typeof erro === "object" && "message" in erro
          ? String((erro as { message?: unknown }).message ?? "")
          : erro instanceof Error
            ? erro.message
            : String(erro ?? "");

      alert(
        mensagemErro
          ? `Erro ao salvar proposta: ${mensagemErro}`
          : "Não foi possível salvar a proposta na plataforma.",
      );
    } finally {
      setSalvandoProposta(false);
    }
  }

  async function abrirConfiguradorKit(tipo: TipoKitSeguranca) {
    try {
      setCarregandoKit(true);
      setKitSelecionado(tipo);

      const { data: kitRows, error: kitError } = await supabase
        .from("kits_seguranca")
        .select("id,nome,tipo,ativo")
        .order("criado_em", { ascending: true });

      if (kitError) throw kitError;

      const kitsDisponiveis = (kitRows ?? []) as Array<{
        id: string;
        nome: string;
        tipo: string;
        ativo: boolean;
      }>;

      const kitData = kitsDisponiveis.find(
        (item) =>
          item.ativo === true &&
          String(item.tipo ?? "").trim().toLowerCase() ===
            String(tipo).trim().toLowerCase(),
      );

      if (!kitData) {
        const encontrados = kitsDisponiveis.length
          ? kitsDisponiveis
              .map((item) => `${item.nome} [${item.tipo}] ativo=${item.ativo}`)
              .join("\n")
          : "Nenhum registro retornado pela aplicação.";

        alert(
          `Kit "${tipo}" não localizado.\n\nRegistros que a aplicação está enxergando:\n${encontrados}`,
        );
        return;
      }

      const { data: itensData, error: itensError } = await supabase
        .from("kits_seguranca_itens")
        .select("id,kit_id,descricao,unidade,quantidade_padrao,ordem,ativo,tipo_quantidade,opcoes,marcas")
        .eq("kit_id", kitData.id)
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (itensError) throw itensError;

      setKitAtual(kitData as KitBanco);
      setItensConfigurador(
        ((itensData ?? []) as KitItemBanco[]).map((item) => ({
          id: `cfg-${item.id}`,
          origemId: item.id,
          selecionado: Number(item.quantidade_padrao) > 0,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: Number(item.quantidade_padrao) || 0,
          valorUnitario: 0,
          tipoQuantidade:
            item.tipo_quantidade === "metro" ? "metro" : "unidade",
          opcoes:
            Array.isArray(item.opcoes) && item.opcoes.length > 0
              ? item.opcoes
              : opcoesFallback(item.descricao),
          marcas:
            Array.isArray(item.marcas) && item.marcas.length > 0
              ? item.marcas
              : marcasFallback(item.descricao),
          opcaoSelecionada:
            Array.isArray(item.opcoes) && item.opcoes.length > 0
              ? item.opcoes[0]
              : opcoesFallback(item.descricao)[0] ?? "",
          marcaSelecionada:
            Array.isArray(item.marcas) && item.marcas.length > 0
              ? item.marcas[0]
              : marcasFallback(item.descricao)[0] ?? "",
        })),
      );
      setConfiguradorAberto(true);
    } catch (erro) {
      console.error("Erro ao abrir kit:", erro);
      alert(
        erro instanceof Error
          ? `Erro ao abrir kit: ${erro.message}`
          : "Não foi possível carregar o kit.",
      );
    } finally {
      setCarregandoKit(false);
    }
  }

  function atualizarItemConfigurador(
    id: string,
    campo:
      | "selecionado"
      | "descricao"
      | "unidade"
      | "quantidade"
      | "valorUnitario"
      | "opcaoSelecionada"
      | "marcaSelecionada",
    valor: string | boolean,
  ) {
    setItensConfigurador((anteriores) =>
      anteriores.map((item) => {
        if (item.id !== id) return item;

        if (campo === "selecionado") {
          return { ...item, selecionado: Boolean(valor) };
        }

        if (
          campo === "descricao" ||
          campo === "opcaoSelecionada" ||
          campo === "marcaSelecionada"
        ) {
          return { ...item, [campo]: String(valor) };
        }

        if (campo === "unidade") {
          return { ...item, unidade: String(valor) as UnidadeOrcamento };
        }

        const numero = Number(String(valor).replace(",", "."));
        return {
          ...item,
          [campo]: Number.isFinite(numero) ? Math.max(numero, 0) : 0,
        };
      }),
    );
  }

  function adicionarItemAoConfigurador() {
    setItensConfigurador((anteriores) => [
      ...anteriores,
      {
        id: `novo-kit-${Date.now()}`,
        selecionado: true,
        descricao: "Novo item do kit",
        unidade: "Unidade",
        quantidade: 1,
        valorUnitario: 0,
        tipoQuantidade: "unidade",
        opcoes: [],
        marcas: [],
        opcaoSelecionada: "",
        marcaSelecionada: "",
        novo: true,
      },
    ]);
  }

  function removerItemConfigurador(id: string) {
    setItensConfigurador((anteriores) =>
      anteriores.filter((item) => item.id !== id),
    );
  }

  function adicionarSelecionadosAProposta() {
    const selecionados = itensConfigurador.filter(
      (item) => item.selecionado && item.descricao.trim(),
    );

    if (selecionados.length === 0) {
      alert("Selecione pelo menos um item do kit.");
      return;
    }

    const novosItens: ItemOrcamento[] = selecionados.map((item, indice) => ({
      id: `kit-${kitSelecionado}-${Date.now()}-${indice}`,
      produtoId: "",
      descricao: [
        item.descricao.trim(),
        item.opcaoSelecionada.trim(),
        item.marcaSelecionada.trim(),
      ]
        .filter(Boolean)
        .join(" - "),
      unidade: item.tipoQuantidade === "metro" ? "Metro" : item.unidade,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    }));

    setItens((anteriores) => [...anteriores, ...novosItens]);
    setConfiguradorAberto(false);
    alert("Itens selecionados adicionados à proposta.");
  }

  async function salvarAlteracoesModeloKit() {
    if (!kitAtual) return;

    const itensValidos = itensConfigurador.filter((item) =>
      item.descricao.trim(),
    );

    if (itensValidos.length === 0) {
      alert("O modelo precisa ter pelo menos um item.");
      return;
    }

    try {
      setSalvandoModeloKit(true);

      // Atualiza itens já existentes.
      for (let indice = 0; indice < itensValidos.length; indice += 1) {
        const item = itensValidos[indice];

        if (item.origemId) {
          const { error } = await supabase
            .from("kits_seguranca_itens")
            .update({
              descricao: item.descricao.trim(),
              unidade: item.unidade,
              quantidade_padrao: item.quantidade,
              tipo_quantidade: item.tipoQuantidade,
              opcoes: item.opcoes,
              marcas: item.marcas,
              ordem: indice + 1,
              ativo: true,
            })
            .eq("id", item.origemId);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("kits_seguranca_itens")
            .insert({
              kit_id: kitAtual.id,
              descricao: item.descricao.trim(),
              unidade: item.unidade,
              quantidade_padrao: item.quantidade,
              tipo_quantidade: item.tipoQuantidade,
              opcoes: item.opcoes,
              marcas: item.marcas,
              ordem: indice + 1,
              ativo: true,
            })
            .select("id")
            .single();

          if (error) throw error;
          item.origemId = data.id;
        }
      }

      // Itens removidos do editor ficam inativos no modelo.
      const idsMantidos = itensValidos
        .map((item) => item.origemId)
        .filter((id): id is string => Boolean(id));

      const { data: atuais, error: atuaisError } = await supabase
        .from("kits_seguranca_itens")
        .select("id")
        .eq("kit_id", kitAtual.id)
        .eq("ativo", true);

      if (atuaisError) throw atuaisError;

      const idsRemover = (atuais ?? [])
        .map((item) => item.id as string)
        .filter((id) => !idsMantidos.includes(id));

      if (idsRemover.length > 0) {
        const { error } = await supabase
          .from("kits_seguranca_itens")
          .update({ ativo: false })
          .in("id", idsRemover);

        if (error) throw error;
      }

      alert("Modelo do kit atualizado no Supabase.");
      await abrirConfiguradorKit(kitAtual.tipo);
    } catch (erro) {
      console.error("Erro ao salvar modelo do kit:", erro);
      alert(
        erro instanceof Error
          ? `Erro ao salvar modelo: ${erro.message}`
          : "Não foi possível atualizar o modelo do kit.",
      );
    } finally {
      setSalvandoModeloKit(false);
    }
  }

  function adicionarProduto() {
    const produto = produtosSeguranca.find(
      (item) => item.id === produtoSelecionado,
    );

    if (!produto) {
      alert("Selecione um produto.");
      return;
    }

    const novoItem: ItemOrcamento = {
      id: `${produto.id}-${Date.now()}`,
      produtoId: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      unidade: inferirUnidade(produto.nome),
      valorUnitario: produto.valorVenda,
    };

    setItens((anteriores) => [...anteriores, novoItem]);
    setProdutoSelecionado("");
  }

  function adicionarItemManual() {
    const novoItem: ItemOrcamento = {
      id: `manual-${Date.now()}`,
      produtoId: "",
      descricao: "Novo item",
      quantidade: 1,
      unidade: "Unidade",
      valorUnitario: 0,
    };

    setItens((anteriores) => [...anteriores, novoItem]);
  }

  function atualizarItem(
    id: string,
    campo:
      | "descricao"
      | "quantidade"
      | "valorUnitario"
      | "unidade",
    valor: string,
  ) {
    setItens((anteriores) =>
      anteriores.map((item) => {
        if (item.id !== id) return item;

        if (campo === "descricao") {
          return { ...item, descricao: valor };
        }

        if (campo === "unidade") {
          return {
            ...item,
            unidade: valor as UnidadeOrcamento,
          };
        }

        const numero = Number(valor.replace(",", "."));

        return {
          ...item,
          [campo]: Number.isFinite(numero) ? Math.max(numero, 0) : 0,
        };
      }),
    );
  }

  function removerItem(id: string) {
    setItens((anteriores) =>
      anteriores.filter((item) => item.id !== id),
    );
  }

  const totais = useMemo(() => {
    let subtotal = 0;

    for (const item of itens) {
      subtotal += item.quantidade * item.valorUnitario;
    }

    const descontoAplicado = Math.min(
      Math.max(desconto, 0),
      subtotal,
    );

    return {
      subtotal,
      descontoAplicado,
      totalFinal: subtotal - descontoAplicado,
    };
  }, [itens, desconto]);

  const pagamentoCartao = useMemo(() => {
    const parcelas = Math.max(1, Math.round(parcelasCartao || 1));
    const acrescimo = Math.max(0, percentualCartao || 0);
    const totalCartao = totais.totalFinal * (1 + acrescimo / 100);

    return {
      parcelas,
      acrescimo,
      totalCartao,
      valorParcela: parcelas > 0 ? totalCartao / parcelas : totalCartao,
    };
  }, [parcelasCartao, percentualCartao, totais.totalFinal]);

  const dadosPreview: DadosPreviewSeguranca = {
    nome,
    telefone,
    cidade,
    endereco,
    observacoes,
    itens,
    subtotal: totais.subtotal,
    desconto: totais.descontoAplicado,
    total: totais.totalFinal,
    parcelasCartao: pagamentoCartao.parcelas,
    totalCartao: pagamentoCartao.totalCartao,
    parcelaCartao: pagamentoCartao.valorParcela,
  };

  function limparFormulario() {
    setNome("");
    setClienteIdSelecionado("");
    setTelefone("");
    setCidade("");
    setEndereco("");
    setObservacoes("");
    setProdutoSelecionado("");
    setKitSelecionado("");
    setDesconto(0);
    setPercentualCartao(0);
    setParcelasCartao(1);
    setMensagemWhatsApp("");
    setMostrarMensagemWhatsApp(false);
    setItens([]);
    setPropostaEmEdicaoId("");
    setStatusPropostaEmEdicao("Rascunho");
    if (typeof window !== "undefined") {
      localStorage.removeItem(CHAVE_PROPOSTA_EDICAO);
    }
  }

  async function criarPdfDaPropostaVisual() {
    const raiz = previewRef.current;

    if (!raiz) {
      throw new Error("Não foi possível localizar a proposta.");
    }

    const paginas = Array.from(
      raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
    );

    if (paginas.length === 0) {
      throw new Error("Nenhuma página da proposta foi encontrada.");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let indice = 0; indice < paginas.length; indice += 1) {
      const pagina = paginas[indice];

      await esperarImagens(pagina);

      const canvas = await html2canvas(pagina, {
        // Escala alta para preservar letras e detalhes no celular.
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 8000,
        removeContainer: true,
      });

      // PNG evita a perda de nitidez nas letras causada pela compressão JPEG.
      const imagem = canvas.toDataURL("image/png");

      if (indice > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        imagem,
        "PNG",
        0,
        0,
        210,
        297,
        undefined,
        "FAST",
      );

      canvas.width = 1;
      canvas.height = 1;
    }

    return pdf;
  }

  function nomeArquivoPDF() {
    const nomeCliente =
      nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

    return `Proposta-Seguranca-Eletronica-CHOQUESEG-${nomeCliente}.pdf`;
  }

  async function gerarPDF() {
    try {
      setGerandoPDF(true);

      const pdf = await criarPdfDaPropostaVisual();
      pdf.save(nomeArquivoPDF());

      alert("PDF gerado com sucesso.");
    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF.",
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  async function gerarPDFCelular() {
    try {
      setGerandoPDFCelular(true);

      const pdf = await criarPdfDaPropostaVisual();

      // Evita o erro do navigator.share no Chrome após a geração assíncrona.
      // O PDF é salvo normalmente e o WhatsApp é aberto pelo botão
      // "Preparar mensagem", onde você revisa o texto antes de enviar.
      pdf.save(nomeArquivoPDF());

      alert(
        "PDF gerado com sucesso. Agora clique em PREPARAR MENSAGEM para abrir o WhatsApp do cliente e anexar o PDF.",
      );
    } catch (erro) {
      console.error("Erro ao gerar PDF para WhatsApp:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF para WhatsApp.",
      );
    } finally {
      setGerandoPDFCelular(false);
    }
  }

  function abrirWhatsAppChoqueSeg() {
    const mensagem = encodeURIComponent(
      `Olá! Quero fechar a proposta de Segurança Eletrônica da CHOQUESEG para ${nome || "o cliente"}. Valor da proposta: ${moeda(
        totais.totalFinal,
      )}.`,
    );

    window.open(
      `https://wa.me/${WHATSAPP_CHOQUESEG}?text=${mensagem}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function montarMensagemProposta() {
    const primeiroNome = nome.trim().split(/\s+/)[0] || "cliente";

    const principaisItens = itens
      .filter((item) => item.descricao.trim())
      .slice(0, 3)
      .map((item) => {
        const quantidade = Number(item.quantidade) || 0;
        return quantidade > 1
          ? `${quantidade}x ${item.descricao.trim()}`
          : item.descricao.trim();
      });

    const resumoItens =
      principaisItens.length > 0
        ? ` A proposta contempla ${principaisItens.join(", ")}.`
        : "";

    const trechoCartao =
      pagamentoCartao.parcelas > 1
        ? ` No cartão, o pagamento pode ser feito em ${pagamentoCartao.parcelas}x de ${moeda(
            pagamentoCartao.valorParcela,
          )}, exatamente conforme a condição registrada na proposta.`
        : "";

    return (
      `Olá, ${primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()}! Tudo bem?\n\n` +
      `Preparei sua proposta de Segurança Eletrônica da CHOQUESEG.${resumoItens}\n\n` +
      `O valor à vista ficou em ${moeda(totais.totalFinal)}.${trechoCartao}\n\n` +
      `Todos os equipamentos, quantidades, valores e demais informações estão detalhados no PDF da proposta.\n\n` +
      `Fico à disposição para qualquer dúvida.\n` +
      `Equipe CHOQUESEG`
    );
  }

  function abrirPreparacaoWhatsApp() {
    const numeroCliente = telefone.replace(/\D/g, "");

    if (numeroCliente.length < 10) {
      alert("Informe um telefone válido do cliente.");
      return;
    }

    setMensagemWhatsApp(montarMensagemProposta());
    setMostrarMensagemWhatsApp(true);
  }

  function enviarMensagemWhatsApp() {
    const numeroCliente = telefone.replace(/\D/g, "");
    const destino =
      numeroCliente.startsWith("55") && numeroCliente.length >= 12
        ? numeroCliente
        : numeroCliente.length >= 10
          ? `55${numeroCliente}`
          : "";

    if (!destino) {
      alert("Informe um telefone válido do cliente.");
      return;
    }

    if (!mensagemWhatsApp.trim()) {
      alert("A mensagem não pode ficar vazia.");
      return;
    }

    const mensagem = encodeURIComponent(mensagemWhatsApp);

    window.open(
      `https://wa.me/${destino}?text=${mensagem}`,
      "_blank",
      "noopener,noreferrer",
    );
  }


  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-yellow-400/40 bg-black/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              CHOQUESEG
            </p>
            <h1 className="text-lg font-black uppercase md:text-2xl">
              Proposta de Segurança Eletrônica
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={salvarPropostaNaNuvem}
              disabled={salvandoProposta || carregandoPropostaEdicao}
              className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-60"
            >
              {carregandoPropostaEdicao
                ? "Abrindo..."
                : salvandoProposta
                  ? propostaEmEdicaoId
                    ? "Atualizando..."
                    : "Salvando..."
                  : propostaEmEdicaoId
                    ? "💾 Atualizar proposta"
                    : "💾 Salvar proposta"}
            </button>

            <button
              type="button"
              onClick={gerarPDF}
              disabled={gerandoPDF}
              className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-60"
            >
              {gerandoPDF ? "Gerando PDF..." : "💾 Salvar em PDF"}
            </button>

            <button
              type="button"
              onClick={gerarPDFCelular}
              disabled={gerandoPDFCelular}
              className="rounded-xl border border-yellow-400 bg-black px-4 py-3 text-sm font-black uppercase text-yellow-400 disabled:opacity-60"
            >
              {gerandoPDFCelular ? "Preparando..." : "📲 Enviar PDF WhatsApp"}
            </button>

            <button
              type="button"
              onClick={abrirPreparacaoWhatsApp}
              className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase text-white"
            >
              💬 Preparar mensagem
            </button>

            <button
              type="button"
              onClick={abrirWhatsAppChoqueSeg}
              className="rounded-xl border border-green-500 bg-black px-4 py-3 text-sm font-black uppercase text-green-400"
            >
              ✅ Quero fechar com a CHOQUESEG
            </button>

            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase text-white"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      {propostaEmEdicaoId && (
        <div className="border-b border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-center text-sm font-bold text-yellow-200">
          ✏️ Editando proposta salva — código {propostaEmEdicaoId}
        </div>
      )}

      <div className="mx-auto grid max-w-[1800px] gap-5 p-4 xl:grid-cols-[430px_minmax(0,1fr)] xl:p-6">
        <aside className="self-start rounded-3xl border border-yellow-400/50 bg-black p-5 xl:sticky xl:top-24">
          <div className="space-y-5">
            <Secao titulo="Cliente">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                  Cliente cadastrado
                </span>
                <select
                  value={clienteIdSelecionado}
                  onChange={(evento) => selecionarCliente(evento.target.value)}
                  disabled={carregandoClientes}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400 disabled:opacity-60"
                >
                  <option value="">
                    {carregandoClientes ? "Carregando clientes..." : "Selecione um cliente"}
                  </option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </label>

              <Campo titulo="Nome" valor={nome} aoAlterar={setNome} />
              <Campo
                titulo="Telefone"
                valor={telefone}
                aoAlterar={setTelefone}
              />
              <Campo titulo="Cidade" valor={cidade} aoAlterar={setCidade} />
              <Campo
                titulo="Endereço"
                valor={endereco}
                aoAlterar={setEndereco}
              />
            </Secao>

            <Secao titulo="Kits pré-prontos">
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void abrirConfiguradorKit("cerca")}
                  className={`rounded-xl border px-3 py-3 text-sm font-black uppercase ${
                    kitSelecionado === "cerca"
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-yellow-400 bg-black text-yellow-400"
                  }`}
                >
                  ⚡ Cerca elétrica
                </button>

                <button
                  type="button"
                  onClick={() => void abrirConfiguradorKit("cftv")}
                  className={`rounded-xl border px-3 py-3 text-sm font-black uppercase ${
                    kitSelecionado === "cftv"
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-yellow-400 bg-black text-yellow-400"
                  }`}
                >
                  📹 CFTV
                </button>

                <button
                  type="button"
                  onClick={() => void abrirConfiguradorKit("motor")}
                  className={`rounded-xl border px-3 py-3 text-sm font-black uppercase ${
                    kitSelecionado === "motor"
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-yellow-400 bg-black text-yellow-400"
                  }`}
                >
                  🚪 Motor
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                Clique em um kit para abrir o configurador. Escolha os itens,
                ajuste quantidades e valores e só depois adicione à proposta.
                Você também pode alterar e salvar o modelo para as próximas propostas.
              </div>
            </Secao>

            <Secao titulo="Adicionar equipamento">
              <select
                value={produtoSelecionado}
                onChange={(evento) =>
                  setProdutoSelecionado(evento.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Selecione um produto</option>

                {produtosSeguranca.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={adicionarProduto}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black"
                >
                  Adicionar catálogo
                </button>

                <button
                  type="button"
                  onClick={adicionarItemManual}
                  className="rounded-xl border border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-400"
                >
                  Item manual
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-400">
                Selecione equipamentos de segurança eletrônica no catálogo ou use
                <strong className="text-yellow-400"> Item manual</strong> para
                adicionar qualquer equipamento, material ou serviço extra que surgir na obra.
              </div>
            </Secao>

            <Secao titulo="Condições de Pagamento">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                    Acréscimo no cartão %
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={percentualCartao}
                    onChange={(evento) =>
                      setPercentualCartao(Number(evento.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                    Parcelas no cartão
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={parcelasCartao}
                    onChange={(evento) =>
                      setParcelasCartao(
                        Math.max(1, Math.round(Number(evento.target.value) || 1)),
                      )
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-yellow-400/40 bg-zinc-950 p-4">
                <p className="text-xs font-black uppercase text-zinc-400">
                  Condição que aparecerá na proposta
                </p>
                <p className="mt-2 text-lg font-black text-yellow-400">
                  À vista: {moeda(totais.totalFinal)}
                </p>
                {pagamentoCartao.parcelas > 1 && (
                  <p className="mt-1 font-bold text-white">
                    Cartão: {pagamentoCartao.parcelas}x de{" "}
                    {moeda(pagamentoCartao.valorParcela)}
                  </p>
                )}
              </div>
            </Secao>

            <Secao titulo="Observações">
              <textarea
                value={observacoes}
                onChange={(evento) =>
                  setObservacoes(evento.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
              />
            </Secao>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black uppercase text-yellow-400">
                Itens do orçamento
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ajuste descrição, unidade, quantidade e valor unitário.
              </p>
            </div>

            {itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
                Nenhum equipamento adicionado.
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px_150px_130px_auto] md:items-end">
                      <Campo
                        titulo="Descrição"
                        valor={item.descricao}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "descricao", valor)
                        }
                      />

                      <SelectUnidade
                        valor={item.unidade}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "unidade", valor)
                        }
                      />

                      <Campo
                        titulo="Quantidade"
                        valor={String(item.quantidade)}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "quantidade", valor)
                        }
                      />

                      <Campo
                        titulo="Valor unitário"
                        valor={String(item.valorUnitario)}
                        aoAlterar={(valor) =>
                          atualizarItem(item.id, "valorUnitario", valor)
                        }
                      />

                      <div>
                        <span className="mb-1.5 block text-sm font-bold">
                          Total
                        </span>
                        <div className="rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-yellow-400">
                          {moeda(
                            item.quantidade * item.valorUnitario,
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase text-white"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-4 rounded-3xl border border-yellow-400/40 bg-zinc-900 p-5 md:grid-cols-3">
              <Resumo titulo="Subtotal" valor={moeda(totais.subtotal)} />

              <label>
                <span className="mb-1.5 block text-sm font-bold text-zinc-300">
                  Desconto em reais
                </span>
                <input
                  type="number"
                  min="0"
                  value={desconto}
                  onChange={(evento) =>
                    setDesconto(Number(evento.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-white outline-none focus:border-yellow-400"
                />
              </label>

              <Resumo
                titulo="Valor final"
                valor={moeda(totais.totalFinal)}
                destaque
              />
            </div>
          </section>

          <PreviewSeguranca ref={previewRef} dados={dadosPreview} />
        </section>

        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-10000px] top-0 w-[860px]"
        >
          <PreviewSeguranca ref={previewCelularRef} dados={dadosPreview} />
        </div>
      </div>

      {mostrarMensagemWhatsApp && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto mt-8 w-full max-w-3xl rounded-3xl border border-green-500/50 bg-zinc-950 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400">
                  Mensagem da proposta
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white">
                  Revise antes de abrir o WhatsApp
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMostrarMensagemWhatsApp(false)}
                className="rounded-xl border border-zinc-600 px-3 py-2 text-sm font-black uppercase text-zinc-300"
              >
                Fechar
              </button>
            </div>

            <textarea
              value={mensagemWhatsApp}
              onChange={(evento) => setMensagemWhatsApp(evento.target.value)}
              rows={12}
              className="mt-5 w-full resize-y rounded-2xl border border-zinc-700 bg-black px-4 py-4 text-sm leading-relaxed text-white outline-none focus:border-green-500"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={enviarMensagemWhatsApp}
                className="rounded-xl bg-green-600 px-5 py-4 font-black uppercase text-white"
              >
                💬 Abrir WhatsApp com esta mensagem
              </button>

              <button
                type="button"
                onClick={() => setMensagemWhatsApp(montarMensagemProposta())}
                className="rounded-xl border border-yellow-400 px-5 py-4 font-black uppercase text-yellow-400"
              >
                Restaurar mensagem sugerida
              </button>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              A mensagem é apenas preparada pelo sistema. O envio continua sob sua confirmação no WhatsApp.
            </p>
          </div>
        </div>
      )}

      {configuradorAberto && kitAtual && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto w-full max-w-[1500px] rounded-3xl border border-yellow-400/50 bg-zinc-950 p-4 shadow-2xl md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  Configurador de kit
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white">
                  {kitAtual.nome}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                  Marque somente o que será usado nesta proposta. Você pode alterar
                  descrição, unidade, quantidade e preço. Alterações permanentes só
                  são gravadas quando clicar em Salvar modelo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfiguradorAberto(false)}
                className="rounded-xl border border-zinc-600 px-4 py-2 font-black uppercase text-white"
              >
                Fechar
              </button>
            </div>

            {carregandoKit ? (
              <div className="py-12 text-center font-bold text-zinc-400">
                Carregando kit...
              </div>
            ) : (
              <div className="space-y-3">
                {itensConfigurador.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3 ${
                      item.selecionado
                        ? "border-yellow-400/50 bg-zinc-900"
                        : "border-zinc-800 bg-black opacity-70"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-[90px_minmax(240px,1.4fr)_minmax(160px,0.8fr)_minmax(160px,0.8fr)] md:items-end">
                        <label className="flex h-[46px] items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.selecionado}
                            onChange={(evento) =>
                              atualizarItemConfigurador(
                                item.id,
                                "selecionado",
                                evento.target.checked,
                              )
                            }
                            className="h-5 w-5 accent-yellow-400"
                          />
                          <span className="text-xs font-black uppercase text-zinc-300">
                            Usar
                          </span>
                        </label>

                        <Campo
                          titulo="Equipamento / descrição"
                          valor={item.descricao}
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(item.id, "descricao", valor)
                          }
                        />

                        <SelectOpcoes
                          titulo="Opção / modelo"
                          opcoes={item.opcoes ?? []}
                          valor={item.opcaoSelecionada ?? ""}
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(
                              item.id,
                              "opcaoSelecionada",
                              valor,
                            )
                          }
                        />

                        <SelectOpcoes
                          titulo="Marca"
                          opcoes={item.marcas ?? []}
                          valor={item.marcaSelecionada ?? ""}
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(
                              item.id,
                              "marcaSelecionada",
                              valor,
                            )
                          }
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[150px_150px_170px_150px_minmax(140px,1fr)] lg:items-end lg:pl-[90px]">
                        <SelectUnidade
                          valor={
                            item.tipoQuantidade === "metro"
                              ? "Metro"
                              : item.unidade
                          }
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(item.id, "unidade", valor)
                          }
                        />

                        <Campo
                          titulo={item.tipoQuantidade === "metro" ? "Metros" : "Quantidade"}
                          valor={String(item.quantidade)}
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(item.id, "quantidade", valor)
                          }
                        />

                        <Campo
                          titulo="Valor unitário"
                          valor={String(item.valorUnitario)}
                          aoAlterar={(valor) =>
                            atualizarItemConfigurador(item.id, "valorUnitario", valor)
                          }
                        />

                        <div>
                          <span className="mb-1.5 block text-sm font-bold text-zinc-200">
                            Total
                          </span>
                          <div className="rounded-xl border border-zinc-700 bg-black px-3 py-3 font-black text-yellow-400">
                            {moeda(item.quantidade * item.valorUnitario)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerItemConfigurador(item.id)}
                          className="rounded-xl bg-red-800 px-4 py-3 text-xs font-black uppercase text-white"
                        >
                          Tirar do modelo
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={adicionarItemAoConfigurador}
                  className="w-full rounded-2xl border border-dashed border-yellow-400 px-4 py-4 font-black uppercase text-yellow-400"
                >
                  + Adicionar novo item ao kit
                </button>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-black p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
                    Prévia do kit na proposta
                  </p>
                  <p className="text-xs text-zinc-500">
                    Atualiza enquanto você marca itens, modelos, marcas, quantidades e valores.
                  </p>
                </div>
                <div className="rounded-xl border border-yellow-400 bg-yellow-400 px-4 py-2 text-right text-black">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                    Total do kit
                  </p>
                  <strong className="text-xl">
                    {moeda(
                      itensConfigurador
                        .filter((item) => item.selecionado)
                        .reduce(
                          (total, item) =>
                            total +
                            (Number(item.quantidade) || 0) *
                              (Number(item.valorUnitario) || 0),
                          0,
                        ),
                    )}
                  </strong>
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded-xl border border-zinc-800">
                {itensConfigurador.filter((item) => item.selecionado).length === 0 ? (
                  <p className="p-4 text-sm text-zinc-500">
                    Nenhum item selecionado.
                  </p>
                ) : (
                  itensConfigurador
                    .filter((item) => item.selecionado)
                    .map((item) => (
                      <div
                        key={`preview-${item.id}`}
                        className="grid gap-1 border-b border-zinc-800 px-3 py-2 text-sm last:border-b-0 md:grid-cols-[1fr_100px_130px]"
                      >
                        <span>
                          {[
                            item.descricao,
                            item.opcaoSelecionada ?? "",
                            item.marcaSelecionada ?? "",
                          ]
                            .filter(Boolean)
                            .join(" - ")}
                        </span>
                        <span className="text-zinc-400">
                          {item.quantidade} {item.tipoQuantidade === "metro" ? "m" : "un."}
                        </span>
                        <strong className="text-right text-yellow-400">
                          {moeda(item.quantidade * item.valorUnitario)}
                        </strong>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-800 pt-5">
              <button
                type="button"
                onClick={salvarAlteracoesModeloKit}
                disabled={salvandoModeloKit}
                className="rounded-xl border border-blue-500 px-4 py-3 text-sm font-black uppercase text-blue-400 disabled:opacity-60"
              >
                {salvandoModeloKit ? "Salvando modelo..." : "💾 Salvar alterações no modelo"}
              </button>

              <button
                type="button"
                onClick={adicionarSelecionadosAProposta}
                className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black uppercase text-black"
              >
                Adicionar selecionados à proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-zinc-800 pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Campo({
  titulo,
  valor,
  aoAlterar,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        {titulo}
      </span>
      <input
        type="text"
        value={valor}
        autoComplete="off"
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function SelectOpcoes({
  titulo,
  opcoes,
  valor,
  aoAlterar,
}: {
  titulo: string;
  opcoes?: string[] | null;
  valor: string;
  aoAlterar: (valor: string) => void;
}) {
  const listaOpcoes = Array.isArray(opcoes) ? opcoes : [];

  if (listaOpcoes.length === 0) {
    return (
      <div className="hidden lg:block" aria-hidden="true" />
    );
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        {titulo}
      </span>
      <select
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      >
        {listaOpcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectUnidade({
  valor,
  aoAlterar,
}: {
  valor: UnidadeOrcamento;
  aoAlterar: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-zinc-200">
        Unidade
      </span>
      <select
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"
      >
        {unidades.map((unidade) => (
          <option key={unidade} value={unidade}>
            {unidade}
          </option>
        ))}
      </select>
    </label>
  );
}

function Resumo({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-zinc-400">{titulo}</p>
      <p
        className={`mt-2 text-xl font-black ${
          destaque ? "text-yellow-400" : "text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}