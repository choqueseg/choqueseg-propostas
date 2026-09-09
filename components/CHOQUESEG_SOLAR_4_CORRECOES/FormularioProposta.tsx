"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { createClient } from "@/utils/supabase/client";
import PreviewProposta, { DadosPreview, type InstalacaoPortfolio } from "./PreviewProposta";

const supabase = createClient();
const CHAVE_FOTOS_SOLAR = "choqueseg-solar-fotos-padrao";
const CHAVE_MENSAGEM_SOLAR = "proposta-energia-solar";
import {
  type Equipamento,
  inversoresPadrao,
  microinversoresPadrao,
  modulosPadrao,
} from "./equipamentos";
type KitSolar = {
  id: string;
  nome: string;
  geracao: string;
  potencia: string;
  quantidadeModulos: string;
  moduloId: string;
  quantidadeInversores: string;
  inversorId: string;
  tipoInversor: "String" | "Microinversor";
  valor: string;
};

type KitSolarEditor = KitSolar & {
  ativo?: boolean;
};

type Cliente = {
  id: string | number;
  nome: string;
  telefone?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  cpf_cnpj?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
};

const KITS_PADRAO: KitSolar[] = [
  { id: "300", nome: "Kit 300 kWh", geracao: "300", potencia: "2,50 kWp", quantidadeModulos: "4", moduloId: "jinko-630", quantidadeInversores: "2", inversorId: "hoymiles-1600", tipoInversor: "Microinversor", valor: "R$ 6.999,00" },
  { id: "400", nome: "Kit 400 kWh", geracao: "400", potencia: "2,84 kWp", quantidadeModulos: "4", moduloId: "jinko-710", quantidadeInversores: "2", inversorId: "hoymiles-2000", tipoInversor: "Microinversor", valor: "R$ 8.399,00" },
  { id: "500", nome: "Kit 500 kWh", geracao: "500", potencia: "3,55 kWp", quantidadeModulos: "5", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-3", tipoInversor: "String", valor: "R$ 8.950,00" },
  { id: "600", nome: "Kit 600 kWh", geracao: "600", potencia: "4,37 kWp", quantidadeModulos: "7", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-3", tipoInversor: "String", valor: "R$ 10.099,00" },
  { id: "700", nome: "Kit 700 kWh", geracao: "700", potencia: "5,62 kWp", quantidadeModulos: "9", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-5", tipoInversor: "String", valor: "R$ 12.799,00" },
  { id: "800", nome: "Kit 800 kWh", geracao: "800", potencia: "6,25 kWp", quantidadeModulos: "10", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-5", tipoInversor: "String", valor: "R$ 13.750,00" },
  { id: "900", nome: "Kit 900 kWh", geracao: "900", potencia: "6,88 kWp", quantidadeModulos: "11", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-6", tipoInversor: "String", valor: "R$ 14.699,00" },
  { id: "1000", nome: "Kit 1000 kWh", geracao: "1000", potencia: "7,50 kWp", quantidadeModulos: "12", moduloId: "jinko-625", quantidadeInversores: "1", inversorId: "huawei-6", tipoInversor: "String", valor: "R$ 15.999,00" },
  { id: "1200", nome: "Kit 1200 kWh", geracao: "1200", potencia: "9,23 kWp", quantidadeModulos: "13", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-8", tipoInversor: "String", valor: "R$ 18.250,00" },
  { id: "1300", nome: "Kit 1300 kWh", geracao: "1300", potencia: "9,23 kWp", quantidadeModulos: "13", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-8", tipoInversor: "String", valor: "R$ 19.599,00" },
  { id: "1500", nome: "Kit 1500 kWh", geracao: "1500", potencia: "11,36 kWp", quantidadeModulos: "16", moduloId: "jinko-710", quantidadeInversores: "1", inversorId: "huawei-10", tipoInversor: "String", valor: "R$ 22.799,00" },
];

type Formulario = {
  clienteId: string;
  nome: string;
  telefone: string;
  cidade: string;
  enderecoCliente: string;
  cpfCnpj: string;
  consumo: string;
  valorConta: string;
  kitId: string;
  modoSistema: "kit" | "personalizado";
  geracao: string;
  potencia: string;
  quantidadeModulos: string;
  moduloId: string;
  quantidadeInversores: string;
  inversorId: string;
  tipoInversor: "String" | "Microinversor";
  valorProposta: string;
  percentualCartao: string;
  parcelasCartao: string;
  percentualFinanciamento: string;
  parcelasFinanciamento: string;
  enderecoLoja: string;
  garantiaDesempenhoModulo: string;
  garantiaModulo: string;
  garantiaInversor: string;
  garantiaInstalacao: string;
  temaPDF: "claro" | "escuro";
};

const formularioInicial: Formulario = {
  clienteId: "", nome: "", telefone: "", cidade: "", enderecoCliente: "", cpfCnpj: "",
  consumo: "", valorConta: "", kitId: "",
  modoSistema: "kit", geracao: "", potencia: "", quantidadeModulos: "", moduloId: "",
  quantidadeInversores: "1", inversorId: "", tipoInversor: "String", valorProposta: "",
  percentualCartao: "", parcelasCartao: "18", percentualFinanciamento: "", parcelasFinanciamento: "84",
  enderecoLoja: "",
  garantiaDesempenhoModulo: "25", garantiaModulo: "10", garantiaInversor: "10", garantiaInstalacao: "1",
  temaPDF: "claro",
};

const instalacoesIniciais: InstalacaoPortfolio[] = Array.from({ length: 4 }, () => ({
  foto: "",
  cidade: "",
  descricao: "",
}));

async function comprimirImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }

  const urlTemporaria = URL.createObjectURL(arquivo);

  try {
    const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      img.src = urlTemporaria;
    });

    const limiteLargura = 1400;
    const limiteAltura = 900;
    const proporcao = Math.min(
      limiteLargura / imagem.naturalWidth,
      limiteAltura / imagem.naturalHeight,
      1,
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * proporcao));
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * proporcao));

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível processar a imagem.");

    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(urlTemporaria);
  }
}

function numero(valor?: string | number | null) {
  const texto = String(valor ?? "");

  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const convertido = Number(limpo);

  return Number.isFinite(convertido) ? convertido : 0;
}

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function esperarImagens(elemento: HTMLElement) {
  const imagens = Array.from(elemento.querySelectorAll("img"));

  await Promise.all(
    imagens.map(
      (imagem) =>
        new Promise<void>((resolve) => {
          // Mesmo que a imagem tenha falhado, não deixa o PDF travado.
          if (imagem.complete) {
            resolve();
            return;
          }

          const finalizar = () => resolve();

          imagem.addEventListener("load", finalizar, { once: true });
          imagem.addEventListener("error", finalizar, { once: true });

          // Segurança: libera a geração após 5 segundos.
          setTimeout(finalizar, 5000);
        }),
    ),
  );
}

