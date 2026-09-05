"use client";

// CHOQUESEG PRO — Estoque: layout horizontal + nuvem + OS (versão consolidada)

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  CategoriaEstoque,
  ProdutoEstoque,
  UnidadeEstoque,
} from "./types";
import MovimentacoesEstoque from "./MovimentacoesEstoque";
import {
  catalogoProdutos,
  segmentosCatalogo,
} from "./catalogoProdutos";

const supabase = createClient();
const CHAVE_PRODUTOS = "choqueseg-estoque-produtos";

const categorias: CategoriaEstoque[] = [
  "Módulo solar",
  "Inversor",
  "Estrutura",
  "Cabo",
  "Proteção elétrica",
  "Câmera",
  "Alarme",
  "Automação",
  "Ferramenta",
  "Outros",
];

const unidades: UnidadeEstoque[] = [
  "Unidade",
  "Metro",
  "Rolo",
  "Caixa",
  "Kit",
  "Par",
];

type FornecedorEstoque = {
  id: string;
  nome: string;
  contatos: string;
  tipo: string;
  status: string;
};

type CategoriaNegocio =
  | "Segurança eletrônica"
  | "Casa inteligente"
  | "Elétrica"
  | "Energia solar";

const categoriasNegocio: CategoriaNegocio[] = [
  "Segurança eletrônica",
  "Casa inteligente",
  "Elétrica",
  "Energia solar",
];

function categoriaNegocioDoCatalogo(segmento: string): CategoriaNegocio | null {
  const valor = segmento
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (valor.includes("seguranca") || valor.includes("automatizador")) {
    return "Segurança eletrônica";
  }

  if (valor.includes("casa inteligente")) {
    return "Casa inteligente";
  }

  if (valor.includes("eletrica")) {
    return "Elétrica";
  }

  if (valor.includes("solar")) {
    return "Energia solar";
  }

  return null;
}

function categoriaEstoquePadrao(categoria: CategoriaNegocio): CategoriaEstoque {
  if (categoria === "Energia solar") return "Módulo solar";
  if (categoria === "Elétrica") return "Proteção elétrica";
  if (categoria === "Casa inteligente") return "Automação";
  return "Outros";
}

function produtoBancoParaApp(item: any): ProdutoEstoque {
  return {
    id: String(item.id),
    nome: item.nome ?? "",
    categoria: item.categoria as CategoriaEstoque,
    fabricante: item.fabricante ?? undefined,
    modelo: item.modelo ?? undefined,
    codigo: item.codigo ?? undefined,
    unidade: item.unidade as UnidadeEstoque,
    quantidadeAtual: Number(item.quantidade_atual ?? 0),
    estoqueMinimo: Number(item.estoque_minimo ?? 0),
    custoUnitario: Number(item.custo_unitario ?? 0),
    fornecedor: item.fornecedor ?? undefined,
    localArmazenamento: item.local_armazenamento ?? undefined,
    observacao: item.observacao ?? undefined,
    imagemUrl: item.imagem_url ?? undefined,
    paginaProdutoUrl: item.pagina_produto_url ?? undefined,
    manualUrl: item.manual_url ?? undefined,
    especificacoes:
      item.especificacoes && typeof item.especificacoes === "object"
        ? item.especificacoes
        : undefined,
    ativo: item.ativo ?? true,
    criadoEm: item.criado_em ?? new Date().toISOString(),
  };
}

function produtoAppParaBanco(produto: ProdutoEstoque) {
  return {
    id: produto.id,
    nome: produto.nome,
    categoria: produto.categoria,
    fabricante: produto.fabricante ?? null,
    modelo: produto.modelo ?? null,
    codigo: produto.codigo ?? null,
    unidade: produto.unidade,
    quantidade_atual: produto.quantidadeAtual,
    estoque_minimo: produto.estoqueMinimo,
    custo_unitario: produto.custoUnitario,
    fornecedor: produto.fornecedor ?? null,
    local_armazenamento: produto.localArmazenamento ?? null,
    observacao: produto.observacao ?? null,
    imagem_url: produto.imagemUrl ?? null,
    pagina_produto_url: produto.paginaProdutoUrl ?? null,
    manual_url: produto.manualUrl ?? null,
    especificacoes: produto.especificacoes ?? {},
    ativo: produto.ativo,
    criado_em: produto.criadoEm,
    atualizado_em: new Date().toISOString(),
  };
}

