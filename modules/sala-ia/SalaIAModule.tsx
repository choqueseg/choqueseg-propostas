"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ReconhecimentoVoz = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: any) => void) | null;
  onerror: ((evento: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type ConstrutorReconhecimentoVoz = new () => ReconhecimentoVoz;

type AbaSalaIA = "criar" | "personagens" | "roteiros" | "vozes" | "videos";

type PersonagemIA = {
  id: string;
  nome: string;
  funcao: string;
  area: string;
  aparencia: string;
  roupa: string;
  voz: string;
  observacoes: string;
  imagemReferencia: string;
  imagemDataUrl?: string;
  principal: boolean;
};

type CenarioIA = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
};

type PerfilVozIA = {
  personagemId: string;
  idioma: string;
  generoTimbre: string;
  estilo: string;
  velocidade: string;
  pronuncia: string;
  falaLiteral: boolean;
};

type ProjetoVideoSalvo = {
  id: string;
  titulo: string;
  categoria: string;
  personagem: string;
  cenario: string;
  figurino: string;
  duracaoTotal: number;
  roteiro: string;
  cenas: CenaOperacional[];
  status: "Preparado" | "Em produção" | "Concluído";
  criadoEm: string;
  atualizadoEm: string;
  personagemId?: string;
  perfilVoz?: PerfilVozIA | null;
  aprovadoGeracao?: boolean;
  geracaoCompletaPreparada?: boolean;
};


type RoteiroSalvo = {
  id: string;
  titulo: string;
  categoria: string;
  personagemId: string;
  personagemNome: string;
  cenarioId: string;
  cenarioNome: string;
  tipoHistoria: string;
  figurino: string;
  objetivo: string;
  roteiro: string;
  criadoEm: string;
  atualizadoEm: string;
};

type RascunhoSalaIA = {
  id: string;
  titulo: string;
  ideia: string;
  roteiro: string;
  atualizadoEm: string;
};

type CenaOperacional = {
  id: string;
  numero: number;
  titulo: string;
  personagem: string;
  cenario: string;
  figurino: string;
  fala: string;
  acao: string;
  textoTela: string;
  enquadramento: string;
  duracao: string;
};


const CENARIOS_INICIAIS: CenarioIA[] = [
  { id: "ia-escolhe", nome: "✨ IA escolher automaticamente", tipo: "Automático", descricao: "A IA escolhe o ambiente mais adequado à história." },
  { id: "casa-confortavel", nome: "🏡 Casa confortável", tipo: "Residencial", descricao: "Casa moderna e confortável, adequada para cenas de família, economia e qualidade de vida." },
  { id: "casa-piscina", nome: "🏊 Casa com piscina", tipo: "Residencial", descricao: "Residência de bom padrão com piscina e área de lazer." },
  { id: "casa-campo", nome: "🌳 Casa de campo", tipo: "Residencial rural", descricao: "Casa em ambiente verde, tranquilo e familiar." },
  { id: "fazenda", nome: "🚜 Fazenda / sítio", tipo: "Rural", descricao: "Propriedade rural com possibilidade de bombas, tanques, criação e equipamentos elétricos." },
  { id: "mercadinho", nome: "🛒 Mercadinho", tipo: "Comercial", descricao: "Pequeno comércio com freezers, iluminação e consumo constante de energia." },
  { id: "deposito-bebidas", nome: "🥤 Depósito de bebidas", tipo: "Comercial", descricao: "Depósito com geladeiras, freezers e estoque de bebidas." },
  { id: "empresa", nome: "🏢 Empresa / escritório", tipo: "Comercial", descricao: "Ambiente empresarial profissional com climatização e equipamentos." },
  { id: "restaurante", nome: "🍽️ Restaurante", tipo: "Comercial", descricao: "Restaurante com cozinha, refrigeração, climatização e atendimento." },
  { id: "loja-choqueseg", nome: "⚡ Loja CHOQUESEG", tipo: "Institucional", descricao: "Ambiente institucional da CHOQUESEG para apresentações e chamadas comerciais." },
];

const FIGURINOS = [
  "✨ IA escolher",
  "Uniforme CHOQUESEG manga longa",
  "Uniforme CHOQUESEG técnico",
  "Camisa social",
  "Terno e gravata",
  "Roupa casual",
];


const CATEGORIAS = [
  "Energia Solar",
  "Segurança Eletrônica",
  "Automação",
  "Elétrica",
  "Institucional",
  "Promoção / Oferta",
];

const CHAVE_PERSONAGENS = "choqueseg-sala-ia-personagens";
const CHAVE_ROTEIROS = "choqueseg-sala-ia-roteiros";
const CHAVE_RASCUNHO_ROTEIRO = "choqueseg-sala-ia-rascunho-atual";
const CHAVE_HISTORICO_RASCUNHOS = "choqueseg-sala-ia-historico-rascunhos";
const CHAVE_VOZES = "choqueseg-sala-ia-vozes";
const CHAVE_PROJETOS_VIDEO = "choqueseg-sala-ia-projetos-video";

// Segurança: mantenha false enquanto não quiser permitir consumo de créditos.
const GERACAO_VIDEO_COMPLETO_LIBERADA = false;

const PERSONAGENS_INICIAIS: PersonagemIA[] = [
  {
    id: "apresentador-choqueseg",
    nome: "Apresentador CHOQUESEG",
    funcao: "Garoto-propaganda principal",
    area: "Geral",
    aparencia: "Apresentador profissional, simpático e confiável.",
    roupa: "Uniforme preto oficial da CHOQUESEG com detalhes amarelos.",
    voz: "Masculina, segura, comercial e natural.",
    observacoes:
      "Usar como personagem principal em campanhas institucionais e comerciais.",
    imagemReferencia: "",
    principal: true,
  },
  {
    id: "especialista-solar",
    nome: "Especialista Solar",
    funcao: "Especialista em Energia Solar",
    area: "Energia Solar",
    aparencia: "Especialista técnico, postura profissional e acessível.",
    roupa: "Uniforme preto CHOQUESEG, visual técnico/comercial.",
    voz: "Masculina, didática e convincente.",
    observacoes:
      "Focado em economia, geração de energia e benefícios do sistema solar.",
    imagemReferencia: "",
    principal: false,
  },
];

function criarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `personagem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function estimarSegundos(duracao: string) {
  const numeros = (duracao.match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((valor) => Number(valor.replace(",", ".")))
    .filter((valor) => Number.isFinite(valor));

  if (numeros.length === 0) return 0;
  if (numeros.length === 1) return numeros[0];

  return (numeros[0] + numeros[1]) / 2;
}

export default function SalaIAModule() {
  const [aba, setAba] = useState<AbaSalaIA>("criar");
  const [categoria, setCategoria] = useState("Energia Solar");
  const [personagemSelecionadoId, setPersonagemSelecionadoId] = useState(
    PERSONAGENS_INICIAIS[0].id,
  );
  const [objetivo, setObjetivo] = useState("");
  const [roteiro, setRoteiro] = useState("");
  const [cenarioSelecionadoId, setCenarioSelecionadoId] = useState("ia-escolhe");
  const [tipoHistoria, setTipoHistoria] = useState("Fictícia");
  const [figurino, setFigurino] = useState("✨ IA escolher");
  const [personagensCenaIds, setPersonagensCenaIds] = useState<string[]>([]);
  const [fotoMomento, setFotoMomento] = useState("");
  const [tituloRoteiro, setTituloRoteiro] = useState("");
  const editorRoteiroRef = useRef<HTMLDivElement | null>(null);
  const [roteirosSalvos, setRoteirosSalvos] = useState<RoteiroSalvo[]>([]);
  const [roteiroEditandoId, setRoteiroEditandoId] = useState<string | null>(null);
  const [historicoRascunhos, setHistoricoRascunhos] = useState<RascunhoSalaIA[]>([]);
  const rascunhoCarregadoRef = useRef(false);
  const [mensagemRoteiro, setMensagemRoteiro] = useState("");

  const [ouvindoIdeia, setOuvindoIdeia] = useState(false);
  const [mensagemVoz, setMensagemVoz] = useState("");
  const [reconhecimentoVoz, setReconhecimentoVoz] =
    useState<ReconhecimentoVoz | null>(null);
  const [corrigindoComIA, setCorrigindoComIA] = useState(false);
  const [mensagemIA, setMensagemIA] = useState("");
  const [gerandoRoteiroIA, setGerandoRoteiroIA] = useState(false);
  const [mensagemGeracaoIA, setMensagemGeracaoIA] = useState("");
  const [cenasOperacionais, setCenasOperacionais] = useState<CenaOperacional[]>([]);
  const [mensagemCenas, setMensagemCenas] = useState("");
  const [cenasExpandidas, setCenasExpandidas] = useState<Record<string, boolean>>({});
  const [videosGerando, setVideosGerando] = useState<Record<string, boolean>>({});
  const [mensagensVideo, setMensagensVideo] = useState<Record<string, string>>({});
  const [videosCena, setVideosCena] = useState<Record<string, string>>({});

  const [perfisVoz, setPerfisVoz] = useState<Record<string, PerfilVozIA>>({});
  const [mensagemVozConfig, setMensagemVozConfig] = useState("");
  const [projetosVideo, setProjetosVideo] = useState<ProjetoVideoSalvo[]>([]);
  const [projetoVideoAbertoId, setProjetoVideoAbertoId] = useState<string | null>(null);
  const [mensagemProjetosVideo, setMensagemProjetosVideo] = useState("");
  const [previaProjetoAberta, setPreviaProjetoAberta] = useState(false);
  const [indiceCenaPrevia, setIndiceCenaPrevia] = useState(0);
  const [projetoAprovadoGeracao, setProjetoAprovadoGeracao] = useState(false);
  const [gerandoVideoCompleto, setGerandoVideoCompleto] = useState(false);
  const [mensagemVideoCompleto, setMensagemVideoCompleto] = useState("");
  const [progressoVideoCompleto, setProgressoVideoCompleto] = useState(0);
  const [videoCompletoUrl, setVideoCompletoUrl] = useState("");
  const [videoCompletoId, setVideoCompletoId] = useState("");





  const [personagens, setPersonagens] =
    useState<PersonagemIA[]>(PERSONAGENS_INICIAIS);
  const [formPersonagemAberto, setFormPersonagemAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [funcaoPersonagem, setFuncaoPersonagem] = useState("");
  const [areaPersonagem, setAreaPersonagem] = useState("Geral");
  const [aparenciaPersonagem, setAparenciaPersonagem] = useState("");
  const [roupaPersonagem, setRoupaPersonagem] = useState(
    "Uniforme preto oficial da CHOQUESEG com detalhes amarelos.",
  );
  const [vozPersonagem, setVozPersonagem] = useState("");
  const [observacoesPersonagem, setObservacoesPersonagem] = useState("");
  const [imagemReferenciaPersonagem, setImagemReferenciaPersonagem] =
    useState("");
  const [imagemDataUrlPersonagem, setImagemDataUrlPersonagem] = useState("");

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_PERSONAGENS);
      if (!salvo) return;

      const lista = JSON.parse(salvo) as PersonagemIA[];
      if (!Array.isArray(lista) || lista.length === 0) return;

      setPersonagens(lista);

      const principal = lista.find((item) => item.principal) ?? lista[0];
      setPersonagemSelecionadoId(principal.id);
    } catch (erro) {
      console.error("Erro ao carregar personagens da Sala IA:", erro);
    }
  }, []);


  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_PROJETOS_VIDEO);
      if (!salvo) return;
      const lista = JSON.parse(salvo) as ProjetoVideoSalvo[];
      if (Array.isArray(lista)) setProjetosVideo(lista);
    } catch (erro) {
      console.error("Erro ao carregar projetos de vídeo:", erro);
    }
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_VOZES);
      if (!salvo) return;
      const dados = JSON.parse(salvo);
      if (dados && typeof dados === "object") {
        setPerfisVoz(dados);
      }
    } catch (erro) {
      console.error("Erro ao carregar vozes da Sala IA:", erro);
    }
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_ROTEIROS);
      if (!salvo) return;

      const lista = JSON.parse(salvo) as RoteiroSalvo[];
      if (!Array.isArray(lista)) return;

      setRoteirosSalvos(lista);
    } catch (erro) {
      console.error("Erro ao carregar roteiros da Sala IA:", erro);
    }
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_HISTORICO_RASCUNHOS);
      if (!salvo) return;

      const lista = JSON.parse(salvo) as RascunhoSalaIA[];
      if (Array.isArray(lista)) {
        setHistoricoRascunhos(lista.slice(0, 10));
      }
    } catch (erro) {
      console.error("Erro ao carregar histórico de rascunhos:", erro);
    }
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_RASCUNHO_ROTEIRO);

      if (salvo) {
        const rascunho = JSON.parse(salvo);

        if (typeof rascunho?.roteiro === "string") {
          setRoteiro(rascunho.roteiro);
        }
        if (typeof rascunho?.ideia === "string") {
          setObjetivo(rascunho.ideia);
        }
        if (typeof rascunho?.tituloRoteiro === "string") {
          setTituloRoteiro(rascunho.tituloRoteiro);
        }
        if (typeof rascunho?.objetivo === "string") {
          setObjetivo(rascunho.objetivo);
        }
        if (typeof rascunho?.categoria === "string") {
          setCategoria(rascunho.categoria);
        }
        if (typeof rascunho?.cenarioSelecionadoId === "string") {
          setCenarioSelecionadoId(rascunho.cenarioSelecionadoId);
        }
        if (typeof rascunho?.tipoHistoria === "string") {
          setTipoHistoria(rascunho.tipoHistoria);
        }
        if (typeof rascunho?.figurino === "string") {
          setFigurino(rascunho.figurino);
        }
        if (typeof rascunho?.personagemSelecionadoId === "string") {
          setPersonagemSelecionadoId(rascunho.personagemSelecionadoId);
        }
        if (
          rascunho?.roteiroEditandoId === null ||
          typeof rascunho?.roteiroEditandoId === "string"
        ) {
          setRoteiroEditandoId(rascunho.roteiroEditandoId);
        }
      }
    } catch (erro) {
      console.error("Erro ao restaurar rascunho da Sala IA:", erro);
    } finally {
      rascunhoCarregadoRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!rascunhoCarregadoRef.current) return;

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          CHAVE_RASCUNHO_ROTEIRO,
          JSON.stringify({
            tituloRoteiro,
            roteiro,
            ideia: objetivo,
            objetivo,
            categoria,
            cenarioSelecionadoId,
            tipoHistoria,
            figurino,
            personagemSelecionadoId,
            roteiroEditandoId,
            atualizadoEm: new Date().toISOString(),
          }),
        );
      } catch (erro) {
        console.error("Erro ao salvar rascunho da Sala IA:", erro);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    tituloRoteiro,
    roteiro,
    objetivo,
    categoria,
    cenarioSelecionadoId,
    tipoHistoria,
    figurino,
    personagemSelecionadoId,
    roteiroEditandoId,
  ]);

  function perfilVozDoPersonagem(personagemId: string): PerfilVozIA {
    const personagem = personagens.find((item) => item.id === personagemId);

    return (
      perfisVoz[personagemId] ?? {
        personagemId,
        idioma: "Português do Brasil (pt-BR)",
        generoTimbre: personagem?.voz || "Masculina, segura, comercial e natural.",
        estilo: "Comercial natural e convincente",
        velocidade: "Normal",
        pronuncia: "Pronunciar CHOQUESEG de forma clara e natural.",
        falaLiteral: true,
      }
    );
  }

  function atualizarPerfilVoz(
    personagemId: string,
    campo: keyof Omit<PerfilVozIA, "personagemId">,
    valor: string | boolean,
  ) {
    setPerfisVoz((atuais) => {
      const atual = perfilVozDoPersonagem(personagemId);
      return {
        ...atuais,
        [personagemId]: {
          ...atual,
          [campo]: valor,
        },
      };
    });
    setMensagemVozConfig("");
  }

  function salvarPerfisVoz() {
    try {
      const completos = { ...perfisVoz };

      personagens.forEach((personagem) => {
        if (!completos[personagem.id]) {
          completos[personagem.id] = perfilVozDoPersonagem(personagem.id);
        }
      });

      setPerfisVoz(completos);
      localStorage.setItem(CHAVE_VOZES, JSON.stringify(completos));
      setMensagemVozConfig("Configurações de voz salvas neste dispositivo.");
    } catch (erro) {
      console.error("Erro ao salvar vozes da Sala IA:", erro);
      setMensagemVozConfig("Não foi possível salvar as configurações de voz.");
    }
  }

  function persistirProjetosVideo(lista: ProjetoVideoSalvo[]) {
    setProjetosVideo(lista);
    localStorage.setItem(CHAVE_PROJETOS_VIDEO, JSON.stringify(lista));
  }

  function salvarProjetoVideoAtual() {
    setMensagemProjetosVideo("");

    if (cenasOperacionais.length === 0) {
      setMensagemProjetosVideo("Transforme o roteiro em cenas antes de salvar o projeto de vídeo.");
      return;
    }

    const agora = new Date().toISOString();
    const titulo =
      tituloRoteiro.trim() ||
      objetivo.trim().slice(0, 70) ||
      `Projeto de vídeo ${new Date().toLocaleDateString("pt-BR")}`;

    const existente = projetoVideoAbertoId
      ? projetosVideo.find((item) => item.id === projetoVideoAbertoId)
      : undefined;

    const novo: ProjetoVideoSalvo = {
      id: existente?.id || `video-projeto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      titulo,
      categoria,
      personagem: projetoVideoCompleto.personagemBase,
      cenario: projetoVideoCompleto.cenarioPrincipal,
      figurino: projetoVideoCompleto.figurinoBase,
      duracaoTotal: projetoVideoCompleto.duracaoTotal,
      roteiro,
      cenas: cenasOperacionais,
      status: "Preparado",
      criadoEm: existente?.criadoEm || agora,
      atualizadoEm: agora,
      personagemId: personagemAtual?.id || "",
      perfilVoz: personagemAtual ? perfilVozDoPersonagem(personagemAtual.id) : null,
      aprovadoGeracao: Boolean(projetoAprovadoGeracao),
      geracaoCompletaPreparada: true,
    };

    const novaLista = existente
      ? projetosVideo.map((item) => (item.id === existente.id ? novo : item))
      : [novo, ...projetosVideo];

    persistirProjetosVideo(novaLista);
    setProjetoVideoAbertoId(novo.id);
    setMensagemProjetosVideo(
      existente ? "Projeto atualizado em Meus Vídeos." : "Projeto de vídeo salvo em Meus Vídeos.",
    );
  }

  function abrirProjetoVideo(item: ProjetoVideoSalvo) {
    setProjetoVideoAbertoId(item.id);
    setTituloRoteiro(item.titulo);
    setCategoria(item.categoria);
    setRoteiro(item.roteiro);
    setCenasOperacionais(item.cenas);

    if (item.personagemId) {
      const existe = personagens.some((personagem) => personagem.id === item.personagemId);
      if (existe) setPersonagemSelecionadoId(item.personagemId);
    }

    if (item.personagemId && item.perfilVoz) {
      setPerfisVoz((atuais) => ({
        ...atuais,
        [item.personagemId as string]: item.perfilVoz as PerfilVozIA,
      }));
    }

    setProjetoAprovadoGeracao(Boolean(item.aprovadoGeracao));

    const mapa: Record<string, boolean> = {};
    item.cenas.forEach((cena) => {
      mapa[cena.id] = true;
    });
    setCenasExpandidas(mapa);

    setAba("roteiros");
    setMensagemCenas(`${item.cenas.length} cenas restauradas do projeto de vídeo.`);

    window.setTimeout(() => {
      editorRoteiroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function excluirProjetoVideo(id: string) {
    if (projetoVideoAbertoId === id) setProjetoVideoAbertoId(null);
    persistirProjetosVideo(projetosVideo.filter((item) => item.id !== id));
  }

  function salvarPersonagens(lista: PersonagemIA[]) {
    setPersonagens(lista);
    localStorage.setItem(CHAVE_PERSONAGENS, JSON.stringify(lista));
  }

  const personagemAtual = useMemo(
    () =>
      personagens.find((item) => item.id === personagemSelecionadoId) ??
      personagens[0] ??
      null,
    [personagens, personagemSelecionadoId],
  );

  const projetoVideoCompleto = useMemo(() => {
    const cenarioGlobal =
      CENARIOS_INICIAIS.find((item) => item.id === cenarioSelecionadoId)?.nome ??
      "IA escolher automaticamente";

    const personagemBase =
      personagemAtual?.nome ||
      cenasOperacionais[0]?.personagem ||
      "Apresentador CHOQUESEG";

    const figurinoBase =
      personagemAtual?.roupa ||
      (figurino !== "✨ IA escolher" ? figurino : "") ||
      cenasOperacionais[0]?.figurino ||
      "Uniforme oficial CHOQUESEG";

    const duracaoTotal = cenasOperacionais.reduce(
      (total, cena) => total + estimarSegundos(cena.duracao),
      0,
    );

    return {
      personagemBase,
      cenarioPrincipal:
        cenarioGlobal === "✨ IA escolher automaticamente"
          ? cenasOperacionais[0]?.cenario || cenarioGlobal
          : cenarioGlobal,
      figurinoBase,
      duracaoTotal,
    };
  }, [
    cenasOperacionais,
    cenarioSelecionadoId,
    personagemAtual,
    figurino,
  ]);

  const validacaoProjetoVideo = useMemo(() => {
    const problemas: string[] = [];

    if (cenasOperacionais.length === 0) {
      problemas.push("O projeto ainda não possui cenas operacionais.");
    }

    if (!personagemAtual) {
      problemas.push("Nenhum personagem-base está selecionado.");
    } else if (!personagemAtual.imagemDataUrl) {
      problemas.push(`O personagem-base “${personagemAtual.nome}” está sem foto de referência.`);
    }

    cenasOperacionais.forEach((cena) => {
      const prefixo = `Cena ${cena.numero}`;
      if (!cena.personagem?.trim()) problemas.push(`${prefixo}: personagem não definido.`);
      if (!cena.cenario?.trim()) problemas.push(`${prefixo}: cenário não definido.`);
      if (!cena.figurino?.trim()) problemas.push(`${prefixo}: figurino não definido.`);
      if (!cena.enquadramento?.trim()) problemas.push(`${prefixo}: enquadramento não definido.`);
      if (!cena.acao?.trim()) problemas.push(`${prefixo}: ação/direção não definida.`);
      if (!cena.duracao?.trim()) problemas.push(`${prefixo}: duração não definida.`);
      const fala = cena.fala?.trim() || "";
      if (!fala || fala.toLowerCase() === "sem fala definida.") {
        problemas.push(`${prefixo}: fala não definida.`);
      }
    });

    const nomesPersonagens = new Set(
      cenasOperacionais.map((cena) => cena.personagem.trim()).filter(Boolean),
    );
    if (nomesPersonagens.size > 1) {
      problemas.push("Continuidade: existem personagens diferentes entre as cenas.");
    }

    const figurinos = new Set(
      cenasOperacionais.map((cena) => cena.figurino.trim()).filter(Boolean),
    );
    if (figurinos.size > 1) {
      problemas.push("Continuidade: existem figurinos diferentes entre as cenas.");
    }

    return { aprovado: problemas.length === 0, problemas };
  }, [cenasOperacionais, personagemAtual]);



  function limparFormularioPersonagem() {
    setEditandoId(null);
    setNomePersonagem("");
    setFuncaoPersonagem("");
    setAreaPersonagem("Geral");
    setAparenciaPersonagem("");
    setRoupaPersonagem(
      "Uniforme preto oficial da CHOQUESEG com detalhes amarelos.",
    );
    setVozPersonagem("");
    setObservacoesPersonagem("");
    setImagemReferenciaPersonagem("");
    setImagemDataUrlPersonagem("");
  }

  function abrirNovoPersonagem() {
    limparFormularioPersonagem();
    setFormPersonagemAberto(true);
  }

  function editarPersonagem(item: PersonagemIA) {
    setEditandoId(item.id);
    setNomePersonagem(item.nome);
    setFuncaoPersonagem(item.funcao);
    setAreaPersonagem(item.area);
    setAparenciaPersonagem(item.aparencia);
    setRoupaPersonagem(item.roupa);
    setVozPersonagem(item.voz);
    setObservacoesPersonagem(item.observacoes);
    setImagemReferenciaPersonagem(item.imagemReferencia);
    setImagemDataUrlPersonagem(item.imagemDataUrl || "");
    setFormPersonagemAberto(true);
  }

  function escolherImagemPersonagem(arquivo?: File) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return;
    if (arquivo.size > 5 * 1024 * 1024) {
      window.alert("A imagem deve ter no máximo 5 MB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";
      setImagemDataUrlPersonagem(resultado);
      setImagemReferenciaPersonagem(arquivo.name);
    };
    leitor.readAsDataURL(arquivo);
  }

  function removerImagemPersonagem() {
    setImagemDataUrlPersonagem("");
    setImagemReferenciaPersonagem("");
  }

  function salvarPersonagem() {
    if (!nomePersonagem.trim()) return;

    if (editandoId) {
      const novaLista = personagens.map((item) =>
        item.id === editandoId
          ? {
              ...item,
              nome: nomePersonagem.trim(),
              funcao: funcaoPersonagem.trim(),
              area: areaPersonagem,
              aparencia: aparenciaPersonagem.trim(),
              roupa: roupaPersonagem.trim(),
              voz: vozPersonagem.trim(),
              observacoes: observacoesPersonagem.trim(),
              imagemReferencia: imagemReferenciaPersonagem.trim(),
              imagemDataUrl: imagemDataUrlPersonagem,
            }
          : item,
      );

      salvarPersonagens(novaLista);
    } else {
      const novo: PersonagemIA = {
        id: criarId(),
        nome: nomePersonagem.trim(),
        funcao: funcaoPersonagem.trim(),
        area: areaPersonagem,
        aparencia: aparenciaPersonagem.trim(),
        roupa: roupaPersonagem.trim(),
        voz: vozPersonagem.trim(),
        observacoes: observacoesPersonagem.trim(),
        imagemReferencia: imagemReferenciaPersonagem.trim(),
        principal: personagens.length === 0,
      };

      salvarPersonagens([...personagens, novo]);

      if (personagens.length === 0) {
        setPersonagemSelecionadoId(novo.id);
      }
    }

    setFormPersonagemAberto(false);
    limparFormularioPersonagem();
  }

  function definirPrincipal(id: string) {
    const novaLista = personagens.map((item) => ({
      ...item,
      principal: item.id === id,
    }));

    salvarPersonagens(novaLista);
    setPersonagemSelecionadoId(id);
  }

  function excluirPersonagem(id: string) {
    if (personagens.length <= 1) return;

    const atual = personagens.find((item) => item.id === id);
    let novaLista = personagens.filter((item) => item.id !== id);

    if (atual?.principal && novaLista.length > 0) {
      novaLista = novaLista.map((item, indice) => ({
        ...item,
        principal: indice === 0,
      }));
    }

    salvarPersonagens(novaLista);

    if (personagemSelecionadoId === id) {
      const novoSelecionado =
        novaLista.find((item) => item.principal) ?? novaLista[0];
      setPersonagemSelecionadoId(novoSelecionado.id);
    }
  }

  function persistirRoteiros(lista: RoteiroSalvo[]) {
    setRoteirosSalvos(lista);
    localStorage.setItem(CHAVE_ROTEIROS, JSON.stringify(lista));
  }

  function salvarRoteiroAtual() {
    setMensagemRoteiro("");

    const texto = roteiro.trim();
    if (!texto) {
      setMensagemRoteiro("Escreva ou crie um roteiro antes de salvar.");
      return;
    }

    const titulo =
      tituloRoteiro.trim() ||
      objetivo.trim().slice(0, 70) ||
      `Roteiro ${new Date().toLocaleDateString("pt-BR")}`;

    const cenario = CENARIOS_INICIAIS.find(
      (item) => item.id === cenarioSelecionadoId,
    );

    const agora = new Date().toISOString();

    if (roteiroEditandoId) {
      const novaLista = roteirosSalvos.map((item) =>
        item.id === roteiroEditandoId
          ? {
              ...item,
              titulo,
              categoria,
              personagemId: personagemAtual?.id ?? "",
              personagemNome: personagemAtual?.nome ?? "Não selecionado",
              cenarioId: cenarioSelecionadoId,
              cenarioNome: cenario?.nome ?? "IA escolher automaticamente",
              tipoHistoria,
              figurino,
              objetivo,
              roteiro: texto,
              atualizadoEm: agora,
            }
          : item,
      );

      persistirRoteiros(novaLista);
      setMensagemRoteiro("Roteiro atualizado com sucesso.");
      return;
    }

    const novo: RoteiroSalvo = {
      id: `roteiro-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      titulo,
      categoria,
      personagemId: personagemAtual?.id ?? "",
      personagemNome: personagemAtual?.nome ?? "Não selecionado",
      cenarioId: cenarioSelecionadoId,
      cenarioNome: cenario?.nome ?? "IA escolher automaticamente",
      tipoHistoria,
      figurino,
      objetivo,
      roteiro: texto,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    persistirRoteiros([novo, ...roteirosSalvos]);
    setRoteiroEditandoId(novo.id);
    setTituloRoteiro(titulo);
    setMensagemRoteiro("Roteiro salvo com sucesso.");
  }

  function abrirRoteiroSalvo(item: RoteiroSalvo) {
    setTituloRoteiro(item.titulo);
    setCategoria(item.categoria);
    setPersonagemSelecionadoId(item.personagemId || personagemSelecionadoId);
    setCenarioSelecionadoId(item.cenarioId || "ia-escolhe");
    setTipoHistoria(item.tipoHistoria || "Fictícia");
    setFigurino(item.figurino || "✨ IA escolher");
    setObjetivo(item.objetivo || "");
    setRoteiro(item.roteiro);
    setRoteiroEditandoId(item.id);

    try {
      localStorage.setItem(
        CHAVE_RASCUNHO_ROTEIRO,
        JSON.stringify({
          tituloRoteiro: item.titulo,
          roteiro: item.roteiro,
          objetivo: item.objetivo || "",
          categoria: item.categoria,
          cenarioSelecionadoId: item.cenarioId || "ia-escolhe",
          tipoHistoria: item.tipoHistoria || "Fictícia",
          figurino: item.figurino || "✨ IA escolher",
          personagemSelecionadoId:
            item.personagemId || personagemSelecionadoId,
          roteiroEditandoId: item.id,
          atualizadoEm: new Date().toISOString(),
        }),
      );
    } catch (erro) {
      console.error("Erro ao salvar roteiro aberto como rascunho:", erro);
    }

    setMensagemRoteiro("Roteiro aberto para edição.");
    setAba("roteiros");

    setTimeout(() => {
      editorRoteiroRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function novoRoteiro() {
    setTituloRoteiro("");
    setRoteiro("");
    setObjetivo("");
    setRoteiroEditandoId(null);
    setMensagemRoteiro("");
    setCenasOperacionais([]);
    setMensagemCenas("");
  }

  function excluirRoteiroSalvo(id: string) {
    const novaLista = roteirosSalvos.filter((item) => item.id !== id);
    persistirRoteiros(novaLista);

    if (roteiroEditandoId === id) {
      novoRoteiro();
    }
  }

  function alternarPersonagemCena(id: string) {
    setPersonagensCenaIds((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id],
    );
  }

  function carregarFotoMomento(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setFotoMomento(String(leitor.result ?? ""));
    leitor.readAsDataURL(arquivo);
  }

  async function corrigirIdeiaComIA() {
    const ideia = objetivo.trim();

    setMensagemIA("");

    if (!ideia) {
      setMensagemIA("Fale ou escreva sua ideia antes de corrigir.");
      return;
    }

    setCorrigindoComIA(true);

    try {
      const resposta = await fetch("/api/sala-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ideia }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.erro || "Não foi possível corrigir o texto.");
      }

      const textoCorrigido = String(dados?.texto ?? "").trim();

      if (!textoCorrigido) {
        throw new Error("A IA não retornou um texto corrigido.");
      }

      setObjetivo(textoCorrigido);
      setMensagemIA("Texto corrigido com IA.");
    } catch (erro) {
      console.error("Erro ao corrigir ideia com IA:", erro);
      setMensagemIA(
        erro instanceof Error
          ? erro.message
          : "Não foi possível acessar a inteligência artificial.",
      );
    } finally {
      setCorrigindoComIA(false);
    }
  }

  async function gerarRoteiroProfissionalIA() {
    const ideia = objetivo.trim();

    setMensagemGeracaoIA("");

    if (!ideia) {
      setMensagemGeracaoIA("Fale ou escreva a ideia do vídeo antes de gerar o roteiro.");
      return;
    }

    const cenario = CENARIOS_INICIAIS.find(
      (item) => item.id === cenarioSelecionadoId,
    );

    const elencoSelecionado = personagens
      .filter((item) => personagensCenaIds.includes(item.id))
      .map((item) => ({
        nome: item.nome,
        funcao: item.funcao,
        area: item.area,
        aparencia: item.aparencia,
        roupa: item.roupa,
        voz: item.voz,
        observacoes: item.observacoes,
      }));

    if (elencoSelecionado.length === 0 && personagemAtual) {
      elencoSelecionado.push({
        nome: personagemAtual.nome,
        funcao: personagemAtual.funcao,
        area: personagemAtual.area,
        aparencia: personagemAtual.aparencia,
        roupa: personagemAtual.roupa,
        voz: personagemAtual.voz,
        observacoes: personagemAtual.observacoes,
      });
    }

    setGerandoRoteiroIA(true);

    try {
      const resposta = await fetch("/api/sala-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "gerar-roteiro",
          ideia,
          categoria,
          cenario: cenario?.nome ?? "IA escolher automaticamente",
          descricaoCenario: cenario?.descricao ?? "",
          tipoHistoria,
          figurino,
          personagens: elencoSelecionado,
          temFotoMomento: Boolean(fotoMomento),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.erro || "Não foi possível gerar o roteiro.");
      }

      const roteiroGerado = String(dados?.texto ?? "").trim();

      if (!roteiroGerado) {
        throw new Error("A IA não retornou um roteiro.");
      }

      if (roteiro.trim()) {
        registrarRascunhoNoHistorico(roteiro, ideia, tituloRoteiro);
      }

      setRoteiro(roteiroGerado);
      setRoteiroEditandoId(null);
      registrarRascunhoNoHistorico(
        roteiroGerado,
        ideia,
        tituloRoteiro.trim() ||
          (ideia.length > 65 ? `${ideia.slice(0, 62)}...` : ideia),
      );

      try {
        localStorage.setItem(
          CHAVE_RASCUNHO_ROTEIRO,
          JSON.stringify({
            tituloRoteiro:
              tituloRoteiro.trim() ||
              (ideia.length > 65 ? `${ideia.slice(0, 62)}...` : ideia),
            roteiro: roteiroGerado,
            ideia,
            objetivo,
            categoria,
            cenarioSelecionadoId,
            tipoHistoria,
            figurino,
            personagemSelecionadoId,
            roteiroEditandoId: null,
            atualizadoEm: new Date().toISOString(),
          }),
        );
      } catch (erro) {
        console.error("Erro ao salvar roteiro gerado como rascunho:", erro);
      }

      if (!tituloRoteiro.trim()) {
        const tituloBase = ideia.length > 65 ? `${ideia.slice(0, 62)}...` : ideia;
        setTituloRoteiro(tituloBase);
      }

      setMensagemGeracaoIA("Roteiro profissional criado com IA.");
      setAba("roteiros");
    } catch (erro) {
      console.error("Erro ao gerar roteiro com IA:", erro);
      setMensagemGeracaoIA(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o roteiro profissional.",
      );
    } finally {
      setGerandoRoteiroIA(false);
    }
  }

  function registrarRascunhoNoHistorico(
    roteiroParaSalvar: string,
    ideiaParaSalvar: string,
    tituloParaSalvar?: string,
  ) {
    const conteudo = roteiroParaSalvar.trim();
    if (!conteudo) return;

    const agora = new Date().toISOString();
    const tituloAutomatico =
      tituloParaSalvar?.trim() ||
      ideiaParaSalvar.trim().slice(0, 70) ||
      conteudo.split("\n").find((linha) => linha.trim())?.replace(/[#*]/g, "").trim() ||
      "Roteiro sem título";

    const novo: RascunhoSalaIA = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      titulo: tituloAutomatico,
      ideia: ideiaParaSalvar,
      roteiro: conteudo,
      atualizadoEm: agora,
    };

    setHistoricoRascunhos((atuais) => {
      const semDuplicar = atuais.filter(
        (item) => item.roteiro.trim() !== conteudo,
      );
      const proximos = [novo, ...semDuplicar].slice(0, 10);

      try {
        localStorage.setItem(
          CHAVE_HISTORICO_RASCUNHOS,
          JSON.stringify(proximos),
        );
      } catch (erro) {
        console.error("Erro ao salvar histórico de rascunhos:", erro);
      }

      return proximos;
    });
  }

  function abrirRascunhoHistorico(item: RascunhoSalaIA) {
    setRoteiro(item.roteiro);
    if (item.ideia) setObjetivo(item.ideia);
    setTituloRoteiro(item.titulo);
    setRoteiroEditandoId(null);

    try {
      localStorage.setItem(
        CHAVE_RASCUNHO_ROTEIRO,
        JSON.stringify({
          tituloRoteiro: item.titulo,
          roteiro: item.roteiro,
          ideia: item.ideia,
          objetivo,
          categoria,
          cenarioSelecionadoId,
          tipoHistoria,
          figurino,
          personagemSelecionadoId,
          roteiroEditandoId: null,
          atualizadoEm: new Date().toISOString(),
        }),
      );
    } catch (erro) {
      console.error("Erro ao restaurar rascunho do histórico:", erro);
    }

    setMensagemRoteiro("Rascunho anterior restaurado.");
    window.setTimeout(() => {
      document
        .getElementById("roteiro-ia-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function escolherCenarioEFigurino(
    titulo: string,
    acao: string,
    fala: string,
    cenarioGlobal: string,
  ) {
    const contexto = `${titulo} ${acao} ${fala} ${cenarioGlobal}`.toLowerCase();

    let cenario = cenarioGlobal?.trim() || "Ambiente profissional definido pela IA";

    if (/dep[oó]sito|bebidas|freezer|estoque/.test(contexto)) {
      cenario = "Depósito de bebidas organizado, com freezers e estoque visíveis";
    } else if (/resid[eê]ncia|casa|telhado|pain[eé]is solares/.test(contexto)) {
      cenario =
        "Área externa de residência moderna com painéis solares visíveis no telhado";
    } else if (/empresa|com[eé]rcio|loja|escrit[oó]rio/.test(contexto)) {
      cenario = "Ambiente comercial profissional relacionado à situação apresentada";
    }

    let figurino =
      "Uniforme oficial preto da CHOQUESEG, com identidade visual da empresa";

    if (/cliente|propriet[aá]rio/.test(contexto) && !/apresentador/.test(contexto)) {
      figurino = "Roupa casual profissional, adequada ao ambiente da cena";
    }

    return { cenario, figurino };
  }

  function transformarRoteiroEmCenas() {
    const texto = roteiro.trim();
    setMensagemCenas("");

    if (!texto) {
      setMensagemCenas("Crie ou escreva um roteiro antes de transformar em cenas.");
      return;
    }

    const cenarioPadrao =
      CENARIOS_INICIAIS.find((item) => item.id === cenarioSelecionadoId)?.nome ??
      "IA escolher automaticamente";
    const personagemPadrao = personagemAtual?.nome ?? "Apresentador CHOQUESEG";

    const limparMarkdown = (valor: string) =>
      valor
        .trim()
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\*{1,2}/, "")
        .replace(/\*{1,2}$/, "")
        .replace(/^_{1,2}/, "")
        .replace(/_{1,2}$/, "")
        .trim();

    const linhas = texto.split(/\r?\n/);

    const regexCena =
      /^(?:#{1,6}\s*)?(?:\*{1,2}|_{1,2})?\s*CENA\s+(\d+)\s*(?:[—–:-]\s*)?(.*?)(?:\*{1,2}|_{1,2})?\s*$/i;

    const regexEncerramento =
      /^(?:#{1,6}\s*)?(?:\*{1,2}|_{1,2})?\s*ENCERRAMENTO\s*\/?\s*CTA(?:\*{1,2}|_{1,2})?\s*$/i;

    type InicioBloco = {
      indice: number;
      numero: number;
      titulo: string;
      encerramento: boolean;
    };

    const inicios: InicioBloco[] = [];

    linhas.forEach((linha, indice) => {
      const limpa = linha.trim();

      const cena = limpa.match(regexCena);
      if (cena) {
        const numero = Number(cena[1]) || inicios.length + 1;
        const titulo =
          limparMarkdown(cena[2] ?? "").replace(/^[-—–:]\s*/, "").trim() ||
          `Cena ${numero}`;

        inicios.push({
          indice,
          numero,
          titulo,
          encerramento: false,
        });
        return;
      }

      if (regexEncerramento.test(limpa)) {
        inicios.push({
          indice,
          numero: 0,
          titulo: "ENCERRAMENTO / CTA",
          encerramento: true,
        });
      }
    });

    if (inicios.length === 0) {
      setCenasOperacionais([]);
      setMensagemCenas(
        'Não encontrei blocos "CENA 1, CENA 2..." neste roteiro.',
      );
      return;
    }

    const maiorNumeroCena = Math.max(
      ...inicios.filter((item) => !item.encerramento).map((item) => item.numero),
      0,
    );

    inicios.forEach((item) => {
      if (item.encerramento) item.numero = maiorNumeroCena + 1;
    });

    const normalizarRotulo = (valor: string) =>
      limparMarkdown(valor)
        .toUpperCase()
        .replace(/\s+/g, " ")
        .replace(/\s*\/\s*/g, "/")
        .trim();

    const novasCenas: CenaOperacional[] = inicios.map((inicio, posicao) => {
      const fim =
        posicao + 1 < inicios.length ? inicios[posicao + 1].indice : linhas.length;

      const corpo = linhas.slice(inicio.indice + 1, fim);

      const secoes: Record<string, string[]> = {
        ACAO: [],
        FALA: [],
        PERSONAGEM: [],
        CENARIO: [],
        FIGURINO: [],
        ENQUADRAMENTO: [],
        DURACAO: [],
        TEXTO_TELA: [],
      };

      let secaoAtual = "";
      const personagensFalando: string[] = [];

      corpo.forEach((linhaOriginal) => {
        const linha = linhaOriginal.trim();
        if (!linha) return;

        const limpa = limparMarkdown(linha);

        const rotulo = limpa.match(
          /^(VISUAL\s*\/\s*AÇÃO|VISUAL\s*\/\s*ACAO|VISUAL|AÇÃO|ACAO|FALA(?:\s+DO\s+APRESENTADOR)?|DI[ÁA]LOGO|NARRA[ÇC][ÃA]O|LOCU[ÇC][ÃA]O|PERSONAGENS?|CEN[ÁA]RIO|FIGURINO|ENQUADRAMENTO|DURA[ÇC][ÃA]O|TEXTO\s+NA\s+TELA)\s*:\s*(.*)$/i,
        );

        if (rotulo) {
          const nome = normalizarRotulo(rotulo[1]);

          if (["VISUAL/AÇÃO", "VISUAL/ACAO", "VISUAL", "AÇÃO", "ACAO"].includes(nome)) {
            secaoAtual = "ACAO";
          } else if (
            nome === "FALA" ||
            nome.startsWith("FALA DO APRESENTADOR") ||
            nome === "DIÁLOGO" ||
            nome === "DIALOGO" ||
            nome === "NARRAÇÃO" ||
            nome === "NARRACAO" ||
            nome === "LOCUÇÃO" ||
            nome === "LOCUCAO"
          ) {
            secaoAtual = "FALA";
          } else if (nome.startsWith("PERSONAGEM")) {
            secaoAtual = "PERSONAGEM";
          } else if (nome === "CENÁRIO" || nome === "CENARIO") {
            secaoAtual = "CENARIO";
          } else if (nome === "FIGURINO") {
            secaoAtual = "FIGURINO";
          } else if (nome === "ENQUADRAMENTO") {
            secaoAtual = "ENQUADRAMENTO";
          } else if (nome.startsWith("DURA")) {
            secaoAtual = "DURACAO";
          } else if (nome === "TEXTO NA TELA") {
            secaoAtual = "TEXTO_TELA";
          }

          const conteudo = rotulo[2]?.trim();
          if (conteudo) secoes[secaoAtual].push(conteudo);
          return;
        }

        // Uma frase completa entre aspas é fala, mesmo quando a IA não
        // escreveu explicitamente o rótulo "FALA:" antes dela.
        const linhaCompletaEntreAspas =
          /^(?:["“'‘]).+(?:["”'’])$/.test(limpa);

        if (linhaCompletaEntreAspas && secaoAtual !== "TEXTO_TELA") {
          secoes.FALA.push(limpa);
          secaoAtual = "FALA";
          return;
        }

        // Aceita também formatos explícitos como:
        // APRESENTADOR: texto...
        // APRESENTADOR CHOQUESEG: texto...
        // mas nunca interpreta uma frase iniciada por aspas como personagem.
        const dialogo =
          /^(?:["“'‘])/.test(limpa)
            ? null
            : limpa.match(/^([^:]{2,60})\s*:\s*(.+)$/);

        if (dialogo && secaoAtual !== "ACAO" && secaoAtual !== "TEXTO_TELA") {
          const nomePersonagem = limparMarkdown(dialogo[1]);
          const fala = dialogo[2].trim();

          if (nomePersonagem && fala) {
            personagensFalando.push(nomePersonagem);
            secoes.FALA.push(fala);
            secaoAtual = "FALA";
            return;
          }
        }

        if (secaoAtual) {
          secoes[secaoAtual].push(limpa);
        }
      });

      const textoSecao = (nome: string) =>
        secoes[nome].join("\n").trim();

      const personagensUnicos = Array.from(
        new Set(personagensFalando.filter(Boolean)),
      );

      const personagem =
        textoSecao("PERSONAGEM") ||
        personagensUnicos.join(", ") ||
        personagemPadrao;

      const fala =
        textoSecao("FALA") ||
        "Sem fala definida para esta cena.";

      let acaoExtraida = textoSecao("ACAO");
      let textoTela = textoSecao("TEXTO_TELA");

      // Alguns roteiros trazem "Texto na tela:" dentro do próprio VISUAL/AÇÃO.
      // Nesse caso, separa automaticamente para o campo correto.
      const textoNaTelaDentroDaAcao = acaoExtraida.match(
        /(?:^|\s)TEXTO\s+NA\s+TELA\s*:\s*(.+)$/i,
      );

      if (textoNaTelaDentroDaAcao) {
        const conteudoExtraido = limparMarkdown(
          textoNaTelaDentroDaAcao[1]
            .replace(/^["“”'‘’]\s*/, "")
            .replace(/\s*["“”'‘’]$/, ""),
        );

        if (conteudoExtraido) {
          textoTela = textoTela
            ? `${textoTela}\n${conteudoExtraido}`
            : conteudoExtraido;
        }

        acaoExtraida = acaoExtraida
          .replace(/(?:^|\s)TEXTO\s+NA\s+TELA\s*:\s*(.+)$/i, "")
          .trim();
      }

      const acao =
        acaoExtraida ||
        (inicio.encerramento
          ? "Exibir tela final institucional com a identidade visual da CHOQUESEG."
          : posicao === 0
            ? "Abrir a cena com presença forte e conexão imediata com o público."
            : "Manter atuação natural e continuidade visual com a cena anterior.");

      const cenario =
        textoSecao("CENARIO") ||
        cenarioPadrao;

      const figurinoCena =
        textoSecao("FIGURINO") ||
        figurino;

      const enquadramento =
        textoSecao("ENQUADRAMENTO") ||
        (inicio.encerramento
          ? "Tela final / composição institucional"
          : posicao === 0
            ? "Plano médio / aproximação suave"
            : "Plano médio");

      const duracao =
        textoSecao("DURACAO") ||
        (inicio.encerramento ? "4–6 s" : "6–10 s");

      const escolhasIA = escolherCenarioEFigurino(
        inicio.titulo,
        acao,
        fala,
        cenarioPadrao,
      );

      return {
        id: `cena-${Date.now()}-${posicao}`,
        numero: inicio.numero,
        titulo: inicio.titulo,
        personagem,
        cenario,
        figurino: figurinoCena,
        fala,
        acao,
        textoTela,
        enquadramento,
        duracao,
      };
    });

    setCenasOperacionais(novasCenas);

    const expansaoInicial: Record<string, boolean> = {};
    novasCenas.forEach((cena) => {
      expansaoInicial[cena.id] = true;
    });
    setCenasExpandidas(expansaoInicial);

    setMensagemCenas(
      `${novasCenas.length} ${
        novasCenas.length === 1 ? "cena preparada" : "cenas preparadas"
      } para a produção do vídeo.`,
    );
  }

  function aplicarPersonagemSelecionadoNasCenas() {
    setProjetoAprovadoGeracao(false);
    if (!personagemAtual) {
      setMensagemCenas("Selecione um personagem antes de aplicar a identidade às cenas.");
      return;
    }

    if (cenasOperacionais.length === 0) {
      setMensagemCenas("Transforme o roteiro em cenas antes de aplicar o personagem.");
      return;
    }

    setCenasOperacionais((atuais) =>
      atuais.map((cena) => ({
        ...cena,
        personagem: personagemAtual.nome,
        figurino: personagemAtual.roupa || cena.figurino,
      })),
    );

    setMensagemCenas(
      `${personagemAtual.nome} foi definido como personagem-base em todas as cenas.`,
    );
  }

  function atualizarCena(
    id: string,
    campo: keyof Omit<CenaOperacional, "id" | "numero">,
    valor: string,
  ) {
    setProjetoAprovadoGeracao(false);
    setCenasOperacionais((atuais) =>
      atuais.map((cena) => (cena.id === id ? { ...cena, [campo]: valor } : cena)),
    );
  }

  async function gerarVideoCompletoAutomatico() {
    setMensagemVideoCompleto("");

    if (!GERACAO_VIDEO_COMPLETO_LIBERADA) {
      setMensagemVideoCompleto(
        "A geração completa está programada, mas bloqueada para não consumir créditos. Libere somente quando desejar gerar o vídeo real.",
      );
      return;
    }

    if (!validacaoProjetoVideo.aprovado) {
      setMensagemVideoCompleto("Corrija o checklist automático antes de gerar.");
      return;
    }

    if (!projetoAprovadoGeracao) {
      setMensagemVideoCompleto("Revise a prévia e aprove o projeto antes de gerar.");
      return;
    }

    if (cenasOperacionais.length === 0) {
      setMensagemVideoCompleto("Não existem cenas para gerar.");
      return;
    }

    setGerandoVideoCompleto(true);
    setProgressoVideoCompleto(0);
    setVideoCompletoUrl("");
    setVideoCompletoId("");

    try {
      let ultimoVideoId = "";

      for (let indice = 0; indice < cenasOperacionais.length; indice += 1) {
        const cena = cenasOperacionais[indice];

        setMensagemVideoCompleto(
          indice === 0
            ? `Gerando Cena ${cena.numero} de ${cenasOperacionais.length}...`
            : `Continuando o mesmo vídeo — Cena ${cena.numero} de ${cenasOperacionais.length}...`,
        );

        const respostaInicial = await fetch("/api/sala-ia/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cena,
            continuarDeVideoId: ultimoVideoId || undefined,
          }),
        });

        const inicial = await respostaInicial.json();

        if (!respostaInicial.ok || !inicial?.id) {
          throw new Error(
            inicial?.erro || `Não foi possível iniciar a Cena ${cena.numero}.`,
          );
        }

        const videoIdAtual = String(inicial.id);
        let concluido = false;

        for (let tentativa = 0; tentativa < 90; tentativa += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 5000));

          const statusResposta = await fetch(
            `/api/sala-ia/video?id=${encodeURIComponent(videoIdAtual)}`,
          );
          const status = await statusResposta.json();

          if (!statusResposta.ok) {
            throw new Error(
              status?.erro || `Erro ao consultar a Cena ${cena.numero}.`,
            );
          }

          const progressoCena =
            typeof status?.progress === "number"
              ? Math.max(0, Math.min(100, status.progress))
              : 0;

          const progressoGeral =
            ((indice + progressoCena / 100) / cenasOperacionais.length) * 100;

          setProgressoVideoCompleto(Math.round(progressoGeral));

          if (status?.status === "failed") {
            throw new Error(
              status?.erro || `A geração da Cena ${cena.numero} falhou.`,
            );
          }

          if (status?.status === "completed") {
            ultimoVideoId = videoIdAtual;
            setProgressoVideoCompleto(
              Math.round(((indice + 1) / cenasOperacionais.length) * 100),
            );
            concluido = true;
            break;
          }
        }

        if (!concluido) {
          throw new Error(
            `A Cena ${cena.numero} não terminou dentro do tempo esperado.`,
          );
        }
      }

      if (!ultimoVideoId) {
        throw new Error("A geração terminou sem um vídeo final.");
      }

      setVideoCompletoId(ultimoVideoId);
      setVideoCompletoUrl(
        `/api/sala-ia/video?id=${encodeURIComponent(ultimoVideoId)}&content=1`,
      );
      setProgressoVideoCompleto(100);
      setMensagemVideoCompleto(
        "Vídeo completo finalizado. As cenas foram processadas em sequência.",
      );
    } catch (erro) {
      console.error("Erro ao gerar vídeo completo:", erro);
      setMensagemVideoCompleto(
        erro instanceof Error
          ? erro.message
          : "Não foi possível gerar o vídeo completo.",
      );
    } finally {
      setGerandoVideoCompleto(false);
    }
  }

  async function gerarVideoCena(cena: CenaOperacional) {
    setVideosGerando((atual) => ({ ...atual, [cena.id]: true }));
    setMensagensVideo((atual) => ({ ...atual, [cena.id]: "Iniciando geração do vídeo..." }));

    try {
      const respostaInicial = await fetch("/api/sala-ia/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cena }),
      });
      const inicial = await respostaInicial.json();
      if (!respostaInicial.ok || !inicial?.id) {
        throw new Error(inicial?.erro || "Não foi possível iniciar o vídeo.");
      }

      const videoId = String(inicial.id);
      let concluido = false;

      for (let tentativa = 0; tentativa < 90; tentativa += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const statusResposta = await fetch(`/api/sala-ia/video?id=${encodeURIComponent(videoId)}`);
        const status = await statusResposta.json();

        if (!statusResposta.ok) throw new Error(status?.erro || "Erro ao consultar o vídeo.");

        const progresso = typeof status?.progress === "number" ? ` ${Math.round(status.progress)}%` : "";
        setMensagensVideo((atual) => ({
          ...atual,
          [cena.id]:
            status?.status === "queued"
              ? "Vídeo na fila..."
              : status?.status === "in_progress"
                ? `Gerando vídeo...${progresso}`
                : "Finalizando vídeo...",
        }));

        if (status?.status === "failed") throw new Error(status?.erro || "A geração do vídeo falhou.");

        if (status?.status === "completed") {
          setVideosCena((atual) => ({
            ...atual,
            [cena.id]: `/api/sala-ia/video?id=${encodeURIComponent(videoId)}&content=1`,
          }));
          setMensagensVideo((atual) => ({ ...atual, [cena.id]: "Vídeo pronto." }));
          concluido = true;
          break;
        }
      }

      if (!concluido) throw new Error("O vídeo ainda não terminou. Tente novamente em alguns instantes.");
    } catch (erro) {
      console.error("Erro ao gerar vídeo da cena:", erro);
      setMensagensVideo((atual) => ({
        ...atual,
        [cena.id]: erro instanceof Error ? erro.message : "Não foi possível gerar o vídeo.",
      }));
    } finally {
      setVideosGerando((atual) => ({ ...atual, [cena.id]: false }));
    }
  }

  function alternarExpansaoCena(id: string) {
    setCenasExpandidas((atuais) => ({
      ...atuais,
      [id]: !(atuais[id] ?? true),
    }));
  }

  function expandirTodasCenas() {
    const mapa: Record<string, boolean> = {};
    cenasOperacionais.forEach((cena) => {
      mapa[cena.id] = true;
    });
    setCenasExpandidas(mapa);
  }

  function recolherTodasCenas() {
    const mapa: Record<string, boolean> = {};
    cenasOperacionais.forEach((cena) => {
      mapa[cena.id] = false;
    });
    setCenasExpandidas(mapa);
  }

  function iniciarVozIdeia() {
    setMensagemVoz("");

    if (typeof window === "undefined") return;

    const janela = window as typeof window & {
      SpeechRecognition?: ConstrutorReconhecimentoVoz;
      webkitSpeechRecognition?: ConstrutorReconhecimentoVoz;
    };

    const SpeechRecognition =
      janela.SpeechRecognition ?? janela.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensagemVoz(
        "Este navegador não liberou o reconhecimento de voz. Teste pelo Google Chrome.",
      );
      return;
    }

    if (ouvindoIdeia && reconhecimentoVoz) {
      reconhecimentoVoz.stop();
      return;
    }

    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = true;
    reconhecimento.interimResults = true;

    let textoAntesDeOuvir = objetivo.trim();
    let textoConfirmado = "";

    reconhecimento.onresult = (evento: any) => {
      let textoTemporario = "";

      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const trecho = evento.results[i][0]?.transcript ?? "";

        if (evento.results[i].isFinal) {
          textoConfirmado += `${trecho} `;
        } else {
          textoTemporario += trecho;
        }
      }

      const partes = [
        textoAntesDeOuvir,
        textoConfirmado.trim(),
        textoTemporario.trim(),
      ].filter(Boolean);

      setObjetivo(partes.join(textoAntesDeOuvir ? " " : ""));
    };

    reconhecimento.onerror = (evento: any) => {
      if (evento?.error === "not-allowed" || evento?.error === "service-not-allowed") {
        setMensagemVoz(
          "Permissão do microfone bloqueada. Libere o microfone para este site e tente novamente.",
        );
      } else if (evento?.error !== "aborted") {
        setMensagemVoz("Não consegui entender a voz. Tente novamente.");
      }
      setOuvindoIdeia(false);
    };

    reconhecimento.onend = () => {
      setOuvindoIdeia(false);
      setReconhecimentoVoz(null);
    };

    setReconhecimentoVoz(reconhecimento);
    setOuvindoIdeia(true);

    try {
      reconhecimento.start();
    } catch (erro) {
      console.error("Erro ao iniciar reconhecimento de voz:", erro);
      setOuvindoIdeia(false);
      setReconhecimentoVoz(null);
      setMensagemVoz("Não foi possível iniciar o microfone.");
    }
  }

  function criarRascunho() {
    const assunto = objetivo.trim() || "apresentar uma solução da CHOQUESEG";
    const nome = personagemAtual?.nome ?? "Apresentador CHOQUESEG";
    const cenario = CENARIOS_INICIAIS.find((item) => item.id === cenarioSelecionadoId);
    const elenco = personagens
      .filter((item) => personagensCenaIds.includes(item.id))
      .map((item) => item.nome)
      .join(", ");

    setRoteiro(
      [
        `CONTEXTO — ${tipoHistoria} | Cenário: ${cenario?.nome ?? "IA escolher"} | Figurino: ${figurino}`,
        elenco ? `ELENCO DA CENA — ${elenco}` : `ELENCO DA CENA — ${nome}`,
        fotoMomento ? "PERSONAGEM DO MOMENTO — foto adicionada" : "",
        "",
        "CENA 1 — GANCHO",
        `${nome}: Você ainda está perdendo dinheiro e conforto por não conhecer a solução certa em ${categoria.toLowerCase()}?`,
        "",
        "CENA 2 — PROBLEMA",
        `${nome}: Hoje eu quero falar com você sobre ${assunto}.`,
        "",
        "CENA 3 — SOLUÇÃO",
        `${nome}: A CHOQUESEG cuida do projeto com orientação, instalação profissional e acompanhamento.`,
        "",
        "CENA 4 — CHAMADA",
        `${nome}: Fale agora com a CHOQUESEG e solicite sua avaliação.`,
        "",
        "ASSINATURA",
        "CHOQUESEG — Deixe o sol pagar pelo seu conforto.",
      ].join("\n"),
    );
    setAba("roteiros");
  }

  const abas: Array<{ id: AbaSalaIA; nome: string; icone: string }> = [
    { id: "criar", nome: "Criar Vídeo", icone: "🎬" },
    { id: "personagens", nome: "Personagens", icone: "🎭" },
    { id: "roteiros", nome: "Roteiro IA", icone: "✍️" },
    { id: "vozes", nome: "Voz e Narração", icone: "🎙️" },
    { id: "videos", nome: "Meus Vídeos", icone: "📚" },
  ];

  return (
    <section className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="rounded-3xl border border-yellow-400/30 bg-black shadow-2xl">
        <div className="border-b border-zinc-800 p-5 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
                🤖 CHOQUESEG PRO
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-white">
                Sala IA
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Central para criar personagens, roteiros, vozes e vídeos comerciais
                da CHOQUESEG mantendo a mesma identidade visual.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
              <p className="text-xs font-black uppercase text-yellow-400">
                Fase 2
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                Personagens inteligentes
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {abas.map((item) => {
              const ativa = aba === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAba(item.id)}
                  className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                    ativa
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-zinc-800 bg-zinc-950 text-white hover:border-yellow-400/60"
                  }`}
                >
                  <span className="mr-2">{item.icone}</span>
                  {item.nome}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 md:p-7">
          {aba === "criar" && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  Novo vídeo
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  O que vamos criar hoje?
                </h3>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                      Categoria
                    </span>
                    <select
                      value={categoria}
                      onChange={(evento) => setCategoria(evento.target.value)}
                      className="h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
                    >
                      {CATEGORIAS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                      Personagem
                    </span>
                    <select
                      value={personagemSelecionadoId}
                      onChange={(evento) =>
                        setPersonagemSelecionadoId(evento.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                    >
                      {personagens.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.principal ? "⭐ " : ""}
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">Cenário</span>
                      <select
                        value={cenarioSelecionadoId}
                        onChange={(evento) => setCenarioSelecionadoId(evento.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                      >
                        {CENARIOS_INICIAIS.map((item) => (
                          <option key={item.id} value={item.id}>{item.nome}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">Tipo de história</span>
                      <select
                        value={tipoHistoria}
                        onChange={(evento) => setTipoHistoria(evento.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                      >
                        <option>Fictícia</option>
                        <option>Baseada em caso real</option>
                        <option>Depoimento pessoal</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">Figurino</span>
                    <select
                      value={figurino}
                      onChange={(evento) => setFigurino(evento.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                    >
                      {FIGURINOS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>

                  <div className="rounded-xl border border-zinc-800 bg-black p-4">
                    <span className="block text-xs font-black uppercase text-zinc-400">Personagens na mesma cena</span>
                    <p className="mt-1 text-xs text-zinc-500">Marque mais de um para criar diálogos. O mesmo personagem poderá ser clonado na etapa de geração por IA.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {personagens.map((item) => {
                        const ativo = personagensCenaIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => alternarPersonagemCena(item.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black ${ativo ? "border-yellow-400 bg-yellow-400 text-black" : "border-zinc-700 text-white"}`}
                          >
                            {ativo ? "✓ " : "+ "}{item.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black p-4">
                    <span className="block text-xs font-black uppercase text-zinc-400">📸 Personagem do momento</span>
                    <p className="mt-1 text-xs text-zinc-500">Tire uma foto no celular ou escolha uma imagem da galeria para usar como referência neste vídeo.</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={carregarFotoMomento}
                      className="mt-3 block w-full text-xs text-zinc-300 file:mr-3 file:rounded-xl file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:font-black file:text-black"
                    />
                    {fotoMomento && (
                      <div className="mt-3 flex items-center gap-3">
                        <img src={fotoMomento} alt="Personagem do momento" className="h-20 w-20 rounded-xl object-cover" />
                        <button type="button" onClick={() => setFotoMomento("")} className="rounded-xl border border-red-500/50 px-3 py-2 text-xs font-black text-red-400">
                          Remover foto
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="block">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="block text-xs font-black uppercase text-zinc-400">
                        Tema / objetivo do vídeo
                      </span>

                      <button
                        type="button"
                        onClick={iniciarVozIdeia}
                        className={`rounded-xl border px-4 py-2 text-xs font-black uppercase transition ${
                          ouvindoIdeia
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-yellow-400/60 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        }`}
                      >
                        {ouvindoIdeia ? "⏹ Parar gravação" : "🎤 Falar minha ideia"}
                      </button>
                    </div>

                    <textarea
                      value={objetivo}
                      onChange={(evento) => setObjetivo(evento.target.value)}
                      rows={5}
                      placeholder="Ex.: cliente paga R$ 600 de energia e quero mostrar como a energia solar pode reduzir essa conta."
                      className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                    />

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={corrigirIdeiaComIA}
                        disabled={corrigindoComIA || !objetivo.trim()}
                        className="rounded-xl border border-yellow-400/60 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {corrigindoComIA ? "⏳ Corrigindo..." : "✨ Corrigir com IA"}
                      </button>

                      {mensagemIA && (
                        <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                          {mensagemIA}
                        </p>
                      )}
                    </div>

                    {ouvindoIdeia && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        Ouvindo... fale normalmente. O texto aparecerá acima.
                      </div>
                    )}

                    {mensagemVoz && (
                      <p className="mt-2 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                        {mensagemVoz}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={gerarRoteiroProfissionalIA}
                    disabled={gerandoRoteiroIA || !objetivo.trim()}
                    className="rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {gerandoRoteiroIA
                      ? "⏳ Criando roteiro com IA..."
                      : "🎬 Gerar roteiro profissional com IA"}
                  </button>

                  {mensagemGeracaoIA && (
                    <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                      {mensagemGeracaoIA}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  Produção
                </p>
                <div className="mt-5 space-y-3">
                  <Resumo titulo="Formato" valor="Vídeo vertical 9:16" />
                  <Resumo titulo="Categoria" valor={categoria} />
                  <Resumo
                    titulo="Cenário"
                    valor={CENARIOS_INICIAIS.find((item) => item.id === cenarioSelecionadoId)?.nome ?? "IA escolher"}
                  />
                  <Resumo titulo="História" valor={tipoHistoria} />
                  <Resumo titulo="Figurino" valor={figurino} />
                  <Resumo
                    titulo="Personagem"
                    valor={personagemAtual?.nome ?? "Não selecionado"}
                  />
                  <Resumo titulo="Identidade" valor="CHOQUESEG oficial" />
                  <Resumo titulo="Status" valor="Rascunho" />
                </div>
              </div>
            </div>
          )}

          {aba === "personagens" && (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                    Personagens
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Elenco fixo da CHOQUESEG
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Cadastre personagens que poderão ser reutilizados em diferentes vídeos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoPersonagem}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black transition hover:bg-yellow-300"
                >
                  + Novo personagem
                </button>
              </div>

              {formPersonagemAberto && (
                <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-yellow-400">
                        {editandoId ? "Editar personagem" : "Novo personagem"}
                      </p>
                      <h4 className="mt-1 text-xl font-black text-white">
                        Identidade do personagem
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormPersonagemAberto(false);
                        limparFormularioPersonagem();
                      }}
                      className="h-10 w-10 rounded-full border border-zinc-700 text-xl font-black text-zinc-300"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <CampoTexto
                      titulo="Nome"
                      valor={nomePersonagem}
                      aoAlterar={setNomePersonagem}
                      placeholder="Ex.: Rodrigo Solar"
                    />
                    <CampoTexto
                      titulo="Função"
                      valor={funcaoPersonagem}
                      aoAlterar={setFuncaoPersonagem}
                      placeholder="Ex.: Especialista em Energia Solar"
                    />

                    <label className="block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                        Área
                      </span>
                      <select
                        value={areaPersonagem}
                        onChange={(evento) =>
                          setAreaPersonagem(evento.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                      >
                        <option>Geral</option>
                        <option>Energia Solar</option>
                        <option>Segurança Eletrônica</option>
                        <option>Automação</option>
                        <option>Elétrica</option>
                        <option>Institucional</option>
                      </select>
                    </label>

                    <CampoTexto
                      titulo="Voz"
                      valor={vozPersonagem}
                      aoAlterar={setVozPersonagem}
                      placeholder="Ex.: masculina, segura, natural"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <CampoArea
                      titulo="Aparência"
                      valor={aparenciaPersonagem}
                      aoAlterar={setAparenciaPersonagem}
                      placeholder="Descreva rosto, cabelo, idade aparente, postura e estilo visual."
                    />
                    <CampoArea
                      titulo="Roupa / uniforme"
                      valor={roupaPersonagem}
                      aoAlterar={setRoupaPersonagem}
                      placeholder="Descreva exatamente como o personagem deve se vestir."
                    />
                    <CampoArea
                      titulo="Observações"
                      valor={observacoesPersonagem}
                      aoAlterar={setObservacoesPersonagem}
                      placeholder="Comportamento, frases, restrições e forma de apresentação."
                    />
                    <div className="rounded-xl border border-zinc-700 bg-black p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                        Foto / imagem de referência
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Escolha uma foto do computador ou celular para vincular a este personagem.
                      </p>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/30 bg-zinc-950">
                          {imagemDataUrlPersonagem ? (
                            <img
                              src={imagemDataUrlPersonagem}
                              alt="Pré-visualização do personagem"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl">🎭</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <label className="inline-flex cursor-pointer rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black uppercase text-black">
                            📷 Escolher foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(evento) => {
                                escolherImagemPersonagem(evento.target.files?.[0]);
                                evento.currentTarget.value = "";
                              }}
                            />
                          </label>

                          {imagemReferenciaPersonagem && (
                            <p className="mt-2 truncate text-xs text-zinc-400">
                              {imagemReferenciaPersonagem}
                            </p>
                          )}

                          {imagemDataUrlPersonagem && (
                            <button
                              type="button"
                              onClick={removerImagemPersonagem}
                              className="mt-3 rounded-xl border border-red-500/50 px-4 py-2 text-xs font-black uppercase text-red-400"
                            >
                              🗑 Remover foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFormPersonagemAberto(false);
                        limparFormularioPersonagem();
                      }}
                      className="rounded-xl border border-zinc-700 px-5 py-3 font-black uppercase text-zinc-300"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={salvarPersonagem}
                      disabled={!nomePersonagem.trim()}
                      className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black disabled:opacity-50"
                    >
                      Salvar personagem
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {personagens.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-5 ${
                      item.principal
                        ? "border-yellow-400 bg-yellow-400/5"
                        : "border-zinc-800 bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-3xl">
                          {item.imagemDataUrl ? (
                            <img
                              src={item.imagemDataUrl}
                              alt={item.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "🎭"
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-white">
                              {item.nome}
                            </h4>
                            {item.principal && (
                              <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase text-black">
                                ⭐ Principal
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm font-bold text-yellow-400">
                            {item.funcao || "Sem função definida"}
                          </p>
                          <p className="mt-1 text-xs uppercase text-zinc-500">
                            {item.area}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-zinc-300">
                      <p>
                        <strong className="text-zinc-500">Aparência:</strong>{" "}
                        {item.aparencia || "Não definida"}
                      </p>
                      <p>
                        <strong className="text-zinc-500">Uniforme:</strong>{" "}
                        {item.roupa || "Não definido"}
                      </p>
                      <p>
                        <strong className="text-zinc-500">Voz:</strong>{" "}
                        {item.voz || "Não definida"}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {!item.principal && (
                        <button
                          type="button"
                          onClick={() => definirPrincipal(item.id)}
                          className="rounded-xl border border-yellow-400/50 px-3 py-2 text-xs font-black uppercase text-yellow-400"
                        >
                          ⭐ Principal
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setPersonagemSelecionadoId(item.id);
                          setAba("criar");
                        }}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-white"
                      >
                        🎬 Usar
                      </button>

                      <button
                        type="button"
                        onClick={() => editarPersonagem(item)}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-white"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirPersonagem(item.id)}
                        disabled={personagens.length <= 1}
                        className="rounded-xl border border-red-500/50 px-3 py-2 text-xs font-black uppercase text-red-400 disabled:opacity-40"
                      >
                        🗑 Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === "roteiros" && (
            <div ref={editorRoteiroRef}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                    Roteiro IA
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Roteiro do vídeo
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={novoRoteiro}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-black uppercase text-white"
                >
                  + Novo roteiro
                </button>
              </div>

              <label className="mt-6 block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                  Título do roteiro
                </span>
                <input
                  value={tituloRoteiro}
                  onChange={(evento) => setTituloRoteiro(evento.target.value)}
                  placeholder="Ex.: Família que conquistou mais conforto com energia solar"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </label>

              <textarea
                value={roteiro}
                onChange={(evento) => setRoteiro(evento.target.value)}
                rows={18}
                placeholder="Crie um vídeo na aba Criar Vídeo ou escreva o roteiro aqui."
                className="mt-4 w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 p-5 font-mono text-sm leading-6 text-white outline-none focus:border-yellow-400"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={salvarRoteiroAtual}
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black transition hover:bg-yellow-300"
                >
                  💾 {roteiroEditandoId ? "Atualizar roteiro" : "Salvar roteiro"}
                </button>

                {mensagemRoteiro && (
                  <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                    {mensagemRoteiro}
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                      Próxima etapa
                    </p>
                    <h4 className="mt-1 text-xl font-black text-white">
                      Cenas operacionais do vídeo
                    </h4>
                    <p className="mt-1 text-sm text-zinc-400">
                      Converta o roteiro em cenas prontas para personagem, cenário, figurino, fala, ação e enquadramento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={transformarRoteiroEmCenas}
                    disabled={!roteiro.trim()}
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    🎞️ Transformar em cenas
                  </button>
                </div>

                {mensagemCenas && (
                  <p className="mt-3 rounded-xl border border-yellow-400/20 bg-black px-3 py-2 text-xs font-bold text-yellow-300">
                    {mensagemCenas}
                  </p>
                )}

                {cenasOperacionais.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                        Revisão das cenas
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={expandirTodasCenas}
                          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-white"
                        >
                          Expandir todas
                        </button>
                        <button
                          type="button"
                          onClick={recolherTodasCenas}
                          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-black uppercase text-white"
                        >
                          Recolher todas
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {cenasOperacionais.map((cena) => {
                        const expandida = cenasExpandidas[cena.id] ?? true;

                        return (
                          <div
                            key={cena.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-black uppercase text-yellow-400">
                                    Cena {cena.numero}
                                  </p>
                                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                                    {cena.duracao}
                                  </span>
                                </div>
                                <h5 className="mt-0.5 truncate text-base font-black text-white">
                                  {cena.titulo}
                                </h5>
                              </div>

                              <button
                                type="button"
                                onClick={() => alternarExpansaoCena(cena.id)}
                                className="rounded-lg border border-yellow-400/50 px-3 py-1.5 text-[11px] font-black uppercase text-yellow-400"
                              >
                                {expandida ? "▲ Recolher cena" : "▼ Abrir cena"}
                              </button>
                            </div>

                            {!expandida && (
                              <div className="mt-3 grid gap-2 text-xs text-zinc-300 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl border border-zinc-800 bg-black p-3">
                                  <span className="block font-black uppercase text-zinc-500">
                                    Personagem
                                  </span>
                                  <span className="mt-1 block line-clamp-2">{cena.personagem}</span>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-black p-3">
                                  <span className="block font-black uppercase text-zinc-500">
                                    Cenário
                                  </span>
                                  <span className="mt-1 block line-clamp-2">{cena.cenario}</span>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-black p-3">
                                  <span className="block font-black uppercase text-zinc-500">
                                    Fala
                                  </span>
                                  <span className="mt-1 block line-clamp-2">{cena.fala}</span>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-black p-3">
                                  <span className="block font-black uppercase text-zinc-500">
                                    Ação
                                  </span>
                                  <span className="mt-1 block line-clamp-2">{cena.acao}</span>
                                </div>
                              </div>
                            )}

                            {expandida && (
                              <div className="mt-3 grid gap-2">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 min-[640px]:grid-cols-4">
                                  <CampoTexto
                                    titulo="Personagem"
                                    valor={cena.personagem}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "personagem", valor)
                                    }
                                  />
                                  <CampoTexto
                                    titulo="Cenário"
                                    valor={cena.cenario}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "cenario", valor)
                                    }
                                  />
                                  <CampoTexto
                                    titulo="Figurino"
                                    valor={cena.figurino}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "figurino", valor)
                                    }
                                  />
                                  <CampoTexto
                                    titulo="Enquadramento"
                                    valor={cena.enquadramento}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "enquadramento", valor)
                                    }
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-2 min-[640px]:grid-cols-3">
                                  <CampoArea
                                    titulo="Fala"
                                    valor={cena.fala}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "fala", valor)
                                    }
                                    placeholder="Texto que o personagem deverá falar."
                                  />
                                  <CampoArea
                                    titulo="Ação / direção"
                                    valor={cena.acao}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "acao", valor)
                                    }
                                    placeholder="Movimento, expressão, câmera e ação da cena."
                                  />
                                  <CampoArea
                                    titulo="Texto na tela"
                                    valor={cena.textoTela}
                                    aoAlterar={(valor) =>
                                      atualizarCena(cena.id, "textoTela", valor)
                                    }
                                    placeholder="Texto, legenda ou chamada visual que aparece na cena."
                                  />
                                </div>

                                <div className="mt-3 rounded-xl border border-yellow-400/40 bg-black p-3">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-black uppercase text-yellow-400">
                                        🎬 TESTE DE VÍDEO
                                      </p>
                                      <p className="mt-1 text-xs text-zinc-500">
                                        Gere somente esta cena para vermos o primeiro vídeo.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={Boolean(videosGerando[cena.id])}
                                      onClick={() => gerarVideoCena(cena)}
                                      className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {videosGerando[cena.id]
                                        ? "GERANDO VÍDEO..."
                                        : "🎬 GERAR VÍDEO DESTA CENA"}
                                    </button>
                                  </div>

                                  {mensagensVideo[cena.id] && (
                                    <p className="mt-3 text-sm font-bold text-zinc-300">
                                      {mensagensVideo[cena.id]}
                                    </p>
                                  )}

                                  {videosCena[cena.id] && (
                                    <video
                                      key={videosCena[cena.id]}
                                      controls
                                      playsInline
                                      className="mx-auto mt-4 max-h-[640px] w-full max-w-sm rounded-xl border border-zinc-800 bg-black"
                                      src={videosCena[cena.id]}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 rounded-2xl border border-yellow-400/40 bg-black p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                            🎬 Projeto de vídeo completo
                          </p>
                          <h4 className="mt-2 text-xl font-black text-white">
                            Continuidade pronta para produção
                          </h4>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                            Todas as cenas abaixo pertencem ao mesmo comercial. O personagem-base,
                            o figurino e o cenário principal serão usados como referência de
                            continuidade quando a geração completa for ativada.
                          </p>
                        </div>

                        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-right">
                          <p className="text-[10px] font-black uppercase text-yellow-400">
                            Duração estimada
                          </p>
                          <p className="mt-1 text-2xl font-black text-white">
                            {Math.round(projetoVideoCompleto.duracaoTotal)} s
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {cenasOperacionais.length} {cenasOperacionais.length === 1 ? "cena" : "cenas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <Resumo
                          titulo="Personagem-base"
                          valor={projetoVideoCompleto.personagemBase}
                        />
                        <Resumo
                          titulo="Cenário principal"
                          valor={projetoVideoCompleto.cenarioPrincipal}
                        />
                        <Resumo
                          titulo="Figurino-base"
                          valor={projetoVideoCompleto.figurinoBase}
                        />
                      </div>

                      {personagemAtual && (
                        <div className="mt-5 rounded-xl border border-yellow-400/30 bg-zinc-950 p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/30 bg-black text-3xl">
                                {personagemAtual.imagemDataUrl ? (
                                  <img
                                    src={personagemAtual.imagemDataUrl}
                                    alt={personagemAtual.nome}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  "🎭"
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-400">
                                  Identidade visual vinculada
                                </p>
                                <p className="mt-1 truncate text-base font-black text-white">
                                  {personagemAtual.nome}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-400">
                                  Aparência: {personagemAtual.aparencia || "não definida"}
                                </p>
                                <p className="text-xs leading-5 text-zinc-400">
                                  Voz: {perfilVozDoPersonagem(personagemAtual.id).generoTimbre}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={aplicarPersonagemSelecionadoNasCenas}
                              className="shrink-0 rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black uppercase text-black"
                            >
                              🎭 Aplicar às {cenasOperacionais.length} cenas
                            </button>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-zinc-800 bg-black p-3">
                              <p className="text-[10px] font-black uppercase text-zinc-500">
                                Figurino fixo
                              </p>
                              <p className="mt-1 text-xs text-zinc-300">
                                {personagemAtual.roupa || "Não definido"}
                              </p>
                            </div>
                            <div className="rounded-xl border border-zinc-800 bg-black p-3">
                              <p className="text-[10px] font-black uppercase text-zinc-500">
                                Regra de fala
                              </p>
                              <p className="mt-1 text-xs text-zinc-300">
                                {perfilVozDoPersonagem(personagemAtual.id).falaLiteral
                                  ? "Falar exatamente como está no roteiro"
                                  : "Permitir adaptação da fala"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                          Sequência do vídeo
                        </p>

                        <div className="mt-3 grid gap-2">
                          {cenasOperacionais.map((cena, indice) => (
                            <div
                              key={`sequencia-${cena.id}`}
                              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-black px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase text-black">
                                    Cena {cena.numero}
                                  </span>
                                  {indice > 0 && (
                                    <span className="text-[10px] font-black uppercase text-emerald-400">
                                      ↳ Continuação da anterior
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 truncate text-sm font-black text-white">
                                  {cena.titulo}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                  {cena.fala}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                                {cena.duracao}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className={`mt-5 rounded-2xl border p-4 ${
                          validacaoProjetoVideo.aprovado
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-amber-400/40 bg-amber-400/5"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${
                              validacaoProjetoVideo.aprovado ? "text-emerald-400" : "text-amber-300"
                            }`}>
                              🛡️ Checklist automático
                            </p>
                            <h5 className="mt-2 text-lg font-black text-white">
                              {validacaoProjetoVideo.aprovado
                                ? "Projeto pronto para revisão final"
                                : `${validacaoProjetoVideo.problemas.length} ponto(s) precisam de atenção`}
                            </h5>
                            <p className="mt-1 text-xs leading-5 text-zinc-400">
                              Verificação automática antes de qualquer geração que consuma créditos.
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                            validacaoProjetoVideo.aprovado
                              ? "border-emerald-500/40 text-emerald-400"
                              : "border-amber-400/40 text-amber-300"
                          }`}>
                            {validacaoProjetoVideo.aprovado ? "✓ Tudo certo" : "⚠ Revisar"}
                          </span>
                        </div>

                        {validacaoProjetoVideo.aprovado ? (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {[
                              "Personagem-base selecionado",
                              "Foto de referência vinculada",
                              "Personagem definido em todas as cenas",
                              "Cenário definido em todas as cenas",
                              "Figurino definido em todas as cenas",
                              "Falas definidas",
                              "Ação e enquadramento definidos",
                              "Duração definida em todas as cenas",
                            ].map((item) => (
                              <div key={item} className="rounded-xl border border-emerald-500/20 bg-black px-3 py-2 text-xs font-bold text-emerald-300">
                                ✓ {item}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-2">
                            {validacaoProjetoVideo.problemas.map((problema, indice) => (
                              <div key={`${problema}-${indice}`} className="rounded-xl border border-amber-400/20 bg-black px-3 py-2 text-xs font-bold text-amber-200">
                                ⚠ {problema}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-400">
                              👁️ Prévia antes de gastar créditos
                            </p>
                            <p className="mt-1 text-sm leading-6 text-zinc-400">
                              Revise personagem, fala, ação, texto na tela e duração de cada cena antes da geração real.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIndiceCenaPrevia(0);
                              setPreviaProjetoAberta((aberta) => !aberta);
                            }}
                            className="shrink-0 rounded-xl border border-sky-400/50 px-4 py-3 text-xs font-black uppercase text-sky-300"
                          >
                            {previaProjetoAberta ? "✕ Fechar prévia" : "▶ Abrir prévia do vídeo"}
                          </button>
                        </div>

                        {previaProjetoAberta && cenasOperacionais.length > 0 && (() => {
                          const cenaPrevia =
                            cenasOperacionais[Math.min(indiceCenaPrevia, cenasOperacionais.length - 1)];

                          return (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-700 bg-black">
                              <div className="grid min-h-[420px] lg:grid-cols-[0.8fr_1.2fr]">
                                <div className="flex items-center justify-center border-b border-zinc-800 bg-zinc-950 p-6 lg:border-b-0 lg:border-r">
                                  <div className="text-center">
                                    <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-yellow-400/30 bg-black text-6xl">
                                      {personagemAtual?.imagemDataUrl ? (
                                        <img
                                          src={personagemAtual.imagemDataUrl}
                                          alt={personagemAtual.nome}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        "🎭"
                                      )}
                                    </div>
                                    <p className="mt-4 text-lg font-black text-white">
                                      {cenaPrevia.personagem}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {cenaPrevia.cenario}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {cenaPrevia.figurino}
                                    </p>
                                  </div>
                                </div>

                                <div className="p-5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-black uppercase text-yellow-400">
                                        Cena {cenaPrevia.numero} de {cenasOperacionais.length}
                                      </p>
                                      <h5 className="mt-1 text-xl font-black text-white">
                                        {cenaPrevia.titulo}
                                      </h5>
                                    </div>
                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                                      {cenaPrevia.duracao}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-3">
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                                      <p className="text-[10px] font-black uppercase text-zinc-500">
                                        🗣️ Fala exata
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-white">
                                        {cenaPrevia.fala}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                                      <p className="text-[10px] font-black uppercase text-zinc-500">
                                        🎬 Ação / direção
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                                        {cenaPrevia.acao}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                                      <p className="text-[10px] font-black uppercase text-zinc-500">
                                        📝 Texto na tela
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                                        {cenaPrevia.textoTela || "Sem texto na tela"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 border-t border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  disabled={indiceCenaPrevia === 0}
                                  onClick={() => setIndiceCenaPrevia((indice) => Math.max(0, indice - 1))}
                                  className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-30"
                                >
                                  ← Cena anterior
                                </button>

                                <div className="text-center text-xs font-bold text-zinc-400">
                                  {indiceCenaPrevia + 1}/{cenasOperacionais.length} •{" "}
                                  {Math.round(projetoVideoCompleto.duracaoTotal)} s estimados
                                </div>

                                <button
                                  type="button"
                                  disabled={indiceCenaPrevia >= cenasOperacionais.length - 1}
                                  onClick={() =>
                                    setIndiceCenaPrevia((indice) =>
                                      Math.min(cenasOperacionais.length - 1, indice + 1),
                                    )
                                  }
                                  className="rounded-xl border border-yellow-400/50 px-4 py-2 text-xs font-black uppercase text-yellow-400 disabled:opacity-30"
                                >
                                  Próxima cena →
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/30 bg-black p-4">
                          <input
                            type="checkbox"
                            checked={projetoAprovadoGeracao}
                            disabled={!validacaoProjetoVideo.aprovado}
                            onChange={(evento) => setProjetoAprovadoGeracao(evento.target.checked)}
                            className="mt-1 h-4 w-4 accent-emerald-500 disabled:opacity-40"
                          />
                          <div>
                            <p className="text-sm font-black text-white">
                              ✅ Aprovar vídeo para geração
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-400">
                              {validacaoProjetoVideo.aprovado
                                ? "Confirmo que revisei personagem, cenas, falas, textos e duração antes de usar créditos."
                                : "Corrija os itens indicados no checklist automático antes de aprovar a geração."}
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-white">
                            Salvar este projeto
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            Guarda roteiro, cenas, personagem, cenário, figurino e duração para continuar depois.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={salvarProjetoVideoAtual}
                          className="shrink-0 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-3 text-xs font-black uppercase text-emerald-400"
                        >
                          💾 Salvar em Meus Vídeos
                        </button>
                      </div>

                      {mensagemProjetosVideo && (
                        <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                          {mensagemProjetosVideo}
                        </p>
                      )}

                      <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
                        <div className="w-full">
                          <p className="text-sm font-black text-white">
                            Geração completa automática preparada
                          </p>
                          <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-400">
                            O fluxo já está programado para gerar a Cena 1 e continuar
                            automaticamente pelas demais cenas, mantendo o vídeo anterior como
                            contexto. Nenhuma geração será iniciada enquanto o modo seguro estiver bloqueado.
                          </p>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-5">
                          {cenasOperacionais.map((cena, indice) => (
                            <div
                              key={`fluxo-geracao-${cena.id}`}
                              className="rounded-xl border border-zinc-800 bg-black px-3 py-2 text-center"
                            >
                              <p className="text-[10px] font-black uppercase text-yellow-400">
                                {indice === 0 ? "Início" : "Continuação"}
                              </p>
                              <p className="mt-1 text-xs font-black text-white">
                                Cena {cena.numero}
                              </p>
                            </div>
                          ))}
                        </div>

                        {gerandoVideoCompleto && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-black text-zinc-300">
                              <span>Produção automática</span>
                              <span>{progressoVideoCompleto}%</span>
                            </div>
                            <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full bg-yellow-400 transition-all"
                                style={{ width: `${progressoVideoCompleto}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={gerarVideoCompletoAutomatico}
                          disabled={
                            !GERACAO_VIDEO_COMPLETO_LIBERADA ||
                            !validacaoProjetoVideo.aprovado ||
                            !projetoAprovadoGeracao ||
                            gerandoVideoCompleto
                          }
                          className={`mt-4 w-full rounded-xl px-4 py-3 text-center text-xs font-black uppercase leading-5 sm:text-sm ${
                            GERACAO_VIDEO_COMPLETO_LIBERADA &&
                            validacaoProjetoVideo.aprovado &&
                            projetoAprovadoGeracao
                              ? "bg-yellow-400 text-black"
                              : "bg-zinc-800 text-zinc-500"
                          } disabled:cursor-not-allowed`}
                        >
                          {gerandoVideoCompleto
                            ? `🎬 Gerando vídeo completo — ${progressoVideoCompleto}%`
                            : !GERACAO_VIDEO_COMPLETO_LIBERADA
                              ? "🔒 Geração completa programada — aguardando créditos"
                              : !validacaoProjetoVideo.aprovado
                                ? "🔒 Corrija o checklist antes de gerar"
                                : !projetoAprovadoGeracao
                                  ? "🔒 Revise e aprove a prévia antes de gerar"
                                  : "🎬 Gerar vídeo completo"}
                        </button>

                        {mensagemVideoCompleto && (
                          <p className="mt-3 rounded-xl border border-yellow-400/20 bg-black px-3 py-2 text-xs font-bold text-yellow-300">
                            {mensagemVideoCompleto}
                          </p>
                        )}

                        {videoCompletoUrl && (
                          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-black p-4">
                            <p className="text-xs font-black uppercase text-emerald-400">
                              ✓ Vídeo final
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              ID final: {videoCompletoId}
                            </p>
                            <video
                              key={videoCompletoUrl}
                              controls
                              playsInline
                              className="mx-auto mt-4 max-h-[720px] w-full max-w-md rounded-xl border border-zinc-800 bg-black"
                              src={videoCompletoUrl}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {historicoRascunhos.length > 0 && (
                <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-zinc-950 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
                        Rascunhos recentes
                      </p>
                      <h4 className="mt-1 text-xl font-black text-white">
                        Últimos roteiros da Sala IA
                      </h4>
                      <p className="mt-1 text-sm text-zinc-400">
                        Os 10 roteiros mais recentes ficam disponíveis para recuperar.
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-white">
                      {historicoRascunhos.length}/10
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {historicoRascunhos.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {item.titulo}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                            {item.ideia || item.roteiro}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {new Date(item.atualizadoEm).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => abrirRascunhoHistorico(item)}
                          className="shrink-0 rounded-xl border border-yellow-400/60 px-4 py-2 text-xs font-black uppercase text-yellow-400"
                        >
                          Abrir este roteiro
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                      Roteiros salvos
                    </p>
                    <h4 className="mt-1 text-xl font-black text-white">
                      Histórico
                    </h4>
                  </div>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                    {roteirosSalvos.length}
                  </span>
                </div>

                {roteirosSalvos.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
                    Nenhum roteiro salvo ainda.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {roteirosSalvos.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 ${
                          item.id === roteiroEditandoId
                            ? "border-yellow-400 bg-yellow-400/5"
                            : "border-zinc-800 bg-zinc-950"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h5 className="font-black text-white">{item.titulo}</h5>
                            <p className="mt-1 text-xs text-zinc-400">
                              {item.categoria} • {item.personagemNome} • {item.cenarioNome}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Atualizado em {new Date(item.atualizadoEm).toLocaleString("pt-BR")}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => abrirRoteiroSalvo(item)}
                              className="rounded-xl border border-yellow-400/50 px-3 py-2 text-xs font-black uppercase text-yellow-400"
                            >
                              ✏️ Abrir
                            </button>
                            <button
                              type="button"
                              onClick={() => excluirRoteiroSalvo(item.id)}
                              className="rounded-xl border border-red-500/50 px-3 py-2 text-xs font-black uppercase text-red-400"
                            >
                              🗑 Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {aba === "vozes" && (
            <div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  🎙️ Voz e Narração
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  Voz fixa dos personagens
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Defina como cada personagem deverá falar. Estas configurações serão
                  reutilizadas em todas as cenas do mesmo personagem.
                </p>
              </div>

              <div className="mt-6 grid gap-4">
                {personagens.map((personagem) => {
                  const perfil = perfilVozDoPersonagem(personagem.id);

                  return (
                    <div
                      key={`voz-${personagem.id}`}
                      className={`rounded-2xl border p-5 ${
                        personagem.principal
                          ? "border-yellow-400/50 bg-yellow-400/5"
                          : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-white">
                              {personagem.nome}
                            </h4>
                            {personagem.principal && (
                              <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase text-black">
                                ⭐ Principal
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {personagem.funcao || "Personagem CHOQUESEG"}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-400">
                          Voz configurável
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                            Idioma
                          </span>
                          <select
                            value={perfil.idioma}
                            onChange={(evento) =>
                              atualizarPerfilVoz(personagem.id, "idioma", evento.target.value)
                            }
                            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                          >
                            <option>Português do Brasil (pt-BR)</option>
                            <option>Português de Portugal (pt-PT)</option>
                            <option>Inglês (en-US)</option>
                            <option>Espanhol (es)</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                            Velocidade
                          </span>
                          <select
                            value={perfil.velocidade}
                            onChange={(evento) =>
                              atualizarPerfilVoz(personagem.id, "velocidade", evento.target.value)
                            }
                            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                          >
                            <option>Lenta</option>
                            <option>Normal</option>
                            <option>Rápida</option>
                          </select>
                        </label>

                        <CampoTexto
                          titulo="Gênero / timbre"
                          valor={perfil.generoTimbre}
                          aoAlterar={(valor) =>
                            atualizarPerfilVoz(personagem.id, "generoTimbre", valor)
                          }
                          placeholder="Ex.: Masculina, grave, segura e natural."
                        />

                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
                            Estilo de fala
                          </span>
                          <select
                            value={perfil.estilo}
                            onChange={(evento) =>
                              atualizarPerfilVoz(personagem.id, "estilo", evento.target.value)
                            }
                            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
                          >
                            <option>Comercial natural e convincente</option>
                            <option>Profissional e técnico</option>
                            <option>Amigável e próximo</option>
                            <option>Energético e promocional</option>
                            <option>Calmo e institucional</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-4">
                        <CampoArea
                          titulo="Pronúncia / instruções da voz"
                          valor={perfil.pronuncia}
                          aoAlterar={(valor) =>
                            atualizarPerfilVoz(personagem.id, "pronuncia", valor)
                          }
                          placeholder="Ex.: Pronunciar CHOQUESEG com clareza. Fazer pausa antes do telefone."
                        />
                      </div>

                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-yellow-400/30 bg-black p-4">
                        <input
                          type="checkbox"
                          checked={perfil.falaLiteral}
                          onChange={(evento) =>
                            atualizarPerfilVoz(personagem.id, "falaLiteral", evento.target.checked)
                          }
                          className="mt-1 h-4 w-4 accent-yellow-400"
                        />
                        <div>
                          <p className="text-sm font-black text-white">
                            Falar exatamente como está no roteiro
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            Não resumir, não trocar palavras e não improvisar a fala definida para a cena.
                          </p>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={salvarPerfisVoz}
                  className="rounded-xl bg-yellow-400 px-5 py-3 font-black uppercase text-black transition hover:bg-yellow-300"
                >
                  💾 Salvar configurações de voz
                </button>

                {mensagemVozConfig && (
                  <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs font-bold text-yellow-300">
                    {mensagemVozConfig}
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
                  Próxima integração
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  A configuração já pode ser salva sem gerar áudio. A conexão com a voz real
                  será ativada depois, junto com a produção final, para evitar consumo de créditos agora.
                </p>
              </div>
            </div>
          )}

          {aba === "videos" && (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                    📚 Meus Vídeos
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Projetos de vídeo
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                    Seus comerciais preparados ficam salvos aqui para abrir, revisar e continuar a produção depois.
                  </p>
                </div>

                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-black text-zinc-300">
                  {projetosVideo.length} {projetosVideo.length === 1 ? "projeto" : "projetos"}
                </span>
              </div>

              {projetosVideo.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
                  <div className="text-5xl">🎬</div>
                  <h4 className="mt-4 text-xl font-black text-white">
                    Nenhum projeto salvo ainda
                  </h4>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                    Transforme um roteiro em cenas e use o botão “Salvar em Meus Vídeos”
                    no Projeto de Vídeo Completo.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {projetosVideo.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase text-black">
                              {item.status}
                            </span>
                            <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-black uppercase text-zinc-300">
                              {Math.round(item.duracaoTotal)} s
                            </span>
                            <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-black uppercase text-zinc-300">
                              {item.cenas.length} {item.cenas.length === 1 ? "cena" : "cenas"}
                            </span>
                            {item.aprovadoGeracao && (
                              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-400">
                                ✓ Prévia aprovada
                              </span>
                            )}
                            {item.geracaoCompletaPreparada && (
                              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[10px] font-black uppercase text-sky-400">
                                🎬 Continuidade preparada
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 text-lg font-black text-white">
                            {item.titulo}
                          </h4>
                          <p className="mt-1 text-xs text-zinc-400">
                            {item.categoria} • {item.personagem}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.cenario} • {item.figurino}
                          </p>
                          {item.perfilVoz && (
                            <p className="mt-1 text-xs text-zinc-500">
                              🎙️ {item.perfilVoz.generoTimbre} • {item.perfilVoz.velocidade}
                              {item.perfilVoz.falaLiteral ? " • fala literal" : ""}
                            </p>
                          )}
                          <p className="mt-2 text-[11px] text-zinc-600">
                            Salvo em {new Date(item.atualizadoEm).toLocaleString("pt-BR")}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                                item.aprovadoGeracao
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
                              }`}
                            >
                              {item.aprovadoGeracao ? "✓ PRÉVIA APROVADA" : "○ PRÉVIA NÃO APROVADA"}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                                item.geracaoCompletaPreparada
                                  ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
                                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
                              }`}
                            >
                              {item.geracaoCompletaPreparada
                                ? "🎬 CONTINUIDADE PREPARADA"
                                : "○ CONTINUIDADE PENDENTE"}
                            </span>
                          </div>

                          {(item.aprovadoGeracao || item.geracaoCompletaPreparada) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.aprovadoGeracao && (
                                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400">
                                  ✓ Prévia aprovada
                                </span>
                              )}
                              {item.geracaoCompletaPreparada && (
                                <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-sky-400">
                                  🎬 Continuidade preparada
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirProjetoVideo(item)}
                            className="rounded-xl border border-yellow-400/50 px-4 py-2 text-xs font-black uppercase text-yellow-400"
                          >
                            ✏️ Abrir projeto
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirProjetoVideo(item.id)}
                            className="rounded-xl border border-red-500/50 px-4 py-2 text-xs font-black uppercase text-red-400"
                          >
                            🗑 Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-black px-4 py-3">
      <span className="text-xs font-black uppercase text-zinc-500">{titulo}</span>
      <strong className="text-right text-sm text-white">{valor}</strong>
    </div>
  );
}

function CampoTexto({
  titulo,
  valor,
  aoAlterar,
  placeholder,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
        {titulo}
      </span>
      <input
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function CampoArea({
  titulo,
  valor,
  aoAlterar,
  placeholder,
}: {
  titulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-zinc-400">
        {titulo}
      </span>
      <textarea
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        rows={3}
        placeholder={placeholder}
        className="min-h-[92px] w-full resize-y rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm leading-5 text-white outline-none focus:border-yellow-400"
      />
    </label>
  );
}

function PainelEmBreve({
  icone,
  titulo,
  texto,
}: {
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
      <div className="text-5xl">{icone}</div>
      <h3 className="mt-4 text-2xl font-black text-white">{titulo}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        {texto}
      </p>
      <div className="mx-auto mt-6 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase text-yellow-400">
        Próxima etapa
      </div>
    </div>
  );
}