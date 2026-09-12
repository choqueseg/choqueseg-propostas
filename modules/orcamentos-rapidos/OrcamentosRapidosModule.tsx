"use client";

import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { createClient } from "@/utils/supabase/client";

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  endereco: string;
};

type ProdutoOrcamento = {
  id: string;
  nome: string;
  fabricante: string;
  modelo: string;
  categoria: string;
  segmento: string;
  unidade: string;
  valorVenda: number;
  ativo: boolean;
};

type ItemOrcamento = {
  id: string;
  produtoId: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  natureza: "material" | "mao_obra";
};

type TemaOrcamento = "escuro" | "claro";
type ModoCliente = "cadastrado" | "avulso";
export type TipoOrcamentoRapido = "seguranca-eletronica" | "eletrica" | "automacao";

type ModoComposicao = "material-instalacao" | "somente-instalacao" | "somente-material";

const SUBSERVICOS: Record<TipoOrcamentoRapido, string[]> = {
  "seguranca-eletronica": [
    "CFTV / CÃƒÂ¢meras",
    "Cerca ElÃƒÂ©trica + Alarme",
    "Motores / PortÃƒÂµes",
    "Interfone / Videoporteiro",
    "Controle de Acesso",
  ],
  eletrica: [
    "ElÃƒÂ©trica Geral",
    "Quadros e ProteÃƒÂ§ÃƒÂµes",
    "Cabos e Infraestrutura",
    "Tomadas e Comandos",
    "IluminaÃƒÂ§ÃƒÂ£o",
  ],
  automacao: [
    "Fechaduras Digitais",
    "IluminaÃƒÂ§ÃƒÂ£o e Comandos",
    "Sensores e SeguranÃƒÂ§a",
    "Motores e Aberturas",
    "Assistentes e Hubs",
    "Rede e Infraestrutura",
    "Casa Inteligente Geral",
  ],
};


type Props = {
  tipo?: TipoOrcamentoRapido;
};

const supabase = createClient();
const ENDERECO_EMPRESA_PADRAO = "Rodovia dos NÃƒÂ¡ufragos, Robalo, 710 - Aracaju/SE";
const TELEFONE_EMPRESA = "(79) 9.9939-0653";
const INSTAGRAM_EMPRESA = "@CHOQUESEG";

const CONFIG_ORCAMENTO: Record<TipoOrcamentoRapido, {
  titulo: string;
  tipoServico: string;
  origem: string;
  categorias: string[];
}> = {
  "seguranca-eletronica": {
    titulo: "SeguranÃƒÂ§a EletrÃƒÂ´nica",
    tipoServico: "SeguranÃƒÂ§a EletrÃƒÂ´nica",
    origem: "OrÃƒÂ§amento SeguranÃƒÂ§a EletrÃƒÂ´nica",
    categorias: ["SeguranÃƒÂ§a EletrÃƒÂ´nica", "MÃƒÂ£o de Obra"],
  },
  eletrica: {
    titulo: "ElÃƒÂ©trica",
    tipoServico: "ElÃƒÂ©trica",
    origem: "OrÃƒÂ§amento ElÃƒÂ©trica",
    categorias: ["ElÃƒÂ©trica", "MÃƒÂ£o de Obra"],
  },
  automacao: {
    titulo: "AutomaÃƒÂ§ÃƒÂ£o / Casa Inteligente",
    tipoServico: "AutomaÃƒÂ§ÃƒÂ£o",
    origem: "OrÃƒÂ§amento AutomaÃƒÂ§ÃƒÂ£o",
    categorias: ["AutomaÃƒÂ§ÃƒÂ£o", "Casa Inteligente", "MÃƒÂ£o de Obra"],
  },
};

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(valor) ? valor : 0);
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function retornoSegundoDiaPelaManha() {
  const data = new Date();
  data.setDate(data.getDate() + 2);
  data.setHours(8, 0, 0, 0);
  return data.toISOString();
}

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inferirUnidade(nome: string) {
  const texto = nome.toLowerCase();
  if (texto.includes("cabo") || texto.includes("fio")) return "Metro";
  if (texto.includes("mÃƒÂ£o de obra") || texto.includes("instalaÃƒÂ§ÃƒÂ£o")) return "ServiÃƒÂ§o";
  if (texto.includes("kit")) return "Kit";
  if (texto.includes("rolo")) return "Rolo";
  if (texto.includes("caixa")) return "Caixa";
  return "Unidade";
}

function segmentoDoTipo(tipo: TipoOrcamentoRapido) {
  if (tipo === "seguranca-eletronica") return "SeguranÃƒÂ§a eletrÃƒÂ´nica";
  if (tipo === "eletrica") return "ElÃƒÂ©trica";
  return "Casa inteligente";
}

function categoriaEstoqueDoTipo(tipo: TipoOrcamentoRapido) {
  if (tipo === "eletrica") return "ProteÃƒÂ§ÃƒÂ£o elÃƒÂ©trica";
  if (tipo === "automacao") return "AutomaÃƒÂ§ÃƒÂ£o";
  return "Outros";
}

function novoItem(): ItemOrcamento {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
    produtoId: "",
    descricao: "",
    quantidade: 1,
    unidade: "Unidade",
    valorUnitario: 0,
    natureza: "material",
  };
}