export default function FormularioProposta() {
  const [formulario, setFormulario] = useState<Formulario>(formularioInicial);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [gerandoPDFCelular, setGerandoPDFCelular] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState<number | null>(null);
  const [instalacoes, setInstalacoes] = useState<InstalacaoPortfolio[]>(instalacoesIniciais);
  const [kitsDisponiveis, setKitsDisponiveis] = useState<KitSolar[]>(KITS_PADRAO);
  const [gerenciarKitsAberto, setGerenciarKitsAberto] = useState(false);
  const [salvandoKit, setSalvandoKit] = useState(false);
  const [kitEditando, setKitEditando] = useState<KitSolarEditor | null>(null);
  const [mensagemSolarSalva, setMensagemSolarSalva] = useState(false);
  const [modoVisualizacaoSolar, setModoVisualizacaoSolar] = useState<
    "dividido" | "formulario" | "pdf"
  >("dividido");
  const [modulos, setModulos] = useState<Equipamento[]>(modulosPadrao);
  const [inversores, setInversores] = useState<Equipamento[]>(inversoresPadrao);
  const [microinversores, setMicroinversores] = useState<Equipamento[]>(microinversoresPadrao);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState("");
  const [escalaPreview, setEscalaPreview] = useState(1);
  const [mensagemPadraoSolar, setMensagemPadraoSolar] = useState(
    "Olá, {nome}! Segue sua proposta de Energia Solar da CHOQUESEG.\n\nGeração estimada: {geracao} kWh/mês.\nPotência do sistema: {potencia}.\nQuantidade de módulos: {modulos}.\nValor à vista: {valor}.\nCartão: {cartao}.\n\nTodos os detalhes estão no PDF. Fico à disposição para qualquer dúvida.\n\nEquipe CHOQUESEG"
  );
  const [mensagemSolarAberta, setMensagemSolarAberta] = useState(false);
  const [salvandoMensagemSolar, setSalvandoMensagemSolar] = useState(false);
  const [previewPdfSolarAberto, setPreviewPdfSolarAberto] = useState(false);
  const [previewPdfSolarUrl, setPreviewPdfSolarUrl] = useState("");
  const [previewPdfSolarBlob, setPreviewPdfSolarBlob] = useState<Blob | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewCelularRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const salvos = localStorage.getItem("choqueseg-equipamentos");
      if (!salvos) return;
      const dados = JSON.parse(salvos) as { modulos?: Equipamento[]; inversores?: Equipamento[]; microinversores?: Equipamento[] };
      if (dados.modulos?.length) setModulos(dados.modulos);
      if (dados.inversores?.length) setInversores(dados.inversores);
      if (dados.microinversores?.length) setMicroinversores(dados.microinversores);
    } catch (erro) {
      console.error("Não foi possível carregar os equipamentos:", erro);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarClientes() {
      setCarregandoClientes(true);
      setErroClientes("");

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        setErroClientes(`Não foi possível carregar os clientes: ${error.message}`);
        setClientes([]);
      } else {
        setClientes((data ?? []) as Cliente[]);
      }

      setCarregandoClientes(false);
    }

    void carregarClientes();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const elemento = previewAreaRef.current;
    if (!elemento) return;

    const ajustar = () => {
      const larguraDisponivel = Math.max(elemento.clientWidth - 16, 280);
      const novaEscala = Math.min(1, Math.max(0.32, larguraDisponivel / 794));
      setEscalaPreview(novaEscala);
    };

    ajustar();

    const observador = new ResizeObserver(ajustar);
    observador.observe(elemento);
    window.addEventListener("resize", ajustar);

    return () => {
      observador.disconnect();
      window.removeEventListener("resize", ajustar);
    };
  }, []);

  useEffect(() => {
    const enderecoSalvo = localStorage.getItem("choqueseg-endereco-loja") || "";
    if (enderecoSalvo) {
      setFormulario((anterior) => ({ ...anterior, enderecoLoja: enderecoSalvo }));
    }
  }, []);

  useEffect(() => {
    const temaSalvo = localStorage.getItem("choqueseg-tema-pdf");
    if (temaSalvo === "claro" || temaSalvo === "escuro") {
      setFormulario((anterior) => ({ ...anterior, temaPDF: temaSalvo }));
    }
  }, []);

  function salvarEquipamentos(novosModulos: Equipamento[], novosInversores: Equipamento[], novosMicroinversores: Equipamento[]) {
    localStorage.setItem("choqueseg-equipamentos", JSON.stringify({ modulos: novosModulos, inversores: novosInversores, microinversores: novosMicroinversores }));
  }

  const listaInversores = formulario.tipoInversor === "Microinversor" ? microinversores : inversores;
  const moduloSelecionado = modulos.find((item) => item.id === formulario.moduloId);
  const inversorSelecionado = listaInversores.find((item) => item.id === formulario.inversorId);

  useEffect(() => {
    const salvo = localStorage.getItem("choqueseg-solar-modo-visualizacao");
    if (salvo === "dividido" || salvo === "formulario" || salvo === "pdf") {
      setModoVisualizacaoSolar(salvo);
    }
  }, []);

  function alterarModoVisualizacaoSolar(modo: "dividido" | "formulario" | "pdf") {
    setModoVisualizacaoSolar(modo);
    localStorage.setItem("choqueseg-solar-modo-visualizacao", modo);
  }

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_FOTOS_SOLAR);
      if (salvo) {
        const parsed = JSON.parse(salvo) as InstalacaoPortfolio[];
        if (Array.isArray(parsed) && parsed.length === 4) {
          setInstalacoes(parsed);
        }
      }
    } catch (erro) {
      console.error("Erro ao restaurar fotos padrão da proposta Solar:", erro);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_FOTOS_SOLAR, JSON.stringify(instalacoes));
    } catch (erro) {
      console.error("Erro ao salvar fotos padrão da proposta Solar:", erro);
    }
  }, [instalacoes]);

  const potenciaCalculada = useMemo(() => {
    if (formulario.modoSistema !== "personalizado") return formulario.potencia;
    const quantidade = numero(formulario.quantidadeModulos);
    const watts = numero(moduloSelecionado?.potencia || "");
    if (!quantidade || !watts) return "";
    return `${((quantidade * watts) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWp`;
  }, [formulario.modoSistema, formulario.potencia, formulario.quantidadeModulos, moduloSelecionado]);

  const calculos = useMemo(() => {
    const valorBase = numero(formulario.valorProposta);
    const percentualCartao = numero(formulario.percentualCartao);
    const parcelasCartao = Math.max(Math.round(numero(formulario.parcelasCartao)), 1);
    const percentualFinanciamento = numero(formulario.percentualFinanciamento);
    const parcelasFinanciamento = Math.max(Math.round(numero(formulario.parcelasFinanciamento)), 1);
    const totalCartao = valorBase * (1 + percentualCartao / 100);
    const totalFinanciamento = valorBase * (1 + percentualFinanciamento / 100);
    return {
      valorBase, totalCartao, parcelasCartao,
      parcelaCartao: totalCartao / parcelasCartao,
      totalFinanciamento, parcelasFinanciamento,
      parcelaFinanciamento: totalFinanciamento / parcelasFinanciamento,
    };
  }, [formulario.valorProposta, formulario.percentualCartao, formulario.parcelasCartao, formulario.percentualFinanciamento, formulario.parcelasFinanciamento]);

  const estimativaSolar = useMemo(() => {
    const consumo = Math.max(numero(formulario.consumo), 0);
    const conta = Math.max(numero(formulario.valorConta), 0);
    const geracao = Math.max(numero(formulario.geracao), 0);

    if (!consumo || !conta || !geracao) {
      return {
        economiaMensal: 0,
        economiaAnual: 0,
        percentualEconomia: 0,
        excedenteKwh: 0,
        coberturaPercentual: 0,
      };
    }

    const tarifaMedia = conta / consumo;
    const energiaCompensada = Math.min(consumo, geracao);
    const economiaEnergetica = energiaCompensada * tarifaMedia;
    const limiteEconomia = conta * 0.9;
    const economiaMensal = Math.min(economiaEnergetica, limiteEconomia);
    const economiaAnual = economiaMensal * 12;
    const excedenteKwh = Math.max(geracao - consumo, 0);
    const percentualEconomia =
      conta > 0 ? Math.min(Math.round((economiaMensal / conta) * 100), 90) : 0;
    const coberturaPercentual =
      consumo > 0 ? Math.round((geracao / consumo) * 100) : 0;

    return {
      economiaMensal,
      economiaAnual,
      percentualEconomia,
      excedenteKwh,
      coberturaPercentual,
    };
  }, [formulario.consumo, formulario.valorConta, formulario.geracao]);

  const validacaoEconomia = useMemo(() => {
    const consumo = numero(formulario.consumo);
    const conta = numero(formulario.valorConta);
    const geracao = numero(formulario.geracao);

    if (!consumo || !conta || !geracao) {
      return { mostrar: false, texto: "" };
    }

    const custoMedioKwh = conta / consumo;
    if (custoMedioKwh < 0.35 || custoMedioKwh > 2.5) {
      return {
        mostrar: true,
        texto: `Confira a conta mensal informada. Ela equivale a ${dinheiro(custoMedioKwh)}/kWh, valor fora da faixa usual. Isso altera economia e payback.`,
      };
    }

    return { mostrar: false, texto: "" };
  }, [formulario.consumo, formulario.valorConta, formulario.geracao]);

  useEffect(() => {
    async function carregarMensagemPadraoSolar() {
      const { data, error } = await supabase
        .from("mensagens_padrao")
        .select("mensagem")
        .eq("chave", CHAVE_MENSAGEM_SOLAR)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar mensagem padrão Solar:", error);
        return;
      }

      if (data?.mensagem) {
        setMensagemPadraoSolar(String(data.mensagem));
        setMensagemSolarSalva(true);
      }
    }

    void carregarMensagemPadraoSolar();
  }, []);

  async function salvarMensagemPadraoSolar() {
    const mensagem = mensagemPadraoSolar.trim();

    if (!mensagem) {
      alert("Digite a mensagem padrão antes de salvar.");
      return;
    }

    setSalvandoMensagemSolar(true);

    try {
      const { error } = await supabase
        .from("mensagens_padrao")
        .upsert(
          {
            chave: CHAVE_MENSAGEM_SOLAR,
            mensagem,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "chave" },
        );

      if (error) throw error;

      setMensagemPadraoSolar(mensagem);
      setMensagemSolarSalva(true);
      setMensagemSolarAberta(false);
      alert("Mensagem padrão da Energia Solar salva com sucesso.");
    } catch (erro) {
      console.error("Erro ao salvar mensagem padrão Solar:", erro);
      alert(
        erro instanceof Error
          ? `Não foi possível salvar a mensagem: ${erro.message}`
          : "Não foi possível salvar a mensagem padrão da Energia Solar.",
      );
    } finally {
      setSalvandoMensagemSolar(false);
    }
  }


  function mensagemSolarAtual() {
    const modelo = mensagemPadraoSolar.trim();
    if (!modelo) return montarMensagemWhatsApp();

    const potenciaSistema =
      formulario.modoSistema === "personalizado"
        ? potenciaCalculada
        : formulario.potencia;

    const valorVista =
      calculos.valorBase > 0
        ? dinheiro(calculos.valorBase)
        : formulario.valorProposta || "—";

    const cartao =
      calculos.parcelaCartao > 0
        ? `${calculos.parcelasCartao}x de ${dinheiro(calculos.parcelaCartao)}`
        : `até ${calculos.parcelasCartao}x`;

    return modelo
      .replaceAll("{nome}", formulario.nome.trim() || "cliente")
      .replaceAll("{consumo}", formulario.consumo || "—")
      .replaceAll("{geracao}", formulario.geracao || "—")
      .replaceAll("{potencia}", potenciaSistema || "—")
      .replaceAll("{modulos}", formulario.quantidadeModulos || "—")
      .replaceAll("{valor}", valorVista)
      .replaceAll("{cartao}", cartao)
      .replaceAll("{economia_mensal}", dinheiro(estimativaSolar.economiaMensal))
      .replaceAll("{economia_percentual}", `${estimativaSolar.percentualEconomia}%`)
      .replaceAll("{excedente}", `${Math.round(estimativaSolar.excedenteKwh)} kWh/mês`);
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    if (campo === "enderecoLoja") {
      localStorage.setItem("choqueseg-endereco-loja", valor);
    }
    if (campo === "temaPDF") {
      localStorage.setItem("choqueseg-tema-pdf", valor);
    }
  }

  function selecionarCliente(clienteId: string) {
    const cliente = clientes.find((item) => String(item.id) === clienteId);

    if (!cliente) {
      setFormulario((anterior) => ({
        ...anterior,
        clienteId: "",
        nome: "",
        telefone: "",
        cidade: "",
        enderecoCliente: "",
        cpfCnpj: "",
      }));
      return;
    }

    const cpfCnpj =
      cliente.cpf_cnpj?.trim() ||
      cliente.cpf?.trim() ||
      cliente.cnpj?.trim() ||
      "";

    setFormulario((anterior) => ({
      ...anterior,
      clienteId: String(cliente.id),
      nome: cliente.nome ?? "",
      telefone: cliente.telefone ?? "",
      cidade: cliente.cidade ?? "",
      enderecoCliente: cliente.endereco ?? "",
      cpfCnpj,
    }));
  }

  function mudarModo(modoSistema: Formulario["modoSistema"]) {
    setFormulario((anterior) => ({
      ...formularioInicial,
      clienteId: anterior.clienteId,
      nome: anterior.nome,
      telefone: anterior.telefone,
      cidade: anterior.cidade,
      enderecoCliente: anterior.enderecoCliente,
      cpfCnpj: anterior.cpfCnpj,
      consumo: anterior.consumo,
      valorConta: anterior.valorConta,
      percentualCartao: anterior.percentualCartao, parcelasCartao: anterior.parcelasCartao,
      percentualFinanciamento: anterior.percentualFinanciamento, parcelasFinanciamento: anterior.parcelasFinanciamento,
      enderecoLoja: anterior.enderecoLoja,
      garantiaDesempenhoModulo: anterior.garantiaDesempenhoModulo, garantiaModulo: anterior.garantiaModulo,
      garantiaInversor: anterior.garantiaInversor, garantiaInstalacao: anterior.garantiaInstalacao,
      temaPDF: anterior.temaPDF,
      modoSistema,
    }));
  }

  useEffect(() => {
    async function carregarKitsSolares() {
      try {
        const { data, error } = await supabase
          .from("kits_solares")
          .select("*")
          .eq("ativo", true)
          .order("geracao_kwh", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          const registros = KITS_PADRAO.map((kit) => ({
            id: `padrao-${kit.id}`,
            nome: kit.nome,
            geracao_kwh: kit.geracao,
            potencia_kwp: kit.potencia,
            quantidade_modulos: kit.quantidadeModulos,
            modulo_id: kit.moduloId,
            quantidade_inversores: kit.quantidadeInversores,
            inversor_id: kit.inversorId,
            tipo_inversor: kit.tipoInversor,
            valor: kit.valor,
            ativo: true,
          }));

          const { error: erroSeed } = await supabase.from("kits_solares").insert(registros);
          if (erroSeed) throw erroSeed;

          setKitsDisponiveis(
            KITS_PADRAO.map((kit) => ({ ...kit, id: `padrao-${kit.id}` })),
          );
          return;
        }

        setKitsDisponiveis(
          data.map((item: any) => ({
            id: String(item.id),
            nome: String(item.nome ?? ""),
            geracao: String(item.geracao_kwh ?? ""),
            potencia: String(item.potencia_kwp ?? ""),
            quantidadeModulos: String(item.quantidade_modulos ?? ""),
            moduloId: String(item.modulo_id ?? ""),
            quantidadeInversores: String(item.quantidade_inversores ?? "1"),
            inversorId: String(item.inversor_id ?? ""),
            tipoInversor:
              item.tipo_inversor === "Microinversor" ? "Microinversor" : "String",
            valor: String(item.valor ?? ""),
          })),
        );
      } catch (erro) {
        console.error("Erro ao carregar kits solares:", erro);
        setKitsDisponiveis(KITS_PADRAO);
      }
    }

    void carregarKitsSolares();
  }, []);

  function novoKitSolar() {
    setKitEditando({
      id: "",
      nome: "",
      geracao: "",
      potencia: "",
      quantidadeModulos: "",
      moduloId: "",
      quantidadeInversores: "1",
      inversorId: "",
      tipoInversor: "String",
      valor: "",
      ativo: true,
    });
    setGerenciarKitsAberto(true);
  }

  function editarKitSolar(kit: KitSolar) {
    setKitEditando({ ...kit, ativo: true });
    setGerenciarKitsAberto(true);
  }

  function duplicarKitSolar(kit: KitSolar) {
    setKitEditando({
      ...kit,
      id: "",
      nome: `${kit.nome} - cópia`,
      ativo: true,
    });
    setGerenciarKitsAberto(true);
  }

  async function salvarKitSolar() {
    if (!kitEditando) return;

    if (!kitEditando.nome.trim() || !kitEditando.geracao.trim()) {
      alert("Informe pelo menos o nome e a geração do kit.");
      return;
    }

    setSalvandoKit(true);

    try {
      const id =
        kitEditando.id ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `kit-${Date.now()}`);

      const registro = {
        id,
        nome: kitEditando.nome.trim(),
        geracao_kwh: kitEditando.geracao.trim(),
        potencia_kwp: kitEditando.potencia.trim(),
        quantidade_modulos: kitEditando.quantidadeModulos.trim(),
        modulo_id: kitEditando.moduloId,
        quantidade_inversores: kitEditando.quantidadeInversores.trim() || "1",
        inversor_id: kitEditando.inversorId,
        tipo_inversor: kitEditando.tipoInversor,
        valor: kitEditando.valor.trim(),
        ativo: true,
        atualizado_em: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("kits_solares")
        .upsert(registro, { onConflict: "id" });

      if (error) throw error;

      const kitSalvo: KitSolar = {
        id,
        nome: registro.nome,
        geracao: registro.geracao_kwh,
        potencia: registro.potencia_kwp,
        quantidadeModulos: registro.quantidade_modulos,
        moduloId: registro.modulo_id,
        quantidadeInversores: registro.quantidade_inversores,
        inversorId: registro.inversor_id,
        tipoInversor: registro.tipo_inversor as "String" | "Microinversor",
        valor: registro.valor,
      };

      setKitsDisponiveis((atuais) => {
        const semAtual = atuais.filter((item) => item.id !== id);
        return [...semAtual, kitSalvo].sort(
          (a, b) => numero(a.geracao) - numero(b.geracao),
        );
      });

      setKitEditando(null);
      setGerenciarKitsAberto(false);
      alert("Kit Solar salvo com sucesso.");
    } catch (erro) {
      console.error("Erro ao salvar kit Solar:", erro);
      alert(
        erro instanceof Error
          ? `Não foi possível salvar o kit: ${erro.message}`
          : "Não foi possível salvar o kit Solar.",
      );
    } finally {
      setSalvandoKit(false);
    }
  }

  async function excluirKitSolar(kit: KitSolar) {
    if (!window.confirm(`Excluir/desativar o kit "${kit.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from("kits_solares")
        .update({ ativo: false, atualizado_em: new Date().toISOString() })
        .eq("id", kit.id);

      if (error) throw error;

      setKitsDisponiveis((atuais) =>
        atuais.filter((item) => item.id !== kit.id),
      );

      if (formulario.kitId === kit.id) {
        atualizarCampo("kitId", "");
      }
    } catch (erro) {
      console.error("Erro ao excluir kit Solar:", erro);
      alert("Não foi possível excluir/desativar o kit.");
    }
  }

  function selecionarKit(kitId: string) {
    const kit = kitsDisponiveis.find((item) => item.id === kitId);
    if (!kit) {
      setFormulario((anterior) => ({ ...anterior, kitId: "", geracao: "", potencia: "", quantidadeModulos: "", moduloId: "", quantidadeInversores: "1", inversorId: "", tipoInversor: "String", valorProposta: "" }));
      return;
    }
    setFormulario((anterior) => ({ ...anterior, kitId: kit.id, geracao: kit.geracao, potencia: kit.potencia, quantidadeModulos: kit.quantidadeModulos, moduloId: kit.moduloId, quantidadeInversores: kit.quantidadeInversores, inversorId: kit.inversorId, tipoInversor: kit.tipoInversor, valorProposta: kit.valor }));
  }

  function adicionarEquipamento(tipo: "modulo" | "inversor" | "microinversor") {
    const marca = window.prompt("Marca do equipamento:")?.trim();
    if (!marca) return;
    const modelo = window.prompt("Modelo do equipamento:")?.trim() || "";
    const potencia = window.prompt("Potência (ex.: 630 W ou 6 kW):")?.trim();
    if (!potencia) return;
    const id = `${tipo}-${Date.now()}`;
    const novo: Equipamento = { id, marca, modelo, potencia };
    if (tipo === "modulo") {
      const bifacial = window.confirm("Este módulo é bifacial?");
      novo.bifacial = bifacial;
      const novaLista = [...modulos, novo];
      setModulos(novaLista);
      salvarEquipamentos(novaLista, inversores, microinversores);
      atualizarCampo("moduloId", id);
    } else if (tipo === "inversor") {
      const novaLista = [...inversores, novo];
      setInversores(novaLista);
      salvarEquipamentos(modulos, novaLista, microinversores);
      atualizarCampo("inversorId", id);
    } else {
      const novaLista = [...microinversores, novo];
      setMicroinversores(novaLista);
      salvarEquipamentos(modulos, inversores, novaLista);
      atualizarCampo("inversorId", id);
    }
  }

  function atualizarInstalacao(
    indice: number,
    campo: keyof InstalacaoPortfolio,
    valor: string,
  ) {
    setInstalacoes((anteriores) =>
      anteriores.map((instalacao, posicao) =>
        posicao === indice ? { ...instalacao, [campo]: valor } : instalacao,
      ),
    );
  }

  async function escolherFoto(indice: number, arquivo?: File) {
    if (!arquivo) return;

    try {
      setProcessandoFoto(indice);
      const fotoComprimida = await comprimirImagem(arquivo);
      atualizarInstalacao(indice, "foto", fotoComprimida);
    } catch (erro) {
      console.error("Erro ao carregar foto:", erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível carregar a foto.");
    } finally {
      setProcessandoFoto(null);
    }
  }

  function removerFoto(indice: number) {
    atualizarInstalacao(indice, "foto", "");
  }

  const dadosPreview: DadosPreview = {
    nome: formulario.nome, telefone: formulario.telefone, cidade: formulario.cidade,
    consumo: formulario.consumo, valorConta: formulario.valorConta, geracao: formulario.geracao,
    potencia: formulario.modoSistema === "personalizado" ? potenciaCalculada : formulario.potencia,
    quantidadeModulos: formulario.quantidadeModulos,
    marcaModulo: moduloSelecionado?.marca || "",
    modeloModulo: moduloSelecionado?.modelo || "",
    potenciaModulo: moduloSelecionado?.potencia || "",
    moduloBifacial: Boolean(moduloSelecionado?.bifacial),
    quantidadeInversores: formulario.quantidadeInversores,
    marcaInversor: inversorSelecionado?.marca || "",
    modeloInversor: inversorSelecionado?.modelo || "",
    potenciaInversor: inversorSelecionado?.potencia || "",
    tipoInversor: formulario.tipoInversor,
    valorProposta: calculos.valorBase > 0 ? dinheiro(calculos.valorBase) : formulario.valorProposta,
    parcelasCartao: calculos.parcelasCartao,
    totalCartao: calculos.totalCartao > 0 ? dinheiro(calculos.totalCartao) : "—",
    parcelaCartao: calculos.parcelaCartao > 0 ? dinheiro(calculos.parcelaCartao) : "—",
    parcelasFinanciamento: calculos.parcelasFinanciamento,
    totalFinanciamento: calculos.totalFinanciamento > 0 ? dinheiro(calculos.totalFinanciamento) : "—",
    parcelaFinanciamento: calculos.parcelaFinanciamento > 0 ? dinheiro(calculos.parcelaFinanciamento) : "—",
    instalacoes,
    enderecoLoja: formulario.enderecoLoja,
    garantiaDesempenhoModulo: formulario.garantiaDesempenhoModulo,
    garantiaModulo: formulario.garantiaModulo,
    garantiaInversor: formulario.garantiaInversor,
    garantiaInstalacao: formulario.garantiaInstalacao,
    temaPDF: formulario.temaPDF,
  };

  async function capturarPaginaSolar(pagina: HTMLElement, celular: boolean) {
    await document.fonts.ready;
    await esperarImagens(pagina);
    if (Array.from(pagina.querySelectorAll<HTMLImageElement>("header img")).some((imagem) => !imagem.naturalWidth)) {
      throw new Error("A fotografia ou o brasão do cabeçalho não carregou. Aguarde e tente novamente.");
    }
    const controle = new AbortController();
    const captura = html2canvas(pagina, {
      scale: celular ? 1.5 : 2,
      signal: controle.signal,
      windowWidth: 794,
      windowHeight: 1123,
      scrollX: 0,
      scrollY: 0,
      onclone: (documento, paginaClonada) => {
        // Captura isolada: evita coordenadas negativas e recortes de ancestrais.
        documento.body.replaceChildren(paginaClonada);
        documento.body.style.margin = "0";
        Object.assign(paginaClonada.style, {
          position: "relative", left: "0", top: "0", margin: "0", zoom: "1",
        });
      },
      useCORS: true,
      allowTaint: false,
      backgroundColor: formulario.temaPDF === "escuro" ? "#09090b" : "#ffffff",
      logging: false,
      imageTimeout: 10000,
      removeContainer: true,
    });
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        captura,
        new Promise<never>((_, rejeitar) => {
          temporizador = setTimeout(() => {
            rejeitar(new Error("A captura demorou mais de 20 segundos. Tente novamente usando PDF Celular."));
            controle.abort();
          }, 20000);
        }),
      ]);
    } finally {
      if (temporizador !== undefined) clearTimeout(temporizador);
    }

  }


  async function criarPDFBlob(celular = false): Promise<Blob> {
    const raiz = previewCelularRef.current;
    if (!raiz) throw new Error("Não foi possível localizar a proposta.");
    const paginas = Array.from(raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"));
    if (paginas.length !== 4) throw new Error("A proposta Solar precisa conter exatamente quatro páginas.");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    for (let indice = 0; indice < paginas.length; indice += 1) {
      const pagina = paginas[indice];
      const canvas = await capturarPaginaSolar(pagina, celular);
      const imagem = canvas.toDataURL("image/jpeg", celular ? 0.9 : 0.94);
      if (indice > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(imagem, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      canvas.width = 1; canvas.height = 1;
    }
    return pdf.output("blob");
  }

  async function visualizarPDF() {
    try {
      setGerandoPDF(true);
      const blob = await criarPDFBlob(false);
      if (previewPdfSolarUrl) URL.revokeObjectURL(previewPdfSolarUrl);
      const url = URL.createObjectURL(blob);
      setPreviewPdfSolarBlob(blob);
      setPreviewPdfSolarUrl(url);
      setPreviewPdfSolarAberto(true);
    } catch (erro) {
      console.error("Erro ao visualizar PDF:", erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível visualizar o PDF.");
    } finally {
      setGerandoPDF(false);
    }
  }

  function baixarPdfSolarVisualizado() {
    if (!previewPdfSolarBlob) return;
    const nomeCliente = formulario.nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";
    const url = URL.createObjectURL(previewPdfSolarBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Proposta-CHOQUESEG-${nomeCliente}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function imprimirPdfSolarVisualizado() {
    if (!previewPdfSolarUrl) return;
    const janela = window.open(previewPdfSolarUrl, "_blank");
    if (!janela) {
      alert("Permita pop-ups para abrir a impressão.");
      return;
    }
    setTimeout(() => janela.print(), 700);
  }

  async function compartilharPdfSolar(blob: Blob) {
    const telefone = formulario.telefone.replace(/\D/g, "");
    if (telefone.length < 10) {
      alert("Informe um telefone/WhatsApp válido do cliente.");
      return;
    }
    const mensagemPadrao = mensagemSolarAtual();
    const nomeCliente = formulario.nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";
    const arquivo = new File([blob], `Proposta-CHOQUESEG-${nomeCliente}.pdf`, { type: "application/pdf" });
    const navegador = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };

    try {
      if (navigator.share && (!navegador.canShare || navegador.canShare({ files: [arquivo] }))) {
        await navigator.share({
          title: `Proposta CHOQUESEG - ${formulario.nome || "Cliente"}`,
          text: mensagemPadrao,
          files: [arquivo],
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Proposta-CHOQUESEG-${nomeCliente}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const destino = telefone.startsWith("55") ? telefone : `55${telefone}`;
      window.open(`https://wa.me/${destino}?text=${encodeURIComponent(mensagemPadrao)}`, "_blank", "noopener,noreferrer");
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === "AbortError") return;
      console.error("Erro ao preparar envio:", erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível preparar o envio.");
    }
  }

  async function enviarPDFCliente() {
    try {
      setGerandoPDF(true);
      const blob = previewPdfSolarBlob ?? (await criarPDFBlob(true));
      await compartilharPdfSolar(blob);
    } finally {
      setGerandoPDF(false);
    }
  }

 async function gerarPDF() {
  const raiz = previewCelularRef.current;

  if (!raiz) {
    alert("Não foi possível localizar a proposta.");
    return;
  }

  try {
    setGerandoPDF(true);

    const paginas = Array.from(
      raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
    );

    if (paginas.length !== 4) {
      alert("A proposta Solar precisa conter exatamente quatro páginas.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let indice = 0; indice < paginas.length; indice += 1) {
      const pagina = paginas[indice];

      const canvas = await capturarPaginaSolar(pagina, false);

      const imagem = canvas.toDataURL("image/jpeg", 0.94);

      if (indice > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imagem,
        "JPEG",
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

    const nomeCliente =
      formulario.nome
        .trim()
        .replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

    pdf.save(`Proposta-CHOQUESEG-${nomeCliente}.pdf`);

    alert("PDF gerado com sucesso.");
  } catch (erro) {
    console.error("Erro detalhado ao gerar PDF:", erro);

    alert(
      erro instanceof Error
        ? erro.message
        : "Ocorreu um erro desconhecido ao gerar o PDF.",
    );
  } finally {
    setGerandoPDF(false);
  }
 }

  async function gerarPDFCelular() {
    const raiz = previewCelularRef.current;
    if (!raiz) {
      alert("Não foi possível localizar a proposta para celular.");
      return;
    }

    try {
      setGerandoPDFCelular(true);
      const paginas = Array.from(
        raiz.querySelectorAll<HTMLElement>("[data-pagina-proposta]"),
      );

      if (paginas.length !== 4) {
        alert("A proposta Solar precisa conter exatamente quatro páginas.");
        return;
      }

      const larguraPdf = 210;
      const alturaPdf = 297;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let indice = 0; indice < paginas.length; indice += 1) {
        const pagina = paginas[indice];
        const canvas = await capturarPaginaSolar(pagina, true);

        const imagem = canvas.toDataURL("image/jpeg", 0.9);
        if (indice > 0) pdf.addPage("a4", "portrait");

        pdf.addImage(
          imagem, "JPEG", 0, 0, larguraPdf, alturaPdf, undefined, "FAST",
        );

        canvas.width = 1;
        canvas.height = 1;
      }

      const nomeCliente =
        formulario.nome.trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "-") || "Cliente";

      pdf.save(`Proposta-CHOQUESEG-Celular-${nomeCliente}.pdf`);
      alert("PDF para celular gerado com sucesso.");
    } catch (erro) {
      console.error("Erro ao gerar PDF para celular:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o PDF para celular.",
      );
    } finally {
      setGerandoPDFCelular(false);
    }
  }


   

  function montarMensagemWhatsApp() {
    const nome = formulario.nome.trim() || "cliente";
    const potenciaSistema =
      formulario.modoSistema === "personalizado"
        ? potenciaCalculada
        : formulario.potencia;

    const valorVista =
      calculos.valorBase > 0
        ? dinheiro(calculos.valorBase)
        : formulario.valorProposta || "—";

    const cartao =
      calculos.parcelaCartao > 0
        ? `${calculos.parcelasCartao}x de ${dinheiro(calculos.parcelaCartao)}`
        : `até ${calculos.parcelasCartao}x`;

    return [
      `Olá, ${nome}! Segue sua proposta de Energia Solar da CHOQUESEG.`,
      formulario.geracao ? `Geração estimada: ${formulario.geracao} kWh/mês.` : "",
      potenciaSistema ? `Potência do sistema: ${potenciaSistema}.` : "",
      `Valor à vista: ${valorVista}.`,
      `Cartão: ${cartao}.`,
      "Financiamento em até 84 meses, sujeito à análise e aprovação.",
      "Materiais, equipamentos e garantias estão detalhados no PDF.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function abrirWhatsApp() {
    const telefone = formulario.telefone.replace(/\D/g, "");
    if (telefone.length < 10) {
      alert("Informe um telefone válido do cliente antes de abrir o WhatsApp.");
      return;
    }

    const destino = telefone.startsWith("55") ? telefone : `55${telefone}`;
    const mensagem = encodeURIComponent(mensagemSolarAtual());
    window.open(`https://wa.me/${destino}?text=${mensagem}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-yellow-400/40 bg-black/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">ChoqueSeg</p><h1 className="text-lg font-black uppercase md:text-2xl">Gerador de proposta solar</h1></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void visualizarPDF()} disabled={gerandoPDF || gerandoPDFCelular || processandoFoto !== null} className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-60">{gerandoPDF ? "Preparando PDF..." : "👁️ Visualizar PDF"}</button>
            <button type="button" onClick={gerarPDFCelular} disabled={gerandoPDF || gerandoPDFCelular || processandoFoto !== null} className="rounded-xl border border-yellow-400 bg-black px-4 py-3 text-sm font-black uppercase text-yellow-400 disabled:opacity-60">{gerandoPDFCelular ? "Gerando celular..." : "📱 PDF Celular"}</button>
            <button
              type="button"
              onClick={() => atualizarCampo("temaPDF", "claro")}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase ${
                formulario.temaPDF === "claro"
                  ? "border-yellow-400 bg-white text-black"
                  : "border-zinc-600 bg-zinc-900 text-white"
              }`}
            >
              PDF Claro
            </button>
            <button
              type="button"
              onClick={() => atualizarCampo("temaPDF", "escuro")}
              className={`rounded-xl border px-3 py-3 text-xs font-black uppercase ${
                formulario.temaPDF === "escuro"
                  ? "border-yellow-400 bg-black text-yellow-400"
                  : "border-zinc-600 bg-zinc-900 text-white"
              }`}
            >
              PDF Escuro
            </button>
            <button type="button" onClick={() => void enviarPDFCliente()} disabled={gerandoPDF || gerandoPDFCelular || processandoFoto !== null} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase text-white disabled:opacity-60">📲 Enviar ao cliente</button>
            <button type="button" onClick={() => {
              setFormulario((anterior) => ({
                ...formularioInicial,
                enderecoLoja: anterior.enderecoLoja,
                temaPDF: anterior.temaPDF,
              }));
              // As fotos padrão permanecem para as próximas propostas.
            }} className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-black uppercase text-white">Limpar</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1920px] px-3 pt-3 xl:px-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800 bg-black p-2">
          {[
            ["dividido", "▥ Dividido"],
            ["formulario", "✍ Formulário"],
            ["pdf", "📄 PDF"],
          ].map(([modo, nome]) => (
            <button
              key={modo}
              type="button"
              onClick={() =>
                alterarModoVisualizacaoSolar(
                  modo as "dividido" | "formulario" | "pdf",
                )
              }
              className={`rounded-xl px-2 py-3 text-xs font-black uppercase ${
                modoVisualizacaoSolar === modo
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {nome}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`mx-auto w-full max-w-[1920px] gap-3 p-3 xl:p-4 ${
          modoVisualizacaoSolar === "dividido"
            ? "grid grid-cols-2"
            : "block"
        }`}
      >
        <aside
          className={`min-w-0 rounded-3xl border border-yellow-400/50 bg-black p-4 ${
            modoVisualizacaoSolar === "pdf" ? "hidden" : "block"
          } ${
            modoVisualizacaoSolar === "dividido"
              ? "h-[72dvh] min-h-[520px] overflow-y-auto overscroll-contain"
              : "mx-auto w-full max-w-5xl"
          }`}
        >
          <div className="mb-6 text-center"><img src="/imagens/logo/brasao-choqueseg.png" alt="Brasão ChoqueSeg" className="mx-auto h-24 w-24 object-contain" /><p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-yellow-400">Preenchimento da proposta</p></div>
          <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950">
            <button
              type="button"
              onClick={() => setMensagemSolarAberta((aberta) => !aberta)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left"
            >
              <div>
                <p className="text-xs font-black uppercase text-yellow-400">💬 Mensagem padrão de envio</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {mensagemSolarAberta ? "Edite, salve e feche." : mensagemSolarSalva ? "Mensagem salva ✓ — toque para abrir" : "Toque para abrir e configurar"}
                </p>
              </div>
              <span className="font-black text-yellow-400">{mensagemSolarAberta ? "▲" : "▼"}</span>
            </button>

            {mensagemSolarAberta && (
              <div className="border-t border-zinc-800 p-3">
                <textarea
                  value={mensagemPadraoSolar}
                  onChange={(e) => setMensagemPadraoSolar(e.target.value)}
                  placeholder={`Olá, {nome}! Segue sua proposta de Energia Solar da CHOQUESEG.

Geração estimada: {geracao} kWh/mês.
Potência: {potencia}.
Quantidade de módulos: {modulos}.
Valor à vista: {valor}.
Cartão: {cartao}.`}
                  rows={9}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm leading-relaxed text-white outline-none focus:border-yellow-400"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  Campos automáticos: {"{nome}"}, {"{consumo}"}, {"{geracao}"}, {"{potencia}"}, {"{modulos}"}, {"{valor}"}, {"{cartao}"}, {"{economia_mensal}"}, {"{economia_percentual}"} e {"{excedente}"}.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void salvarMensagemPadraoSolar()}
                    disabled={salvandoMensagemSolar}
                    className="rounded-xl bg-yellow-400 px-3 py-3 text-xs font-black uppercase text-black disabled:opacity-50"
                  >
                    {salvandoMensagemSolar ? "Salvando..." : "💾 Salvar mensagem"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMensagemSolarAberta(false)}
                    className="rounded-xl border border-zinc-700 px-3 py-3 text-xs font-black uppercase text-white"
                  >
                    ▲ Fechar mensagem
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-5">
            <SecaoFormulario titulo="Cliente">
              <Select
                titulo={carregandoClientes ? "Carregando clientes..." : "Cliente cadastrado"}
                valor={formulario.clienteId}
                aoAlterar={selecionarCliente}
                opcoes={clientes.map((cliente) => ({
                  valor: String(cliente.id),
                  texto: cliente.nome,
                }))}
              />

              {erroClientes && (
                <div className="rounded-xl border border-red-500/60 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-200">
                  {erroClientes}
                </div>
              )}

              <p className="text-xs leading-relaxed text-zinc-400">
                Ao selecionar um cliente, nome, telefone, cidade, endereço e CPF/CNPJ são preenchidos automaticamente. Todos continuam editáveis.
              </p>

              <Campo titulo="Nome" valor={formulario.nome} aoAlterar={(v) => atualizarCampo("nome", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Telefone" valor={formulario.telefone} aoAlterar={(v) => atualizarCampo("telefone", v)} />
                <Campo titulo="Cidade" valor={formulario.cidade} aoAlterar={(v) => atualizarCampo("cidade", v)} />
              </div>
              <Campo titulo="Endereço do cliente" valor={formulario.enderecoCliente} aoAlterar={(v) => atualizarCampo("enderecoCliente", v)} />
              <Campo titulo="CPF / CNPJ" valor={formulario.cpfCnpj} aoAlterar={(v) => atualizarCampo("cpfCnpj", v)} />

              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Consumo kWh" valor={formulario.consumo} aoAlterar={(v) => atualizarCampo("consumo", v)} />
                <Campo titulo="Conta mensal (R$)" valor={formulario.valorConta} aoAlterar={(v) => atualizarCampo("valorConta", v)} />
              </div>

              {validacaoEconomia.mostrar && (
                <div className="rounded-xl border border-red-500/70 bg-red-950/40 px-3 py-2 text-xs font-bold leading-relaxed text-red-200">
                  ⚠ {validacaoEconomia.texto}
                </div>
              )}

              {(estimativaSolar.economiaMensal > 0 || estimativaSolar.excedenteKwh > 0) && (
                <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/5 p-3">
                  <p className="text-xs font-black uppercase text-yellow-400">
                    Estimativa automática de economia
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-zinc-900 p-3">
                      <span className="block text-xs text-zinc-400">Economia mensal estimada</span>
                      <strong className="mt-1 block text-lg text-yellow-400">
                        {dinheiro(estimativaSolar.economiaMensal)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-zinc-900 p-3">
                      <span className="block text-xs text-zinc-400">Economia estimada</span>
                      <strong className="mt-1 block text-lg text-yellow-400">
                        até {estimativaSolar.percentualEconomia}%
                      </strong>
                    </div>
                    <div className="rounded-xl bg-zinc-900 p-3">
                      <span className="block text-xs text-zinc-400">Excedente estimado</span>
                      <strong className="mt-1 block text-lg text-yellow-400">
                        {Math.round(estimativaSolar.excedenteKwh)} kWh/mês
                      </strong>
                    </div>
                    <div className="rounded-xl bg-zinc-900 p-3">
                      <span className="block text-xs text-zinc-400">Cobertura estimada</span>
                      <strong className="mt-1 block text-lg text-yellow-400">
                        {estimativaSolar.coberturaPercentual}%
                      </strong>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                    Valores estimados. A economia real depende da tarifa, consumo, geração efetiva,
                    disponibilidade da rede e cobranças mínimas da distribuidora. Quando houver
                    excedente, ele poderá gerar créditos de energia com validade de até 60 meses,
                    conforme as regras aplicáveis do sistema de compensação.
                  </p>
                </div>
              )}

            </SecaoFormulario>

            <SecaoFormulario titulo="Sistema solar">
              <div className="grid grid-cols-2 gap-2"><BotaoModo ativo={formulario.modoSistema === "kit"} texto="Kit pronto" aoClicar={() => mudarModo("kit")} /><BotaoModo ativo={formulario.modoSistema === "personalizado"} texto="Personalizado" aoClicar={() => mudarModo("personalizado")} /></div>
              {formulario.modoSistema === "kit" && (
                <div className="space-y-3">
                  <Select
                    titulo="Kit"
                    valor={formulario.kitId}
                    aoAlterar={selecionarKit}
                    opcoes={kitsDisponiveis.map((kit) => ({
                      valor: kit.id,
                      texto: `${kit.nome} — ${kit.valor}`,
                    }))}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={novoKitSolar}
                      className="rounded-xl bg-yellow-400 px-3 py-3 text-xs font-black uppercase text-black"
                    >
                      + Criar novo kit
                    </button>
                    <button
                      type="button"
                      onClick={() => setGerenciarKitsAberto((aberto) => !aberto)}
                      className="rounded-xl border border-yellow-400 px-3 py-3 text-xs font-black uppercase text-yellow-400"
                    >
                      ⚙ Gerenciar kits
                    </button>
                  </div>

                  {gerenciarKitsAberto && (
                    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-yellow-400">
                          Biblioteca de kits solares
                        </p>
                        <button
                          type="button"
                          onClick={() => setGerenciarKitsAberto(false)}
                          className="text-xs font-black uppercase text-zinc-400"
                        >
                          Fechar
                        </button>
                      </div>

                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {kitsDisponiveis.map((kit) => (
                          <div
                            key={kit.id}
                            className="rounded-xl border border-zinc-700 bg-black p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-white">{kit.nome}</p>
                                <p className="mt-1 text-xs text-zinc-400">
                                  {kit.geracao} kWh/mês · {kit.potencia} · {kit.valor || "Sem preço"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => editarKitSolar(kit)}
                                className="rounded-lg border border-yellow-400 px-2 py-2 text-[10px] font-black uppercase text-yellow-400"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicarKitSolar(kit)}
                                className="rounded-lg border border-zinc-600 px-2 py-2 text-[10px] font-black uppercase text-white"
                              >
                                Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => void excluirKitSolar(kit)}
                                className="rounded-lg border border-red-500/60 px-2 py-2 text-[10px] font-black uppercase text-red-400"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {kitEditando && (
                    <div className="rounded-2xl border border-yellow-400/50 bg-zinc-900 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-yellow-400">
                          {kitEditando.id ? "Editar kit" : "Novo kit"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setKitEditando(null)}
                          className="text-xs font-black uppercase text-zinc-400"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="mt-3 space-y-3">
                        <Campo
                          titulo="Nome do kit"
                          valor={kitEditando.nome}
                          aoAlterar={(v) =>
                            setKitEditando((anterior) =>
                              anterior ? { ...anterior, nome: v } : anterior,
                            )
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Campo
                            titulo="Geração kWh/mês"
                            valor={kitEditando.geracao}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior ? { ...anterior, geracao: v } : anterior,
                              )
                            }
                          />
                          <Campo
                            titulo="Potência kWp"
                            valor={kitEditando.potencia}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior ? { ...anterior, potencia: v } : anterior,
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Campo
                            titulo="Qtd. módulos"
                            valor={kitEditando.quantidadeModulos}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior
                                  ? { ...anterior, quantidadeModulos: v }
                                  : anterior,
                              )
                            }
                          />
                          <Select
                            titulo="Módulo"
                            valor={kitEditando.moduloId}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior ? { ...anterior, moduloId: v } : anterior,
                              )
                            }
                            opcoes={modulos.map((item) => ({
                              valor: item.id,
                              texto: `${item.marca} ${item.modelo} ${item.potencia}`,
                            }))}
                          />
                        </div>
                        <Select
                          titulo="Tipo de inversor"
                          valor={kitEditando.tipoInversor}
                          aoAlterar={(v) =>
                            setKitEditando((anterior) =>
                              anterior
                                ? {
                                    ...anterior,
                                    tipoInversor:
                                      v === "Microinversor"
                                        ? "Microinversor"
                                        : "String",
                                    inversorId: "",
                                  }
                                : anterior,
                            )
                          }
                          opcoes={[
                            { valor: "String", texto: "Inversor String" },
                            { valor: "Microinversor", texto: "Microinversor" },
                          ]}
                        />
                        <div className="grid grid-cols-[100px_1fr] gap-3">
                          <Campo
                            titulo="Quantidade"
                            valor={kitEditando.quantidadeInversores}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior
                                  ? { ...anterior, quantidadeInversores: v }
                                  : anterior,
                              )
                            }
                          />
                          <Select
                            titulo={
                              kitEditando.tipoInversor === "Microinversor"
                                ? "Microinversor"
                                : "Inversor"
                            }
                            valor={kitEditando.inversorId}
                            aoAlterar={(v) =>
                              setKitEditando((anterior) =>
                                anterior ? { ...anterior, inversorId: v } : anterior,
                              )
                            }
                            opcoes={
                              (kitEditando.tipoInversor === "Microinversor"
                                ? microinversores
                                : inversores
                              ).map((item) => ({
                                valor: item.id,
                                texto: `${item.marca} ${item.modelo} ${item.potencia}`,
                              }))
                            }
                          />
                        </div>
                        <Campo
                          titulo="Valor do kit"
                          valor={kitEditando.valor}
                          aoAlterar={(v) =>
                            setKitEditando((anterior) =>
                              anterior ? { ...anterior, valor: v } : anterior,
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() => void salvarKitSolar()}
                          disabled={salvandoKit}
                          className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black disabled:opacity-50"
                        >
                          {salvandoKit ? "Salvando kit..." : "💾 Salvar kit"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3"><Campo titulo="Geração/mês" valor={formulario.geracao} somenteLeitura={formulario.modoSistema === "kit"} aoAlterar={(v) => atualizarCampo("geracao", v)} /><Campo titulo="Potência" valor={formulario.modoSistema === "personalizado" ? potenciaCalculada : formulario.potencia} somenteLeitura aoAlterar={() => undefined} /></div>
              <div className="grid grid-cols-2 gap-3"><Campo titulo="Qtd. módulos" valor={formulario.quantidadeModulos} somenteLeitura={formulario.modoSistema === "kit"} aoAlterar={(v) => atualizarCampo("quantidadeModulos", v)} /><Select titulo="Tipo de inversor" valor={formulario.tipoInversor} aoAlterar={(v) => setFormulario((anterior) => ({ ...anterior, tipoInversor: v as Formulario["tipoInversor"], inversorId: "" }))} opcoes={[{ valor: "String", texto: "Inversor String" }, { valor: "Microinversor", texto: "Microinversor" }]} /></div>
              <SelectComAdicionar titulo="Módulo" valor={formulario.moduloId} aoAlterar={(v) => atualizarCampo("moduloId", v)} opcoes={modulos.map((item) => ({ valor: item.id, texto: `${item.marca} ${item.modelo} ${item.potencia}` }))} aoAdicionar={() => adicionarEquipamento("modulo")} />
              <div className="grid grid-cols-[100px_1fr] gap-3"><Campo titulo="Quantidade" valor={formulario.quantidadeInversores} aoAlterar={(v) => atualizarCampo("quantidadeInversores", v)} /><SelectComAdicionar titulo={formulario.tipoInversor === "Microinversor" ? "Microinversor" : "Inversor"} valor={formulario.inversorId} aoAlterar={(v) => atualizarCampo("inversorId", v)} opcoes={listaInversores.map((item) => ({ valor: item.id, texto: `${item.marca} ${item.modelo} ${item.potencia}` }))} aoAdicionar={() => adicionarEquipamento(formulario.tipoInversor === "Microinversor" ? "microinversor" : "inversor")} /></div>
              <Campo titulo="Valor da proposta" valor={formulario.valorProposta} aoAlterar={(v) => atualizarCampo("valorProposta", v)} />
            </SecaoFormulario>

            <SecaoFormulario titulo="Pagamento">
              <p className="text-xs leading-relaxed text-zinc-400">Os percentuais aparecem somente no gerador. O cliente verá o valor final e as parcelas.</p>
              <PagamentoFormulario titulo="Cartão" percentual={formulario.percentualCartao} parcelas={formulario.parcelasCartao} parcelaCalculada={calculos.parcelaCartao} aoPercentual={(v) => atualizarCampo("percentualCartao", v)} aoParcelas={(v) => atualizarCampo("parcelasCartao", v)} />
              <PagamentoFormulario titulo="Financiamento" percentual={formulario.percentualFinanciamento} parcelas={formulario.parcelasFinanciamento} parcelaCalculada={calculos.parcelaFinanciamento} aoPercentual={(v) => atualizarCampo("percentualFinanciamento", v)} aoParcelas={(v) => atualizarCampo("parcelasFinanciamento", v)} />
            </SecaoFormulario>

            <SecaoFormulario titulo="Rodapé da proposta">
              <Campo titulo="Endereço da loja CHOQUESEG" valor={formulario.enderecoLoja} aoAlterar={(v) => atualizarCampo("enderecoLoja", v)} />
              <p className="text-xs leading-relaxed text-zinc-400">Este campo é somente o endereço da loja da CHOQUESEG. Ele fica salvo neste computador e aparece automaticamente no rodapé das duas páginas. Não usa o endereço do cliente.</p>
            </SecaoFormulario>

            <SecaoFormulario titulo="Garantias">
              <div className="grid grid-cols-2 gap-3">
                <Campo titulo="Desempenho do módulo (anos)" valor={formulario.garantiaDesempenhoModulo} aoAlterar={(v) => atualizarCampo("garantiaDesempenhoModulo", v)} />
                <Campo titulo="Garantia do módulo (anos)" valor={formulario.garantiaModulo} aoAlterar={(v) => atualizarCampo("garantiaModulo", v)} />
                <Campo titulo="Garantia do inversor (anos)" valor={formulario.garantiaInversor} aoAlterar={(v) => atualizarCampo("garantiaInversor", v)} />
                <Campo titulo="Garantia da instalação (anos)" valor={formulario.garantiaInstalacao} aoAlterar={(v) => atualizarCampo("garantiaInstalacao", v)} />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">Os valores são editáveis para acompanhar exatamente as garantias dos equipamentos selecionados na proposta.</p>
            </SecaoFormulario>

            <SecaoFormulario titulo="Fotos das instalações">
              <div className="rounded-2xl border border-yellow-400 bg-yellow-400/10 p-3">
                <p className="text-sm font-black uppercase text-yellow-400">
                  Escolha as fotos que aparecerão nesta proposta
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  Em cada bloco, selecione uma foto do celular, informe a cidade/local e escreva a descrição da instalação.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Escolha até quatro fotos do celular e informe o local e a descrição.
                As imagens são reduzidas automaticamente para o PDF não travar.
              </p>

              <div className="space-y-4">
                {instalacoes.map((instalacao, indice) => (
                  <div
                    key={indice}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3"
                  >
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-yellow-400">
                      Instalação {indice + 1}
                    </p>

                    <label className="block cursor-pointer">
                      <span className="mb-2 block rounded-xl border border-dashed border-yellow-400/70 bg-black px-3 py-3 text-center text-sm font-black uppercase text-yellow-400">
                        {processandoFoto === indice
                          ? "Processando foto..."
                          : instalacao.foto
                            ? "Trocar foto"
                            : "Escolher foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={processandoFoto !== null}
                        onChange={(evento) => {
                          const arquivo = evento.target.files?.[0];
                          void escolherFoto(indice, arquivo);
                          evento.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {instalacao.foto && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700">
                        <img
                          src={instalacao.foto}
                          alt={`Prévia da instalação ${indice + 1}`}
                          className="aspect-[16/7] w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removerFoto(indice)}
                          className="w-full bg-red-700 px-3 py-2 text-xs font-black uppercase text-white"
                        >
                          Remover foto
                        </button>
                      </div>
                    )}

                    <div className="mt-3 space-y-3">
                      <Campo
                        titulo="Cidade / local"
                        valor={instalacao.cidade}
                        aoAlterar={(valor) => atualizarInstalacao(indice, "cidade", valor)}
                      />
                      <Campo
                        titulo="Descrição"
                        valor={instalacao.descricao}
                        aoAlterar={(valor) => atualizarInstalacao(indice, "descricao", valor)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SecaoFormulario>
          </div>
        </aside>
        <section
          ref={previewAreaRef}
          className={`min-w-0 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-2 ${
            modoVisualizacaoSolar === "formulario" ? "hidden" : "block"
          } ${
            modoVisualizacaoSolar === "dividido"
              ? "h-[72dvh] min-h-[520px] overflow-auto overscroll-contain"
              : "mx-auto w-full max-w-[1100px] overflow-visible"
          }`}
        >
          <div className="flex w-full justify-center overflow-visible">
            <div
              className="w-[794px] origin-top"
              style={{ zoom: escalaPreview } as CSSProperties}
            >
              <PreviewProposta ref={previewRef} dados={dadosPreview} />
            </div>
          </div>
        </section>
        <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0 w-[794px] bg-white">
          <PreviewProposta ref={previewCelularRef} dados={dadosPreview} />
        </div>
      </div>
          {previewPdfSolarAberto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-2 md:p-5">
          <div className="flex h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
              <div>
                <h2 className="text-lg font-black uppercase text-yellow-400">Proposta de Energia Solar</h2>
                <p className="text-xs text-zinc-400">
                  Confira o PDF. Este mesmo arquivo será usado para imprimir, baixar ou enviar.
                </p>
              </div>
              <button type="button" onClick={() => setPreviewPdfSolarAberto(false)} className="rounded-xl border border-zinc-700 px-4 py-2 font-black text-white">
                ✕ Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-zinc-800 p-2 md:p-4">
              {previewPdfSolarUrl && (
                <iframe
                  title="Pré-visualização da proposta de Energia Solar"
                  src={previewPdfSolarUrl}
                  className="h-full min-h-[65vh] w-full rounded-lg bg-white"
                />
              )}
            </div>

            <div className="grid gap-2 border-t border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-3">
              <button type="button" onClick={imprimirPdfSolarVisualizado} className="rounded-xl bg-white px-4 py-3 font-black uppercase text-black">
                🖨️ Imprimir
              </button>
              <button type="button" onClick={baixarPdfSolarVisualizado} className="rounded-xl border border-yellow-400 px-4 py-3 font-black uppercase text-yellow-300">
                ⬇️ Baixar PDF
              </button>
              <button
                type="button"
                onClick={() => previewPdfSolarBlob && void compartilharPdfSolar(previewPdfSolarBlob)}
                className="rounded-xl bg-green-600 px-4 py-4 font-black uppercase text-white"
              >
                📲 Enviar ao cliente
              </button>
            </div>
          </div>
        </div>
      )}

</main>
  );
}

function SecaoFormulario({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <section className="space-y-3 border-t border-zinc-800 pt-5 first:border-t-0 first:pt-0"><h2 className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">{titulo}</h2>{children}</section>; }
function Campo({ titulo, valor, aoAlterar, somenteLeitura = false }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; somenteLeitura?: boolean }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-zinc-200">{titulo}</span><input type="text" value={valor} readOnly={somenteLeitura} autoComplete="off" onChange={(e) => aoAlterar(e.target.value)} className={`w-full rounded-xl border px-3 py-3 text-white outline-none ${somenteLeitura ? "cursor-not-allowed border-zinc-800 bg-zinc-800 text-zinc-400" : "border-zinc-700 bg-zinc-900 focus:border-yellow-400"}`} /></label>; }
function Select({ titulo, valor, aoAlterar, opcoes }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; opcoes: { valor: string; texto: string }[] }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-zinc-200">{titulo}</span><select value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"><option value="">Selecione</option>{opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.texto}</option>)}</select></label>; }
function SelectComAdicionar({ titulo, valor, aoAlterar, opcoes, aoAdicionar }: { titulo: string; valor: string; aoAlterar: (valor: string) => void; opcoes: { valor: string; texto: string }[]; aoAdicionar: () => void }) { return <div><div className="mb-1.5 flex items-center justify-between gap-2"><span className="text-sm font-bold text-zinc-200">{titulo}</span><button type="button" onClick={aoAdicionar} className="text-xs font-black uppercase text-yellow-400 hover:text-yellow-300">+ Adicionar</button></div><select value={valor} onChange={(e) => aoAlterar(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-yellow-400"><option value="">Selecione</option>{opcoes.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.texto}</option>)}</select></div>; }
function PagamentoFormulario({ titulo, percentual, parcelas, parcelaCalculada, aoPercentual, aoParcelas }: { titulo: string; percentual: string; parcelas: string; parcelaCalculada: number; aoPercentual: (valor: string) => void; aoParcelas: (valor: string) => void }) { return <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3"><p className="mb-3 font-black uppercase text-yellow-400">{titulo}</p><div className="grid grid-cols-2 gap-3"><Campo titulo="Acréscimo %" valor={percentual} aoAlterar={aoPercentual} /><Campo titulo="Parcelas" valor={parcelas} aoAlterar={aoParcelas} /></div><p className="mt-3 text-sm font-bold">{Math.max(Math.round(numero(parcelas)), 1)}x de <span className="text-yellow-400">{parcelaCalculada > 0 ? dinheiro(parcelaCalculada) : "—"}</span></p></div>; }
function BotaoModo({ ativo, texto, aoClicar }: { ativo: boolean; texto: string; aoClicar: () => void }) { return <button type="button" onClick={aoClicar} className={`rounded-xl border px-3 py-3 text-sm font-black uppercase ${ativo ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-700 bg-zinc-900 text-white"}`}>{texto}</button>; }