export default function EstoqueModule() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<
    "resumo" | "produtos" | "cadastro" | "movimentacoes"
  >("resumo");

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEstoque>("Módulo solar");
  const [fabricante, setFabricante] = useState("");
  const [modelo, setModelo] = useState("");
  const [unidade, setUnidade] = useState<UnidadeEstoque>("Unidade");
  const [quantidadeAtual, setQuantidadeAtual] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("3");
  const [custoUnitario, setCustoUnitario] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [localArmazenamento, setLocalArmazenamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [paginaProdutoUrl, setPaginaProdutoUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [codigo, setCodigo] = useState("");
  const [especificacoes, setEspecificacoes] = useState<Record<string, string>>({});

  const [categoriaNegocio, setCategoriaNegocio] =
    useState<CategoriaNegocio>("Segurança eletrônica");
  const [produtoCatalogoId, setProdutoCatalogoId] = useState("");
  const [produtoManual, setProdutoManual] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<"Todas" | CategoriaEstoque>("Todas");

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("*")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar estoque:", error);
        setMensagem(
          `Não foi possível carregar o estoque da nuvem. Confirme se o SQL do Estoque foi executado. ${error.message}`,
        );
        setCarregando(false);
        return;
      }

      let lista = (data ?? []).map(produtoBancoParaApp);

      // Migração automática do estoque antigo salvo no navegador.
      if (lista.length === 0) {
        const legado = localStorage.getItem(CHAVE_PRODUTOS);

        if (legado) {
          try {
            const antigos = JSON.parse(legado) as ProdutoEstoque[];

            if (Array.isArray(antigos) && antigos.length > 0) {
              const preparados = antigos.map((item) => ({
                ...item,
                id: item.id || crypto.randomUUID(),
                criadoEm: item.criadoEm || new Date().toISOString(),
              }));

              const { error: erroMigracao } = await supabase
                .from("estoque_produtos")
                .upsert(preparados.map(produtoAppParaBanco), { onConflict: "id" });

              if (!erroMigracao) {
                lista = preparados;
                setMensagem("Estoque antigo migrado automaticamente para a nuvem.");
              } else {
                console.error("Erro ao migrar estoque antigo:", erroMigracao);
              }
            }
          } catch {
            // O estoque da nuvem continua funcionando mesmo se o cache antigo estiver inválido.
          }
        }
      }

      setProdutos(lista);
      localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(lista));
      setCarregando(false);
    }

    async function carregarFornecedores() {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id,nome,contatos,tipo,status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true });

      if (error || !ativo) return;

      setFornecedores(
        (data ?? [])
          .filter(
            (item) =>
              String(item.tipo ?? "").trim().toLowerCase() !== "treinamento interno",
          )
          .map((item) => ({
            id: String(item.id),
            nome: item.nome ?? "",
            contatos: item.contatos ?? "",
            tipo: item.tipo ?? "",
            status: item.status ?? "Ativo",
          })),
      );
    }

    void carregarProdutos();
    void carregarFornecedores();

    const canal = supabase
      .channel("estoque-produtos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estoque_produtos" },
        () => void carregarProdutos(),
      )
      .subscribe();

    const recarregar = () => {
      if (document.visibilityState === "visible") void carregarProdutos();
    };

    window.addEventListener("focus", recarregar);
    document.addEventListener("visibilitychange", recarregar);

    return () => {
      ativo = false;
      void supabase.removeChannel(canal);
      window.removeEventListener("focus", recarregar);
      document.removeEventListener("visibilitychange", recarregar);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
  }, [produtos]);

  const produtosDaCategoria = useMemo(() => {
    return catalogoProdutos
      .filter((item) => categoriaNegocioDoCatalogo(item.segmento) === categoriaNegocio)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [categoriaNegocio]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos
      .filter((produto) => {
        const buscaOk =
          !termo ||
          produto.nome.toLowerCase().includes(termo) ||
          produto.fabricante?.toLowerCase().includes(termo) ||
          produto.modelo?.toLowerCase().includes(termo) ||
          produto.fornecedor?.toLowerCase().includes(termo);

        const categoriaOk =
          filtroCategoria === "Todas" || produto.categoria === filtroCategoria;

        return buscaOk && categoriaOk;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca, filtroCategoria]);

  const resumo = useMemo(() => {
    const ativos = produtos.filter((produto) => produto.ativo);
    const baixos = ativos.filter(
      (produto) => produto.quantidadeAtual <= produto.estoqueMinimo,
    );
    const valor = ativos.reduce(
      (total, produto) => total + produto.quantidadeAtual * produto.custoUnitario,
      0,
    );

    return { ativos: ativos.length, baixos, valor };
  }, [produtos]);

  function selecionarProdutoCatalogo(id: string) {
    setProdutoCatalogoId(id);
    setProdutoManual("");

    if (!id) {
      setNome("");
      setFabricante("");
      setModelo("");
      setCodigo("");
      setImagemUrl("");
      setPaginaProdutoUrl("");
      setManualUrl("");
      setEspecificacoes({});
      setObservacao("");
      setCategoria(categoriaEstoquePadrao(categoriaNegocio));
      return;
    }

    if (id === "__outro__") {
      setNome("");
      setFabricante("");
      setModelo("");
      setCodigo("");
      setImagemUrl("");
      setPaginaProdutoUrl("");
      setManualUrl("");
      setEspecificacoes({});
      setCategoria(categoriaEstoquePadrao(categoriaNegocio));
      return;
    }

    const item = catalogoProdutos.find((produto) => produto.id === id);
    if (!item) return;

    setNome(item.nome);
    setCategoria(item.categoriaEstoque);
    setFabricante(item.marca);
    setModelo(item.linha);
    setUnidade(item.unidade);
    setCodigo(item.codigo ?? "");
    setImagemUrl(item.imagemUrl ?? "");
    setPaginaProdutoUrl(item.paginaProdutoUrl ?? "");
    setManualUrl(item.manualUrl ?? "");
    setEspecificacoes(item.especificacoes ?? {});
    setObservacao(item.observacao ?? "");
  }

  function alterarCategoriaNegocio(valor: string) {
    const novaCategoria = valor as CategoriaNegocio;
    setCategoriaNegocio(novaCategoria);
    setProdutoCatalogoId("");
    setProdutoManual("");
    setProdutoManual("");
    setNome("");
    setFabricante("");
    setModelo("");
    setUnidade("Unidade");
    setCategoria(categoriaEstoquePadrao(novaCategoria));
  }

  function limparFormulario() {
    setNome("");
    setFabricante("");
    setModelo("");
    setQuantidadeAtual("");
    setEstoqueMinimo("3");
    setCustoUnitario("");
    setFornecedor("");
    setLocalArmazenamento("");
    setObservacao("");
    setImagemUrl("");
    setPaginaProdutoUrl("");
    setManualUrl("");
    setCodigo("");
    setEspecificacoes({});
    setProdutoCatalogoId("");
  }

  async function salvarProduto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem("");

    const quantidade = converterNumero(quantidadeAtual);
    const minimo = converterNumero(estoqueMinimo);
    const custo = converterNumero(custoUnitario);

    const nomeFinal =
      produtoCatalogoId === "__outro__" ? produtoManual.trim() : nome.trim();

    if (!nomeFinal) return setMensagem("Informe o nome do produto.");
    if (quantidade < 0 || minimo < 0 || custo < 0)
      return setMensagem("Quantidade, estoque mínimo e custo não podem ser negativos.");

    const novoProduto: ProdutoEstoque = {
      id: crypto.randomUUID(),
      nome: nomeFinal,
      categoria,
      fabricante: fabricante.trim() || undefined,
      modelo: modelo.trim() || undefined,
      codigo: codigo.trim() || undefined,
      unidade,
      quantidadeAtual: quantidade,
      estoqueMinimo: minimo,
      custoUnitario: custo,
      fornecedor: fornecedor.trim() || undefined,
      localArmazenamento: localArmazenamento.trim() || undefined,
      observacao: observacao.trim() || undefined,
      imagemUrl: imagemUrl.trim() || undefined,
      paginaProdutoUrl: paginaProdutoUrl.trim() || undefined,
      manualUrl: manualUrl.trim() || undefined,
      especificacoes: Object.keys(especificacoes).length ? especificacoes : undefined,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("estoque_produtos")
      .insert(produtoAppParaBanco(novoProduto));

    if (error) {
      setMensagem(`Erro ao cadastrar produto: ${error.message}`);
      return;
    }

    setProdutos((atuais) =>
      [...atuais, novoProduto].sort((a, b) => a.nome.localeCompare(b.nome)),
    );
    limparFormulario();
    setMensagem("Produto cadastrado na nuvem com sucesso.");
    setSecaoAtiva("produtos");
  }

  async function alternarStatus(id: string) {
    const produto = produtos.find((item) => item.id === id);
    if (!produto) return;

    const novoAtivo = !produto.ativo;
    const { error } = await supabase
      .from("estoque_produtos")
      .update({ ativo: novoAtivo, atualizado_em: new Date().toISOString() })
      .eq("id", id);

    if (error) return setMensagem(`Erro ao atualizar produto: ${error.message}`);

    setProdutos((atuais) =>
      atuais.map((item) => (item.id === id ? { ...item, ativo: novoAtivo } : item)),
    );
  }

  async function excluirProduto(id: string) {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;

    const { error } = await supabase
      .from("estoque_produtos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensagem(
        "Não foi possível excluir. Se o produto já possui movimentações, inative-o em vez de excluir.",
      );
      return;
    }

    setProdutos((atuais) => atuais.filter((produto) => produto.id !== id));
  }

  return (
    <section className="p-3 md:p-5">
      <div>
        <p className="text-sm font-bold uppercase text-yellow-400">
          Controle de estoque
        </p>
        <h2 className="mt-1 text-3xl font-black uppercase text-white">
          Estoque CHOQUESEG
        </h2>
        <p className="mt-2 text-zinc-400">
          Estoque sincronizado na nuvem e integrado às Ordens de Serviço.
        </p>
      </div>

      {mensagem && (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-300">
          {mensagem}
        </div>
      )}

      <nav className="mt-5 rounded-2xl border border-zinc-800 bg-black p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["resumo", "📊", "Resumo"],
            ["produtos", "📦", "Produtos"],
            ["cadastro", "➕", "Cadastrar produto"],
            ["movimentacoes", "🔄", "Movimentações"],
          ].map(([id, icone, titulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSecaoAtiva(id as typeof secaoAtiva)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black uppercase ${
                secaoAtiva === id
                  ? "bg-yellow-400 text-black"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400"
              }`}
            >
              <span>{icone}</span>
              <span>{titulo}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="mt-5 min-w-0">
        {secaoAtiva === "resumo" && (
          <div className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-3">
              <CardResumo titulo="Produtos ativos" valor={String(resumo.ativos)} />
              <CardResumo titulo="Estoque baixo" valor={String(resumo.baixos.length)} />
              <CardResumo titulo="Valor em estoque" valor={formatarMoeda(resumo.valor)} />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-black p-4">
              <h3 className="text-lg font-black uppercase text-yellow-400">
                Alertas de estoque mínimo
              </h3>

              {carregando ? (
                <p className="mt-4 text-zinc-500">Carregando estoque...</p>
              ) : resumo.baixos.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-emerald-500/30 p-6 text-center text-emerald-400">
                  Nenhum produto abaixo do estoque mínimo.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {resumo.baixos.map((produto) => (
                    <div
                      key={produto.id}
                      className="rounded-xl border border-red-500/30 bg-red-500/5 p-3"
                    >
                      <p className="text-sm font-black text-white">{produto.nome}</p>
                      <p className="mt-1 text-xs text-red-300">
                        Atual: {produto.quantidadeAtual} {produto.unidade}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Mínimo: {produto.estoqueMinimo} {produto.unidade}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {secaoAtiva === "produtos" && (
          <section className="rounded-2xl border border-zinc-800 bg-black p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto, marca, modelo ou fornecedor..."
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
              />
              <CampoSelect
                label="Categoria"
                valor={filtroCategoria}
                onChange={(valor) => setFiltroCategoria(valor as "Todas" | CategoriaEstoque)}
                opcoes={["Todas", ...categorias]}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {produtosFiltrados.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
                  Nenhum produto encontrado.
                </div>
              ) : (
                produtosFiltrados.map((produto) => {
                  const baixo = produto.quantidadeAtual <= produto.estoqueMinimo;

                  return (
                    <article
                      key={produto.id}
                      className={`rounded-xl border p-3 ${
                        baixo
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-white">{produto.nome}</h4>
                          <p className="mt-1 truncate text-[11px] text-zinc-500">
                            {[produto.fabricante, produto.modelo].filter(Boolean).join(" · ") || produto.categoria}
                          </p>
                        </div>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                          produto.ativo ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                        }`}>
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p className={`mt-3 text-xl font-black ${baixo ? "text-red-400" : "text-yellow-400"}`}>
                        {produto.quantidadeAtual} <span className="text-xs">{produto.unidade}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500">Mínimo: {produto.estoqueMinimo}</p>
                      <p className="mt-2 text-xs text-zinc-300">Custo: {formatarMoeda(produto.custoUnitario)}</p>
                      {produto.localArmazenamento && (
                        <p className="mt-1 truncate text-[11px] text-zinc-500">📍 {produto.localArmazenamento}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void alternarStatus(produto.id)}
                          className="rounded-lg border border-yellow-400/50 px-2 py-1.5 text-[10px] font-black uppercase text-yellow-400"
                        >
                          {produto.ativo ? "Inativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void excluirProduto(produto.id)}
                          className="rounded-lg border border-red-500/40 px-2 py-1.5 text-[10px] font-black uppercase text-red-400"
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {secaoAtiva === "cadastro" && (
          <form
            onSubmit={salvarProduto}
            className="rounded-2xl border border-yellow-400/30 bg-black p-4"
          >
            <div>
              <h3 className="text-lg font-black uppercase text-yellow-400">
                Cadastrar produto
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Cadastro enxuto: categoria, produto, fabricante, modelo, unidade, saldo, custo, fornecedor e observação.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <CampoSelect
                label="Categoria"
                valor={categoriaNegocio}
                onChange={alterarCategoriaNegocio}
                opcoes={categoriasNegocio}
              />

              <CampoSelect
                label="Nome do produto"
                valor={produtoCatalogoId}
                onChange={selecionarProdutoCatalogo}
                opcoes={[
                  "",
                  ...produtosDaCategoria.map((item) => item.id),
                  "__outro__",
                ]}
                rotulos={[
                  "Selecione o produto",
                  ...produtosDaCategoria.map((item) => item.nome),
                  "Outro produto",
                ]}
              />

              {produtoCatalogoId === "__outro__" && (
                <CampoTexto
                  label="Nome do produto — outro"
                  valor={produtoManual}
                  onChange={(valor) => {
                    setProdutoManual(valor);
                    setNome(valor);
                  }}
                  placeholder="Digite o nome do produto"
                />
              )}

              <CampoTexto
                label="Fabricante"
                valor={fabricante}
                onChange={setFabricante}
                placeholder="Ex.: Intelbras, JFL, Hikvision, Rossi"
              />

              <CampoTexto
                label="Modelo"
                valor={modelo}
                onChange={setModelo}
                placeholder="Ex.: Wi-Fi, JetFlex, 6 segundos"
              />

              <CampoSelect
                label="Unidade"
                valor={unidade}
                onChange={(valor) => setUnidade(valor as UnidadeEstoque)}
                opcoes={unidades}
              />

              <CampoTexto
                label="Quantidade atual"
                valor={quantidadeAtual}
                onChange={setQuantidadeAtual}
                placeholder="Quanto tem no estoque"
              />

              <CampoTexto
                label="Estoque mínimo"
                valor={estoqueMinimo}
                onChange={setEstoqueMinimo}
                placeholder="3"
              />

              <CampoTexto
                label="Custo unitário"
                valor={custoUnitario}
                onChange={setCustoUnitario}
                placeholder="Quanto você pagou"
              />

              <CampoSelect
                label="Fornecedor"
                valor={fornecedor}
                onChange={setFornecedor}
                opcoes={["", ...fornecedores.map((item) => item.nome)]}
                rotulos={["Selecione o fornecedor", ...fornecedores.map((item) => item.nome)]}
              />

              <div className="md:col-span-2 xl:col-span-2">
                <CampoTexto
                  label="Observação"
                  valor={observacao}
                  onChange={setObservacao}
                  placeholder="Informação adicional, se necessário"
                />
              </div>
            </div>

            {produtoCatalogoId && produtoCatalogoId !== "__outro__" && nome && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs font-black uppercase text-yellow-400">
                  Produto selecionado
                </p>
                <p className="mt-1 font-black text-white">{nome}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {[fabricante, modelo].filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black"
            >
              Salvar produto
            </button>
          </form>
        )}

        {secaoAtiva === "movimentacoes" && (
          <MovimentacoesEstoque
            produtos={produtos}
            aoAtualizarProdutos={setProdutos}
          />
        )}
      </main>
    </section>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-black uppercase text-zinc-500">{titulo}</p>
      <p className="mt-2 text-2xl font-black text-yellow-400">{valor}</p>
    </div>
  );
}

function CampoTexto({
  label, valor, onChange, placeholder,
}: {
  label: string; valor: string; onChange: (valor: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label>
      <input
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </div>
  );
}

function CampoSelect({
  label, valor, onChange, opcoes, rotulos,
}: {
  label: string; valor: string; onChange: (valor: string) => void; opcoes: string[]; rotulos?: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase text-zinc-500">{label}</label>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        {opcoes.map((opcao, indice) => (
          <option key={`${opcao}-${indice}`} value={opcao}>
            {rotulos?.[indice] ?? (opcao || "Todos")}
          </option>
        ))}
      </select>
    </div>
  );
}

function converterNumero(valor: string) {
  const numero = Number(valor.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}