export default function OrcamentosRapidosModule({ tipo = "seguranca-eletronica" }: Props) {
  const config = CONFIG_ORCAMENTO[tipo];
  const [subservico, setSubservico] = useState(SUBSERVICOS[tipo][0]);
  const [modoComposicao, setModoComposicao] = useState<ModoComposicao>("material-instalacao");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [produtosCatalogo, setProdutosCatalogo] = useState<ProdutoOrcamento[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [cadastroProdutoAberto, setCadastroProdutoAberto] = useState(false);
  const [novoProdutoNome, setNovoProdutoNome] = useState("");
  const [novoProdutoFabricante, setNovoProdutoFabricante] = useState("");
  const [novoProdutoModelo, setNovoProdutoModelo] = useState("");
  const [novoProdutoUnidade, setNovoProdutoUnidade] = useState("Unidade");
  const [novoProdutoCusto, setNovoProdutoCusto] = useState("");
  const [novoProdutoVenda, setNovoProdutoVenda] = useState("");
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [produtoParaExcluirId, setProdutoParaExcluirId] = useState("");
  const [excluindoProduto, setExcluindoProduto] = useState(false);

  const produtosCategoria = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    const segmentoAtual = segmentoDoTipo(tipo).toLowerCase();

    return produtosCatalogo
      .filter((produto) => {
        if (!produto.ativo) return false;
        if (produto.segmento.trim().toLowerCase() !== segmentoAtual) return false;
        if (modoComposicao === "somente-instalacao") return false;

        if (!termo) return true;

        return [produto.nome, produto.fabricante, produto.modelo, produto.categoria]
          .join(" ")
          .toLowerCase()
          .includes(termo);
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtosCatalogo, tipo, modoComposicao, buscaProduto]);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [modoCliente, setModoCliente] = useState<ModoCliente>("cadastrado");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [salvarComoCliente, setSalvarComoCliente] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState<"valor" | "percentual">("valor");
  const [desconto, setDesconto] = useState(0);
  const [itens, setItens] = useState<ItemOrcamento[]>([novoItem()]);
  const [tema, setTema] = useState<TemaOrcamento>("escuro");
  const [enderecoEmpresa, setEnderecoEmpresa] = useState(ENDERECO_EMPRESA_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemPadrao, setMensagemPadrao] = useState(
    "OlÃƒÂ¡, {primeiro_nome}! Tudo bem?\n\nPreparei seu orÃƒÂ§amento de {tipo_servico}.\n\n{itens}\n\nValor total: {valor_total}.\n\nEstou enviando o orÃƒÂ§amento em PDF para sua anÃƒÂ¡lise. Qualquer dÃƒÂºvida, estou ÃƒÂ  disposiÃƒÂ§ÃƒÂ£o.\n\nEquipe CHOQUESEG"
  );
  const [mensagemEnvio, setMensagemEnvio] = useState("");
  const [salvandoMensagem, setSalvandoMensagem] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewAberto, setPreviewAberto] = useState(false);
  const [mensagemAberta, setMensagemAberta] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutosCatalogo() {
      setCarregandoProdutos(true);
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("id,nome,categoria,fabricante,modelo,unidade,valor_venda,segmento,ativo")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar catÃƒÂ¡logo do orÃƒÂ§amento:", error);
        setErro(`NÃƒÂ£o foi possÃƒÂ­vel carregar os produtos cadastrados: ${error.message}`);
        setCarregandoProdutos(false);
        return;
      }

      setProdutosCatalogo(
        (data ?? []).map((produto: any) => ({
          id: String(produto.id),
          nome: String(produto.nome ?? ""),
          fabricante: String(produto.fabricante ?? ""),
          modelo: String(produto.modelo ?? ""),
          categoria: String(produto.categoria ?? ""),
          segmento: String(produto.segmento ?? ""),
          unidade: String(produto.unidade ?? "Unidade"),
          valorVenda: Number(produto.valor_venda ?? 0),
          ativo: produto.ativo ?? true,
        })),
      );
      setCarregandoProdutos(false);
    }

    void carregarProdutosCatalogo();

    const canal = supabase
      .channel(`orcamento-produtos-${tipo}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estoque_produtos" },
        () => void carregarProdutosCatalogo(),
      )
      .subscribe();

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
    };
  }, [tipo]);

  useEffect(() => {
    async function carregarClientes() {
      try {
        setCarregando(true);
        setErro("");
        const { data, error } = await supabase
          .from("clientes")
          .select("id,nome,telefone,cidade,endereco")
          .order("nome", { ascending: true });
        if (error) throw error;
        setClientes(
          (data ?? []).map((item: any) => ({
            id: String(item.id),
            nome: String(item.nome ?? ""),
            telefone: String(item.telefone ?? ""),
            cidade: String(item.cidade ?? ""),
            endereco: String(item.endereco ?? ""),
          })),
        );
      } catch (e: any) {
        console.error("Erro ao carregar clientes:", e);
        setErro(e?.message || "NÃƒÂ£o foi possÃƒÂ­vel carregar os clientes.");
      } finally {
        setCarregando(false);
      }
    }
    void carregarClientes();
  }, []);

  useEffect(() => {
    setItens([novoItem()]);
    setSubservico(SUBSERVICOS[tipo][0]);
    setBuscaProduto("");
    setProdutoSelecionadoId("");
    setProdutoParaExcluirId("");
  }, [tipo]);

  const subtotalMateriais = useMemo(
    () =>
      itens
        .filter((item) => item.natureza === "material")
        .reduce((soma, item) => soma + Number(item.quantidade || 0) * Number(item.valorUnitario || 0), 0),
    [itens],
  );

  const subtotalMaoObra = useMemo(
    () =>
      itens
        .filter((item) => item.natureza === "mao_obra")
        .reduce((soma, item) => soma + Number(item.quantidade || 0) * Number(item.valorUnitario || 0), 0),
    [itens],
  );

  const subtotal = subtotalMateriais + subtotalMaoObra;

  const valorDesconto = useMemo(() => {
    const valor = Math.max(0, Number(desconto || 0));
    if (tipoDesconto === "percentual") {
      return Math.min(subtotal, subtotal * Math.min(valor, 100) / 100);
    }
    return Math.min(subtotal, valor);
  }, [desconto, tipoDesconto, subtotal]);

  const total = Math.max(0, subtotal - valorDesconto);

  useEffect(() => {
    async function carregarMensagemPadrao() {
      const { data, error } = await supabase
        .from("mensagens_padrao")
        .select("mensagem")
        .eq("chave", "orcamento-rapido")
        .maybeSingle();
      if (error) {
        console.error("Erro ao carregar mensagem padrÃƒÂ£o:", error);
        return;
      }
      if (data?.mensagem) setMensagemPadrao(String(data.mensagem));
    }
    void carregarMensagemPadrao();
  }, []);

  async function salvarMensagemPadrao() {
    if (!mensagemPadrao.trim()) {
      alert("Digite a mensagem padrÃƒÂ£o antes de salvar.");
      return;
    }
    setSalvandoMensagem(true);
    try {
      const { error } = await supabase
        .from("mensagens_padrao")
        .upsert(
          {
            chave: "orcamento-rapido",
            mensagem: mensagemPadrao.trim(),
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "chave" },
        );
      if (error) throw error;
      alert("Mensagem padrÃƒÂ£o salva com sucesso.");
    } catch (e) {
      console.error("Erro ao salvar mensagem padrÃƒÂ£o:", e);
      alert("NÃƒÂ£o foi possÃƒÂ­vel salvar a mensagem padrÃƒÂ£o.");
    } finally {
      setSalvandoMensagem(false);
    }
  }

  function montarMensagemDoModelo(modelo = mensagemPadrao) {
    const primeiroNome = nome.trim().split(/\s+/)[0] || "cliente";
    const resumoItens = itens
      .filter((item) => item.descricao.trim())
      .map(
        (item) =>
          `Ã¢â‚¬Â¢ ${item.descricao} Ã¢â‚¬â€ ${item.quantidade} ${item.unidade} x ${moeda(item.valorUnitario)}`,
      )
      .join("\n");

    return modelo
      .replaceAll("{primeiro_nome}", primeiroNome)
      .replaceAll("{nome_cliente}", nome.trim() || "cliente")
      .replaceAll("{tipo_servico}", config.titulo)
      .replaceAll("{itens}", resumoItens || "Itens conforme orÃƒÂ§amento em PDF")
      .replaceAll("{subtotal}", moeda(subtotal))
      .replaceAll("{materiais}", moeda(subtotalMateriais))
      .replaceAll("{mao_obra}", moeda(subtotalMaoObra))
      .replaceAll("{desconto}", moeda(valorDesconto))
      .replaceAll("{valor_total}", moeda(total));
  }

  function selecionarCliente(id: string) {
    setClienteId(id);
    const cliente = clientes.find((item) => item.id === id);
    if (!cliente) {
      setNome("");
      setTelefone("");
      setCidade("");
      setEndereco("");
      return;
    }
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setCidade(cliente.cidade);
    setEndereco(cliente.endereco);
  }

  function trocarModoCliente(modo: ModoCliente) {
    setModoCliente(modo);
    setClienteId("");
    setNome("");
    setTelefone("");
    setCidade("");
    setEndereco("");
    setSalvarComoCliente(false);
  }

  function atualizarItem(id: string, campo: "descricao" | "unidade" | "quantidade" | "valorUnitario" | "natureza", valor: string) {
    setItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== id) return item;
        if (campo === "descricao" || campo === "unidade" || campo === "natureza") return { ...item, [campo]: valor };
        const numero = Number(valor.replace(",", "."));
        return { ...item, [campo]: Number.isFinite(numero) ? Math.max(0, numero) : 0 };
      }),
    );
  }

  function selecionarProduto(idItem: string, produtoId: string) {
    const produto = produtosCategoria.find((item) => item.id === produtoId);
    setItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== idItem) return item;
        if (!produto) return { ...item, produtoId: "" };
        return {
          ...item,
          produtoId: produto.id,
          descricao: produto.nome,
          unidade: produto.unidade || inferirUnidade(produto.nome),
          valorUnitario: Number(produto.valorVenda || 0),
          natureza: "material",
        };
      }),
    );
  }

  async function cadastrarNovoProdutoRapido() {
    const nomeProduto = novoProdutoNome.trim();
    if (!nomeProduto) {
      alert("Informe o nome do produto.");
      return;
    }

    const custo = Number(novoProdutoCusto.replace(",", ".")) || 0;
    const venda = Number(novoProdutoVenda.replace(",", ".")) || 0;
    if (custo < 0 || venda < 0) {
      alert("Custo e valor de venda nÃƒÂ£o podem ser negativos.");
      return;
    }

    setSalvandoProduto(true);
    const id = crypto.randomUUID();
    const segmento = segmentoDoTipo(tipo);
    const categoria = categoriaEstoqueDoTipo(tipo);

    const { data, error } = await supabase
      .from("estoque_produtos")
      .insert({
        id,
        nome: nomeProduto,
        categoria,
        segmento,
        fabricante: novoProdutoFabricante.trim() || null,
        modelo: novoProdutoModelo.trim() || null,
        unidade: novoProdutoUnidade,
        quantidade_atual: 0,
        estoque_minimo: 0,
        custo_unitario: custo,
        valor_venda: venda,
        ativo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select("id,nome,categoria,fabricante,modelo,unidade,valor_venda,segmento,ativo")
      .single();

    setSalvandoProduto(false);

    if (error) {
      console.error("Erro ao cadastrar produto pelo orÃƒÂ§amento:", error);
      alert(`NÃƒÂ£o foi possÃƒÂ­vel cadastrar o produto: ${error.message}`);
      return;
    }

    const produtoCriado: ProdutoOrcamento = {
      id: String(data.id),
      nome: String(data.nome ?? nomeProduto),
      fabricante: String(data.fabricante ?? ""),
      modelo: String(data.modelo ?? ""),
      categoria: String(data.categoria ?? categoria),
      segmento: String(data.segmento ?? segmento),
      unidade: String(data.unidade ?? novoProdutoUnidade),
      valorVenda: Number(data.valor_venda ?? venda),
      ativo: data.ativo ?? true,
    };

    setProdutosCatalogo((atuais) =>
      [...atuais.filter((item) => item.id !== produtoCriado.id), produtoCriado].sort((a, b) =>
        a.nome.localeCompare(b.nome),
      ),
    );
    setBuscaProduto(nomeProduto);
    setProdutoSelecionadoId(produtoCriado.id);
    setNovoProdutoNome("");
    setNovoProdutoFabricante("");
    setNovoProdutoModelo("");
    setNovoProdutoUnidade("Unidade");
    setNovoProdutoCusto("");
    setNovoProdutoVenda("");
    setCadastroProdutoAberto(false);
    alert("Produto cadastrado na nuvem e disponÃƒÂ­vel no orÃƒÂ§amento.");
  }

  async function excluirProdutoDoCatalogo() {
    if (!produtoParaExcluirId) {
      alert("Selecione um produto para excluir.");
      return;
    }

    const produto = produtosCatalogo.find((item) => item.id === produtoParaExcluirId);
    if (!produto) {
      alert("Produto nÃƒÂ£o encontrado.");
      return;
    }

    const confirmar = window.confirm(
      `Excluir "${produto.nome}" do catÃƒÂ¡logo?\n\nEle deixarÃƒÂ¡ de aparecer nos prÃƒÂ³ximos orÃƒÂ§amentos.`
    );
    if (!confirmar) return;

    setExcluindoProduto(true);

    const { error } = await supabase
      .from("estoque_produtos")
      .delete()
      .eq("id", produtoParaExcluirId);

    setExcluindoProduto(false);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      alert(`NÃƒÂ£o foi possÃƒÂ­vel excluir o produto: ${error.message}`);
      return;
    }

    setProdutosCatalogo((atuais) =>
      atuais.filter((item) => item.id !== produtoParaExcluirId)
    );

    // Se o produto jÃƒÂ¡ estiver usado no orÃƒÂ§amento atual, mantÃƒÂ©m a descriÃƒÂ§ÃƒÂ£o/valor
    // e transforma o item em manual para nÃƒÂ£o perder o orÃƒÂ§amento.
    setItens((atuais) =>
      atuais.map((item) =>
        item.produtoId === produtoParaExcluirId
          ? { ...item, produtoId: "" }
          : item
      )
    );

    setProdutoParaExcluirId("");
    alert("Produto excluÃƒÂ­do do catÃƒÂ¡logo.");
  }

  function adicionarItem() {
    setItens((atuais) => [...atuais, novoItem()]);
  }

  function removerItem(id: string) {
    setItens((atuais) => {
      const restantes = atuais.filter((item) => item.id !== id);
      return restantes.length ? restantes : [novoItem()];
    });
  }

  function validar() {
    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return false;
    }
    if (!itens.some((item) => item.descricao.trim())) {
      alert("Adicione pelo menos um item ou serviÃƒÂ§o ao orÃƒÂ§amento.");
      return false;
    }
    return true;
  }

  async function cadastrarClienteAvulsoSeSolicitado() {
    if (modoCliente !== "avulso" || !salvarComoCliente) return true;
    if (!nome.trim()) return false;
    try {
      setSalvandoCliente(true);
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          nome: nome.trim(),
          telefone: telefone.trim(),
          cidade: cidade.trim(),
          endereco: endereco.trim(),
          tipo_servico: config.tipoServico,
          status: "Novo Contato",
          origem: config.origem,
        })
        .select("id,nome,telefone,cidade,endereco")
        .single();
      if (error) throw error;
      if (data) {
        const novo: Cliente = {
          id: String(data.id), nome: String(data.nome ?? nome), telefone: String(data.telefone ?? telefone),
          cidade: String(data.cidade ?? cidade), endereco: String(data.endereco ?? endereco),
        };
        setClientes((atuais) => [...atuais, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
        setClienteId(novo.id);
        setModoCliente("cadastrado");
      }
      return true;
    } catch (e: any) {
      console.error("Erro ao cadastrar cliente:", e);
      alert(`NÃƒÂ£o foi possÃƒÂ­vel cadastrar o cliente: ${e?.message || "erro desconhecido"}. O orÃƒÂ§amento nÃƒÂ£o foi perdido.`);
      return false;
    } finally {
      setSalvandoCliente(false);
    }
  }

  function htmlOrcamento() {
    const linhas = itens.filter((item) => item.descricao.trim()).map((item) => `
      <tr>
        <td>${escaparHtml(item.descricao)}</td>
        <td class="centro">${escaparHtml(item.unidade || "Unidade")}</td>
        <td class="centro">${item.quantidade}</td>
        <td class="direita">${moeda(item.valorUnitario)}</td>
        <td class="direita forte">${moeda(item.quantidade * item.valorUnitario)}</td>
      </tr>`).join("");
    const descontoLabel = tipoDesconto === "percentual" ? `Desconto (${Math.min(Number(desconto || 0), 100)}%)` : "Desconto";
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><title>OrÃƒÂ§amento ${escaparHtml(config.titulo)} - ${escaparHtml(nome)}</title>
<style>
@page{size:A4;margin:13mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;background:#fff;color:#111}.pagina{width:100%;max-width:760px;margin:0 auto;border:1px solid #ddd}.cabecalho{background:#080808;overflow:hidden;border-bottom:4px solid #facc15}.cabecalho img{width:100%;height:auto;display:block;object-fit:contain;object-position:center top}.corpo{padding:22px}.titulo{margin:0 0 16px;font-size:27px;line-height:1.15}.dados{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;background:#f4f4f4;border:1px solid #ddd;padding:14px 16px}.dados p{margin:0;font-size:14px;line-height:1.4}table{width:100%;border-collapse:collapse;margin-top:18px;table-layout:fixed}th,td{border-bottom:1px solid #ddd;padding:10px 8px;font-size:13px;line-height:1.35}th{background:#111;color:#facc15;text-align:left}th:nth-child(1){width:42%}th:nth-child(2){width:12%}th:nth-child(3){width:10%}th:nth-child(4),th:nth-child(5){width:18%}.centro{text-align:center}.direita{text-align:right}.forte{font-weight:800}.totais{margin:18px 0 0 auto;width:330px;font-size:14px}.linha{display:flex;justify-content:space-between;padding:4px 0}.final{border-top:2px solid #111;margin-top:6px;padding-top:10px;font-size:24px;font-weight:900}.obs{margin-top:18px;border:1px solid #ddd;padding:13px;font-size:13px;line-height:1.45;white-space:pre-wrap}.convite-fechar{margin:22px 0 8px;text-align:center;font-size:15px;line-height:1.45;font-weight:700}.fechar{display:block;margin-top:10px;background:#facc15;color:#111;padding:18px 14px;text-align:center;font-size:20px;font-weight:900;text-decoration:none;border-radius:8px;border:2px solid #111}.rodape{width:100%;background:#080808;color:#fff;border-top:3px solid #facc15;padding:14px 16px;display:flex;align-items:center;gap:14px;font-size:12px;font-weight:700}.rodape img{width:44px;height:44px;object-fit:contain}.rodape .contato{display:flex;flex-wrap:wrap;gap:7px 18px;align-items:center;line-height:1.35}.rodape strong{color:#facc15;font-size:13px}@media print{.pagina{border:none}.fechar{color:#111!important}}
</style></head><body><div class="pagina">
<div class="cabecalho"><img src="/orcamentos/cabecalho-seguranca-visual.png" alt="CHOQUESEG Ã¢â‚¬â€ SeguranÃƒÂ§a, elÃƒÂ©trica e automaÃƒÂ§ÃƒÂ£o"/></div>
<div class="corpo"><h2 class="titulo">ORÃƒâ€¡AMENTO Ã¢â‚¬â€ ${escaparHtml(config.titulo.toUpperCase())}</h2><div class="dados"><p><strong>Cliente:</strong> ${escaparHtml(nome)}</p><p><strong>Telefone:</strong> ${escaparHtml(telefone || "Ã¢â‚¬â€")}</p><p><strong>Cidade:</strong> ${escaparHtml(cidade || "Ã¢â‚¬â€")}</p><p><strong>EndereÃƒÂ§o:</strong> ${escaparHtml(endereco || "Ã¢â‚¬â€")}</p></div>
<table><thead><tr><th>DescriÃƒÂ§ÃƒÂ£o</th><th>Unid.</th><th>Qtd.</th><th>UnitÃƒÂ¡rio</th><th>Total</th></tr></thead><tbody>${linhas}</tbody></table>
<div class="totais"><div class="linha"><span>Materiais</span><strong>${moeda(subtotalMateriais)}</strong></div><div class="linha"><span>MÃƒÂ£o de obra / instalaÃƒÂ§ÃƒÂ£o</span><strong>${moeda(subtotalMaoObra)}</strong></div><div class="linha"><span>${descontoLabel}</span><strong>- ${moeda(valorDesconto)}</strong></div><div class="linha final"><span>TOTAL</span><span>${moeda(total)}</span></div></div>
${modoComposicao === "somente-instalacao" ? `<div class="obs"><strong>ComposiÃƒÂ§ÃƒÂ£o:</strong><br/>Equipamento/material fornecido pelo cliente. Este orÃƒÂ§amento refere-se ÃƒÂ  instalaÃƒÂ§ÃƒÂ£o/mÃƒÂ£o de obra.</div>` : ""}${observacoes.trim() ? `<div class="obs"><strong>ObservaÃƒÂ§ÃƒÂµes:</strong><br/>${escaparHtml(observacoes).replace(/\n/g, "<br/>")}</div>` : ""}<div class="convite-fechar">Gostou do orÃƒÂ§amento? Para confirmar o serviÃƒÂ§o, responda ÃƒÂ  mensagem enviada pela CHOQUESEG.</div><div class="fechar">Ã°Å¸Â¤Â QUERO FECHAR COM A CHOQUESEG</div></div>
<div class="rodape"><img src="/imagens/logo/brasao-choqueseg.png"/><div class="contato"><strong>CHOQUESEG</strong><span>${TELEFONE_EMPRESA}</span><span>${INSTAGRAM_EMPRESA}</span><span>${escaparHtml(enderecoEmpresa)}</span></div></div></div></body></html>`;
  }


  async function criarPDFOrcamento(): Promise<Blob> {
    if (!validar()) throw new Error("Revise os dados do orÃƒÂ§amento.");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff;";
    const frame = document.createElement("iframe");
    frame.style.cssText = "width:794px;height:1123px;border:0;";
    host.appendChild(frame); document.body.appendChild(host);

    try {
      const doc = frame.contentDocument;
      if (!doc) throw new Error("NÃƒÂ£o foi possÃƒÂ­vel preparar o orÃƒÂ§amento.");
      doc.open(); doc.write(htmlOrcamento()); doc.close();
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      const pagina = doc.querySelector<HTMLElement>(".pagina");
      if (!pagina) throw new Error("NÃƒÂ£o foi possÃƒÂ­vel localizar o orÃƒÂ§amento.");
      await Promise.all(Array.from(doc.images).map((img) => img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        img.onload = () => resolve(); img.onerror = () => resolve();
      })));
      const canvas = await html2canvas(pagina, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      return pdf.output("blob");
    } finally { host.remove(); }
  }

  async function visualizarPDFOrcamento() {
    const dispositivoMovel =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 1180px)").matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const novaAba = dispositivoMovel ? window.open("", "_blank") : null;

    if (novaAba) {
      novaAba.document.title = "Gerando PDF - CHOQUESEG";
      novaAba.document.body.innerHTML =
        '<div style="font-family:Arial,sans-serif;padding:30px;text-align:center"><h2>CHOQUESEG</h2><p>Gerando PDF...</p></div>';
    }

    try {
      const blob = await criarPDFOrcamento();

      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }

      const url = URL.createObjectURL(blob);

      setPreviewPdfBlob(blob);
      setPreviewPdfUrl(url);
      setMensagemEnvio(montarMensagemDoModelo());

      if (dispositivoMovel) {
        if (novaAba) {
          novaAba.location.href = url;
        } else {
          window.open(url, "_blank");
        }
        return;
      }

      setPreviewAberto(true);
    } catch (e) {
      if (novaAba) {
        novaAba.close();
      }

      console.error("Erro ao visualizar PDF:", e);
      alert(e instanceof Error ? e.message : "Nao foi possivel visualizar o PDF.");
    }
  }

  function baixarPdfVisualizado() {
    if (!previewPdfBlob) return;
    const nomeArquivo = nome.trim().replace(/[^a-zA-ZÃƒâ‚¬-ÃƒÂ¿0-9]+/g, "-") || "Cliente";
    const url = URL.createObjectURL(previewPdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Orcamento-CHOQUESEG-${nomeArquivo}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function imprimirPdfVisualizado() {
    if (!previewPdfUrl) return;
    const janela = window.open(previewPdfUrl, "_blank");
    if (!janela) {
      alert("Permita pop-ups para abrir a impressÃƒÂ£o.");
      return;
    }
    setTimeout(() => janela.print(), 700);
  }

  async function copiarMensagemEnvio() {
    const mensagem = mensagemEnvio.trim() || montarMensagemDoModelo();
    try {
      await navigator.clipboard.writeText(mensagem);
      return true;
    } catch (e) {
      console.warn("NÃƒÂ£o foi possÃƒÂ­vel copiar a mensagem automaticamente:", e);
      return false;
    }
  }

  async function enviarPdfVisualizado() {
    if (!previewPdfBlob) return;
    const numeroCliente = somenteNumeros(telefone);
    if (numeroCliente.length < 10) {
      alert("Informe um telefone/WhatsApp vÃƒÂ¡lido do cliente.");
      return;
    }

    const registro = await registrarEnvioNoFunil();
    if (!registro) return;

    const nomeArquivo = nome.trim().replace(/[^a-zA-ZÃƒâ‚¬-ÃƒÂ¿0-9]+/g, "-") || "Cliente";
    const arquivo = new File(
      [previewPdfBlob],
      `Orcamento-CHOQUESEG-${nomeArquivo}.pdf`,
      { type: "application/pdf" },
    );
    const mensagem = mensagemEnvio.trim() || montarMensagemDoModelo();
    const navegador = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };

    try {
      if (
        navigator.share &&
        (!navegador.canShare || navegador.canShare({ files: [arquivo] }))
      ) {
        // Alguns celulares/WhatsApp recebem o PDF pelo compartilhamento nativo,
        // mas ignoram o campo de texto. Mantemos a mensagem tambÃƒÂ©m no clipboard
        // para que ela nunca seja perdida no envio.
        const mensagemCopiada = await copiarMensagemEnvio();
        await navigator.share({
          title: `OrÃƒÂ§amento CHOQUESEG - ${nome}`,
          text: mensagem,
          files: [arquivo],
        });
        if (mensagemCopiada) {
          alert("PDF compartilhado. A mensagem tambÃƒÂ©m ficou copiada; se o WhatsApp nÃƒÂ£o preencher o texto automaticamente, basta tocar e colar.");
        }
        return;
      }

      baixarPdfVisualizado();
      const numero = numeroCliente.startsWith("55")
        ? numeroCliente
        : `55${numeroCliente}`;
      window.open(
        `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("Erro ao preparar envio:", e);
      alert("NÃƒÂ£o foi possÃƒÂ­vel preparar o envio.");
    }
  }

  function visualizarOrcamento() {
    if (!validar()) return;

    const janela = window.open("", "_blank", "width=900,height=900");
    if (!janela) {
      alert("O navegador bloqueou a prÃƒÂ©via do orÃƒÂ§amento. Permita pop-ups e tente novamente.");
      return;
    }

    janela.document.write(htmlOrcamento());
    janela.document.close();
  }

  async function gerarImpressao() {
    if (!validar()) return;
    await cadastrarClienteAvulsoSeSolicitado();
    const janela = window.open("", "_blank", "width=900,height=900");
    if (!janela) {
      alert("O navegador bloqueou a janela do PDF. Permita pop-ups e tente novamente.");
      return;
    }
    janela.document.write(htmlOrcamento());
    janela.document.write("<script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script>");
    janela.document.close();
  }

  async function registrarEnvioNoFunil() {
    const retornoEm = retornoSegundoDiaPelaManha();

    try {
      setSalvandoCliente(true);

      let idCliente = clienteId;

      if (!idCliente) {
        const telefoneLimpo = telefone.trim();

        const { data: existente, error: erroBusca } = await supabase
          .from("clientes")
          .select("id,nome,telefone,cidade,endereco")
          .eq("telefone", telefoneLimpo)
          .limit(1)
          .maybeSingle();

        if (erroBusca) throw erroBusca;

        if (existente?.id) {
          idCliente = String(existente.id);
        } else {
          const { data: criado, error: erroCriacao } = await supabase
            .from("clientes")
            .insert({
              nome: nome.trim(),
              telefone: telefone.trim(),
              cidade: cidade.trim(),
              endereco: endereco.trim(),
              tipo_servico: config.tipoServico,
              origem: config.origem,
              status: "OrÃƒÂ§amento Enviado",
              retorno_em: retornoEm,
              observacoes: observacoes.trim(),
            })
            .select("id,nome,telefone,cidade,endereco")
            .single();

          if (erroCriacao) throw erroCriacao;
          if (!criado?.id) throw new Error("O cliente nÃƒÂ£o foi criado no CRM.");

          idCliente = String(criado.id);

          const novoCliente: Cliente = {
            id: idCliente,
            nome: String(criado.nome ?? nome),
            telefone: String(criado.telefone ?? telefone),
            cidade: String(criado.cidade ?? cidade),
            endereco: String(criado.endereco ?? endereco),
          };

          setClientes((atuais) => {
            if (atuais.some((item) => item.id === novoCliente.id)) return atuais;
            return [...atuais, novoCliente].sort((a, b) => a.nome.localeCompare(b.nome));
          });
        }

        setClienteId(idCliente);
        setModoCliente("cadastrado");
      }

      const { error: erroAtualizacao } = await supabase
        .from("clientes")
        .update({
          status: "OrÃƒÂ§amento Enviado",
          retorno_em: retornoEm,
          tipo_servico: config.tipoServico,
          origem: config.origem,
        })
        .eq("id", idCliente);

      if (erroAtualizacao) throw erroAtualizacao;

      return { idCliente, retornoEm };
    } catch (e: any) {
      console.error("Erro ao registrar orÃƒÂ§amento no Funil:", e);
      alert(
        `NÃƒÂ£o foi possÃƒÂ­vel registrar o envio no Funil: ${
          e?.message || "erro desconhecido"
        }. O WhatsApp nÃƒÂ£o serÃƒÂ¡ aberto para evitar perder o acompanhamento.`,
      );
      return null;
    } finally {
      setSalvandoCliente(false);
    }
  }

  async function enviarWhatsApp() {
    if (!validar()) return;
    if (!previewPdfBlob) {
      await visualizarPDFOrcamento();
      return;
    }
    await enviarPdfVisualizado();
  }

  const painelClaro = tema === "claro";

  return (
    <section className={`min-h-full p-3 md:p-6 ${painelClaro ? "bg-zinc-100 text-zinc-950" : "bg-zinc-950 text-white"}`}>
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-yellow-400/35 bg-black shadow-2xl">
        <header className="overflow-hidden border-b-4 border-yellow-400 bg-black">
          <img
            src="/orcamentos/cabecalho-seguranca-visual.png"
            alt="CHOQUESEG Ã¢â‚¬â€ SeguranÃƒÂ§a, elÃƒÂ©trica e automaÃƒÂ§ÃƒÂ£o"
            className="h-auto w-full object-contain object-top"
          />
        </header>

        <div className={`space-y-5 p-4 md:p-6 ${painelClaro ? "bg-white text-zinc-950" : "bg-black text-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-yellow-500">CHOQUESEG</p><h2 className="text-xl font-black uppercase md:text-2xl">OrÃƒÂ§amento Ã¢â‚¬â€ {config.titulo}</h2></div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 p-1 text-xs font-black uppercase">
              <span className="px-2 text-zinc-500">Tema da tela</span>
              <button type="button" onClick={() => setTema("claro")} className={`rounded-lg px-3 py-2 ${tema === "claro" ? "bg-yellow-400 text-black" : "text-zinc-400"}`}>Claro</button>
              <button type="button" onClick={() => setTema("escuro")} className={`rounded-lg px-3 py-2 ${tema === "escuro" ? "bg-yellow-400 text-black" : "text-zinc-400"}`}>Escuro</button>
            </div>
          </div>

          {erro && <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm font-bold text-red-500">{erro}</div>}

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-700 p-2">
            <button type="button" onClick={() => trocarModoCliente("cadastrado")} className={`rounded-xl px-3 py-3 text-sm font-black uppercase ${modoCliente === "cadastrado" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-300"}`}>Cliente cadastrado</button>
            <button type="button" onClick={() => trocarModoCliente("avulso")} className={`rounded-xl px-3 py-3 text-sm font-black uppercase ${modoCliente === "avulso" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-300"}`}>Cliente nÃƒÂ£o cadastrado</button>
          </div>

          {modoCliente === "cadastrado" && <label className="block"><span className="mb-1 block text-sm font-black uppercase text-zinc-500">Buscar cliente</span><select value={clienteId} onChange={(e) => selecionarCliente(e.target.value)} disabled={carregando} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white outline-none focus:border-yellow-400"><option value="">{carregando ? "Carregando..." : "Selecione um cliente"}</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label>}

          <div className="grid gap-3 md:grid-cols-2">
            <Campo titulo="Nome" valor={nome} aoAlterar={setNome} />
            <Campo titulo="Telefone / WhatsApp" valor={telefone} aoAlterar={setTelefone} />
            <Campo titulo="Cidade" valor={cidade} aoAlterar={setCidade} />
            <Campo titulo="EndereÃƒÂ§o" valor={endereco} aoAlterar={setEndereco} />
          </div>

          {modoCliente === "avulso" && <label className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3 text-sm font-bold"><input type="checkbox" checked={salvarComoCliente} onChange={(e) => setSalvarComoCliente(e.target.checked)} className="h-4 w-4 accent-yellow-400" /><span>Salvar tambÃƒÂ©m como cliente no CHOQUESEG PRO</span></label>}

          <section className="rounded-2xl border border-zinc-700 p-3 md:p-4">
            <h3 className="font-black uppercase text-yellow-500">Dados da empresa no rodapÃƒÂ©</h3>
            <p className="mt-1 text-xs text-zinc-500">O endereÃƒÂ§o abaixo ÃƒÂ© editÃƒÂ¡vel e serÃƒÂ¡ usado no orÃƒÂ§amento/PDF.</p>
            <div className="mt-3">
              <Campo titulo="EndereÃƒÂ§o da CHOQUESEG" valor={enderecoEmpresa} aoAlterar={setEnderecoEmpresa} />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-700 p-3 md:p-4">
            <h3 className="font-black uppercase text-yellow-500">Tipo de serviÃƒÂ§o e composiÃƒÂ§ÃƒÂ£o</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-black uppercase text-zinc-500">ServiÃƒÂ§o especÃƒÂ­fico</span>
                <select
                  value={subservico}
                  onChange={(e) => {
                    setSubservico(e.target.value);
                    setBuscaProduto("");
                    setProdutoSelecionadoId("");
                    setItens([novoItem()]);
                  }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white"
                >
                  {SUBSERVICOS[tipo].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-black uppercase text-zinc-500">ComposiÃƒÂ§ÃƒÂ£o do orÃƒÂ§amento</span>
                <select
                  value={modoComposicao}
                  onChange={(e) => {
                    setModoComposicao(e.target.value as ModoComposicao);
                    setProdutoSelecionadoId("");
                    setItens([novoItem()]);
                  }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white"
                >
                  <option value="material-instalacao">Material + instalaÃƒÂ§ÃƒÂ£o</option>
                  <option value="somente-instalacao">Somente instalaÃƒÂ§ÃƒÂ£o / mÃƒÂ£o de obra</option>
                  <option value="somente-material">Somente material</option>
                </select>
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-black uppercase text-zinc-500">Buscar material / modelo / marca</span>
              <input
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  setProdutoSelecionadoId("");
                }}
                placeholder="Ex.: FD 1000, Rossi Nitro, PPA JetFlex, cÃƒÂ¢mera IP..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white outline-none focus:border-yellow-400"
              />
              {buscaProduto.trim() && (
                <span className="mt-2 block text-xs font-bold text-zinc-400">
                  {produtosCategoria.length > 0
                    ? `${produtosCategoria.length} item(ns) encontrado(s) neste segmento.`
                    : "Nenhum material encontrado neste segmento. Confira o nome, modelo ou marca cadastrada."}
                </span>
              )}
            </label>
          </section>


          <section className="rounded-2xl border border-zinc-700 p-3 md:p-4">
            <div className="mb-3"><h3 className="font-black uppercase text-yellow-500">Itens do orÃƒÂ§amento</h3><p className="text-xs text-zinc-500">Escolha um produto cadastrado no catÃƒÂ¡logo ou digite um item manual.</p>{carregandoProdutos && <p className="mt-1 text-xs font-bold text-yellow-400">Carregando produtos da nuvem...</p>}</div>

            <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-white">CatÃƒÂ¡logo do segmento: {segmentoDoTipo(tipo)}</p>
                  <p className="mt-1 text-xs text-zinc-500">Os equipamentos prÃƒÂ©-cadastrados continuam disponÃƒÂ­veis. VocÃƒÂª tambÃƒÂ©m pode cadastrar novos ou excluir um item cadastrado incorretamente.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCadastroProdutoAberto(true)}
                  className="shrink-0 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black"
                >
                  + Cadastrar novo produto
                </button>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_170px]">
                <select
                  value={produtoParaExcluirId}
                  onChange={(e) => setProdutoParaExcluirId(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-zinc-700 bg-black px-3 py-3 text-sm text-white outline-none focus:border-yellow-400"
                >
                  <option value="">Selecione um produto para gerenciar/excluir</option>
                  {produtosCategoria.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}{produto.fabricante ? ` Ã¢â‚¬â€ ${produto.fabricante}` : ""}{produto.modelo ? ` Ã¢â‚¬â€ ${produto.modelo}` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void excluirProdutoDoCatalogo()}
                  disabled={!produtoParaExcluirId || excluindoProduto}
                  className="rounded-lg border border-red-500/60 px-4 py-3 text-sm font-black uppercase text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {excluindoProduto ? "Excluindo..." : "Ã°Å¸â€”â€˜ Excluir produto"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {itens.map((item, indice) => (
                <div key={item.id} className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
                  <div className="mb-2 grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                    <label><span className="mb-1 block text-xs font-black uppercase text-zinc-500">Material / serviÃƒÂ§o prÃƒÂ©-cadastrado</span><select value={item.produtoId} onChange={(e) => selecionarProduto(item.id, e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-base text-white outline-none focus:border-yellow-400"><option value="">Item manual</option>{produtosCategoria.map((produto) => <option key={produto.id} value={produto.id}>{produto.nome}{produto.fabricante ? ` Ã¢â‚¬â€ ${produto.fabricante}` : ""}{produto.modelo ? ` Ã¢â‚¬â€ ${produto.modelo}` : ""}</option>)}</select></label>
                    <label><span className="mb-1 block text-xs font-black uppercase text-zinc-500">DescriÃƒÂ§ÃƒÂ£o</span><input value={item.descricao} onChange={(e) => atualizarItem(item.id, "descricao", e.target.value)} placeholder={`Item ${indice + 1}`} className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-yellow-400" /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(110px,1.05fr)_minmax(100px,.9fr)_minmax(70px,.6fr)_minmax(120px,1fr)_minmax(120px,1fr)_42px] md:items-end">
                    <label>
                      <span className="mb-1 block text-xs font-black uppercase text-zinc-500">Tipo</span>
                      <select
                        value={item.natureza}
                        onChange={(e) => atualizarItem(item.id, "natureza", e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-base text-white"
                      >
                        <option value="material">Material</option>
                        <option value="mao_obra">MÃƒÂ£o de obra</option>
                      </select>
                    </label>
                    <label><span className="mb-1 block text-xs font-black uppercase text-zinc-500">Unidade</span><select value={item.unidade} onChange={(e) => atualizarItem(item.id, "unidade", e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-base text-white"><option>Unidade</option><option>Metro</option><option>Rolo</option><option>Caixa</option><option>Kit</option><option>Par</option><option>ServiÃƒÂ§o</option></select></label>
                    <CampoMini titulo="Qtd." tipo="number" valor={String(item.quantidade)} aoAlterar={(v) => atualizarItem(item.id, "quantidade", v)} />
                    <CampoMini titulo="Valor unitÃƒÂ¡rio" tipo="number" valor={String(item.valorUnitario)} aoAlterar={(v) => atualizarItem(item.id, "valorUnitario", v)} />
                    <div><span className="mb-1 block text-xs font-black uppercase text-zinc-500">Total</span><div className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-right text-sm font-black text-yellow-400">{moeda(item.quantidade * item.valorUnitario)}</div></div>
                    <button type="button" onClick={() => removerItem(item.id)} className="h-10 rounded-lg border border-red-500/50 text-red-400" title="Remover">Ãƒâ€”</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={adicionarItem} className="mt-3 w-full rounded-xl border border-dashed border-yellow-400 px-4 py-3 text-sm font-black uppercase text-yellow-500">+ Adicionar mais um item</button>
          </section>

          <div className="grid gap-3 md:grid-cols-[1fr_170px_150px] md:items-end">
            <label><span className="mb-1 block text-sm font-black uppercase text-zinc-500">ObservaÃƒÂ§ÃƒÂµes</span><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white outline-none focus:border-yellow-400" placeholder="Prazo, condiÃƒÂ§ÃƒÂµes e observaÃƒÂ§ÃƒÂµes..." /></label>
            <label><span className="mb-1 block text-sm font-black uppercase text-zinc-500">Tipo de desconto</span><select value={tipoDesconto} onChange={(e) => setTipoDesconto(e.target.value as "valor" | "percentual")} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white"><option value="valor">Valor (R$)</option><option value="percentual">Percentual (%)</option></select></label>
            <Campo titulo="Desconto" valor={String(desconto)} aoAlterar={(v) => setDesconto(Number(v) || 0)} tipo="number" />
          </div>

          <div className="grid gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo titulo="Materiais" valor={moeda(subtotalMateriais)} />
            <Resumo titulo="MÃƒÂ£o de obra" valor={moeda(subtotalMaoObra)} />
            <Resumo titulo="Desconto" valor={`- ${moeda(valorDesconto)}`} />
            <Resumo titulo="Total" valor={moeda(total)} destaque />
          </div>

          <section className="overflow-hidden rounded-2xl border border-zinc-700">
            <button
              type="button"
              onClick={() => setMensagemAberta((aberta) => !aberta)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
              aria-expanded={mensagemAberta}
            >
              <div>
                <h3 className="font-black uppercase text-yellow-500">Ã°Å¸â€™Â¬ Mensagem padrÃƒÂ£o de envio</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {mensagemAberta
                    ? "Edite, confira e salve sua mensagem."
                    : mensagemPadrao.trim()
                      ? "Mensagem padrÃƒÂ£o configurada Ã¢Å“â€œ Ã¢â‚¬â€ toque para abrir"
                      : "Toque para configurar a mensagem"}
                </p>
              </div>
              <span className="shrink-0 text-xl font-black text-yellow-400">
                {mensagemAberta ? "Ã¢â€“Â²" : "Ã¢â€“Â¼"}
              </span>
            </button>

            {mensagemAberta && (
              <div className="border-t border-zinc-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-2xl text-xs text-zinc-500">
                    Escreva uma vez do seu jeito e salve. Nome, serviÃƒÂ§o, itens e valores serÃƒÂ£o atualizados automaticamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => void salvarMensagemPadrao()}
                    disabled={salvandoMensagem}
                    className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-50"
                  >
                    {salvandoMensagem ? "Salvando..." : "Ã°Å¸â€™Â¾ Salvar mensagem"}
                  </button>
                </div>

                <textarea
                  value={mensagemPadrao}
                  onChange={(e) => setMensagemPadrao(e.target.value)}
                  rows={8}
                  className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm leading-relaxed text-white outline-none focus:border-yellow-400"
                />

                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  VariÃƒÂ¡veis: {"{primeiro_nome}"}, {"{nome_cliente}"}, {"{tipo_servico}"}, {"{itens}"}, {"{materiais}"}, {"{mao_obra}"}, {"{subtotal}"}, {"{desconto}"} e {"{valor_total}"}.
                </p>

                <details className="mt-4 rounded-xl border border-zinc-700 bg-black">
                  <summary className="cursor-pointer p-4 text-xs font-black uppercase text-zinc-400">
                    Ã°Å¸â€˜ÂÃ¯Â¸Â Ver prÃƒÂ©via da mensagem
                  </summary>
                  <pre className="whitespace-pre-wrap border-t border-zinc-800 p-4 font-sans text-sm leading-relaxed text-zinc-200">
                    {montarMensagemDoModelo()}
                  </pre>
                </details>

                <button
                  type="button"
                  onClick={() => setMensagemAberta(false)}
                  className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-black uppercase text-zinc-300 md:w-auto"
                >
                  Ã¢â€“Â² Fechar mensagem
                </button>
              </div>
            )}
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void visualizarPDFOrcamento()}
              disabled={salvandoCliente}
              className="rounded-xl border border-blue-500 px-4 py-4 font-black uppercase text-blue-400 disabled:opacity-50"
            >
              Ã°Å¸â€˜ÂÃ¯Â¸Â Visualizar PDF
            </button>

            <button
              type="button"
              onClick={() => void gerarImpressao()}
              disabled={salvandoCliente}
              className="rounded-xl border border-yellow-400 px-4 py-4 font-black uppercase text-yellow-500 disabled:opacity-50"
            >
              Ã°Å¸Â§Â¾ Imprimir / salvar PDF
            </button>

            <button
              type="button"
              onClick={() => void enviarWhatsApp()}
              disabled={salvandoCliente}
              className="rounded-xl bg-green-600 px-4 py-4 font-black uppercase text-white disabled:opacity-50"
            >
              Ã°Å¸â€œÂ² Enviar ao cliente
            </button>
          </div>
        </div>

        {previewAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 md:p-5">
            <div className="flex h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-yellow-400">Visualizar PDF</h2>
                  <p className="text-xs text-zinc-400">Este ÃƒÂ© o mesmo PDF usado para imprimir, baixar ou enviar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAberto(false)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 font-black text-white"
                >
                  Ã¢Å“â€¢ Fechar
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
                <div className="h-[42vh] min-h-[320px] bg-zinc-800 p-2 md:p-4 lg:h-auto lg:min-h-0">
                  {previewPdfUrl && (
                    <iframe
                      title="PrÃƒÂ©-visualizaÃƒÂ§ÃƒÂ£o do orÃƒÂ§amento"
                      src={previewPdfUrl}
                      className="h-full w-full rounded-lg bg-white"
                    />
                  )}
                </div>

                <aside className="border-t border-zinc-800 bg-zinc-950 p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
                  <h3 className="font-black uppercase text-white">Mensagem deste envio</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    VocÃƒÂª pode alterar aqui sem modificar a mensagem padrÃƒÂ£o salva.
                  </p>
                  <textarea
                    value={mensagemEnvio}
                    onChange={(e) => setMensagemEnvio(e.target.value)}
                    rows={16}
                    className="mt-4 w-full rounded-xl border border-zinc-700 bg-black p-4 text-base leading-relaxed text-white outline-none focus:border-yellow-400"
                  />

                  <div className="mt-4 grid gap-3">
                    <button type="button" onClick={imprimirPdfVisualizado} className="rounded-xl bg-white px-4 py-3 font-black uppercase text-black">
                      Ã°Å¸â€“Â¨Ã¯Â¸Â Imprimir
                    </button>
                    <button type="button" onClick={baixarPdfVisualizado} className="rounded-xl border border-yellow-400 px-4 py-3 font-black uppercase text-yellow-300">
                      Ã¢Â¬â€¡Ã¯Â¸Â Baixar PDF
                    </button>
                    <button type="button" onClick={() => void copiarMensagemEnvio()} className="rounded-xl border border-zinc-600 px-4 py-3 text-base font-black uppercase text-zinc-200">
                      Ã°Å¸â€œâ€¹ Copiar mensagem
                    </button>
                    <button type="button" onClick={() => void enviarPdfVisualizado()} className="rounded-xl bg-green-600 px-4 py-4 text-base font-black uppercase text-white">
                      Ã°Å¸â€œÂ² Enviar PDF + mensagem
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        {cadastroProdutoAberto && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3">
            <div className="w-full max-w-2xl rounded-2xl border border-yellow-400/40 bg-zinc-950 p-4 shadow-2xl md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black uppercase text-yellow-400">Cadastrar novo produto</h3>
                  <p className="mt-1 text-sm text-zinc-500">Segmento definido automaticamente: {segmentoDoTipo(tipo)}.</p>
                </div>
                <button type="button" onClick={() => setCadastroProdutoAberto(false)} className="rounded-lg border border-zinc-700 px-3 py-2 font-black text-white">Ã¢Å“â€¢</button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Campo titulo="Nome do produto" valor={novoProdutoNome} aoAlterar={setNovoProdutoNome} />
                <Campo titulo="Fabricante / marca" valor={novoProdutoFabricante} aoAlterar={setNovoProdutoFabricante} />
                <Campo titulo="Modelo" valor={novoProdutoModelo} aoAlterar={setNovoProdutoModelo} />
                <label className="block"><span className="mb-1 block text-sm font-black uppercase text-zinc-500">Unidade</span><select value={novoProdutoUnidade} onChange={(e) => setNovoProdutoUnidade(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white"><option>Unidade</option><option>Metro</option><option>Rolo</option><option>Caixa</option><option>Kit</option><option>Par</option></select></label>
                <Campo titulo="Custo unitÃƒÂ¡rio" valor={novoProdutoCusto} aoAlterar={setNovoProdutoCusto} tipo="number" />
                <Campo titulo="Valor de venda" valor={novoProdutoVenda} aoAlterar={setNovoProdutoVenda} tipo="number" />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setCadastroProdutoAberto(false)} className="rounded-xl border border-zinc-700 px-4 py-3 font-black uppercase text-zinc-300">Cancelar</button>
                <button type="button" disabled={salvandoProduto} onClick={() => void cadastrarNovoProdutoRapido()} className="rounded-xl bg-yellow-400 px-4 py-3 font-black uppercase text-black disabled:opacity-50">{salvandoProduto ? "Salvando..." : "Salvar no catÃƒÂ¡logo"}</button>
              </div>
            </div>
          </div>
        )}

        <footer className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-yellow-400 bg-zinc-950 px-4 py-4 text-sm font-bold text-zinc-200 md:px-6"><img src="/imagens/logo/brasao-choqueseg.png" alt="CHOQUESEG" className="h-11 w-11 object-contain" /><strong className="text-base font-black text-yellow-400">CHOQUESEG</strong><span>Ã¢ËœÅ½ {TELEFONE_EMPRESA}</span><span>Ã¢â€”Å½ {INSTAGRAM_EMPRESA}</span><span>Ã°Å¸â€œÂ {enderecoEmpresa}</span></footer>
      </div>
    </section>
  );
}

function Campo({ titulo, valor, aoAlterar, tipo = "text" }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; tipo?: string }) {
  return <label className="block"><span className="mb-1 block text-sm font-black uppercase text-zinc-500">{titulo}</span><input type={tipo} value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base text-white outline-none focus:border-yellow-400" /></label>;
}

function CampoMini({ titulo, valor, aoAlterar, tipo = "text" }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; tipo?: string }) {
  return <label><span className="mb-1 block text-xs font-black uppercase text-zinc-500">{titulo}</span><input type={tipo} min={tipo === "number" ? 0 : undefined} step={tipo === "number" ? "0.01" : undefined} value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-base text-white outline-none focus:border-yellow-400" /></label>;
}

function Resumo({ titulo, valor, destaque = false }: { titulo: string; valor: string; destaque?: boolean }) {
  return <div><p className="text-xs font-black uppercase text-zinc-500">{titulo}</p><p className={`${destaque ? "text-2xl text-yellow-400" : "text-lg text-white"} mt-1 font-black`}>{valor}</p></div>;
}
