

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type ConfigEmpresa = {
  id?: number;
  nome_empresa: string;
  subtitulo: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  instagram: string;
  slogan: string;
  logo_url: string;
  logo_transparente_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_texto: string;
  marca_dagua_ativa: boolean;
  marca_dagua_opacidade: number;
};

const CONFIG_INICIAL: ConfigEmpresa = {
  nome_empresa: "CHOQUESEG",
  subtitulo: "SISTEMAS E ENERGIA SOLAR",
  razao_social: "",
  cnpj: "",
  endereco: "",
  cidade: "",
  estado: "SE",
  cep: "",
  telefone: "",
  whatsapp: "",
  instagram: "@choqueseg",
  slogan: "Deixe o sol pagar pelo seu conforto",
  logo_url: "",
  logo_transparente_url: "",
  cor_primaria: "#FACC15",
  cor_secundaria: "#000000",
  cor_texto: "#FFFFFF",
  marca_dagua_ativa: true,
  marca_dagua_opacidade: 0.2,
};

function extensaoDoArquivo(arquivo: File) {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase();
  if (extensao === "jpg" || extensao === "jpeg") return "jpg";
  if (extensao === "webp") return "webp";
  return "png";
}

export default function ConfigEmpresaModule() {
  const [config, setConfig] = useState<ConfigEmpresa>(CONFIG_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro" | "info">("info");

  const [arquivoLogo, setArquivoLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState("");

  const [arquivoTransparente, setArquivoTransparente] = useState<File | null>(null);
  const [blobTransparente, setBlobTransparente] = useState<Blob | null>(null);
  const [previewTransparente, setPreviewTransparente] = useState("");

  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoTransparente, setEnviandoTransparente] = useState(false);

  useEffect(() => {
    void carregarConfiguracao();

    return () => {
      if (previewLogo.startsWith("blob:")) URL.revokeObjectURL(previewLogo);
      if (previewTransparente.startsWith("blob:")) URL.revokeObjectURL(previewTransparente);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarConfiguracao() {
    try {
      setCarregando(true);
      setMensagem("");

      const { data, error } = await supabase
        .from("configuracoes_empresa")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          nome_empresa: data.nome_empresa ?? "",
          subtitulo: data.subtitulo ?? "SISTEMAS E ENERGIA SOLAR",
          razao_social: data.razao_social ?? "",
          cnpj: data.cnpj ?? "",
          endereco: data.endereco ?? "",
          cidade: data.cidade ?? "",
          estado: data.estado ?? "",
          cep: data.cep ?? "",
          telefone: data.telefone ?? "",
          whatsapp: data.whatsapp ?? "",
          instagram: data.instagram ?? "",
          slogan: data.slogan ?? "",
          logo_url: data.logo_url ?? "",
          logo_transparente_url: data.logo_transparente_url ?? "",
          cor_primaria: data.cor_primaria ?? "#FACC15",
          cor_secundaria: data.cor_secundaria ?? "#000000",
          cor_texto: data.cor_texto ?? "#FFFFFF",
          marca_dagua_ativa: data.marca_dagua_ativa ?? true,
          marca_dagua_opacidade: Number(data.marca_dagua_opacidade ?? 0.2),
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar configurações da empresa:", erro);
      mostrarMensagem("Não foi possível carregar as configurações da empresa.", "erro");
    } finally {
      setCarregando(false);
    }
  }

  function mostrarMensagem(texto: string, tipo: "sucesso" | "erro" | "info" = "info") {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function alterarCampo<K extends keyof ConfigEmpresa>(
    campo: K,
    valor: ConfigEmpresa[K],
  ) {
    setConfig((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function validarImagem(arquivo: File) {
    const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

    if (!tiposPermitidos.includes(arquivo.type)) {
      mostrarMensagem("Use uma imagem PNG, JPG/JPEG ou WebP.", "erro");
      return false;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarMensagem("A imagem deve ter no máximo 10 MB.", "erro");
      return false;
    }

    return true;
  }

  function selecionarLogo(arquivo?: File) {
    if (!arquivo || !validarImagem(arquivo)) return;

    if (previewLogo.startsWith("blob:")) URL.revokeObjectURL(previewLogo);
    const url = URL.createObjectURL(arquivo);

    setArquivoLogo(arquivo);
    setPreviewLogo(url);
    setBlobTransparente(null);
    setArquivoTransparente(null);

    if (previewTransparente.startsWith("blob:")) {
      URL.revokeObjectURL(previewTransparente);
    }
    setPreviewTransparente("");

    mostrarMensagem(
      "Imagem principal selecionada. Envie-a como logomarca principal. Se tiver um PNG transparente pronto, selecione-o separadamente para a marca d’água.",
      "info",
    );
  }

  function selecionarTransparenteManual(arquivo?: File) {
    if (!arquivo || !validarImagem(arquivo)) return;

    if (previewTransparente.startsWith("blob:")) {
      URL.revokeObjectURL(previewTransparente);
    }

    const url = URL.createObjectURL(arquivo);
    setArquivoTransparente(arquivo);
    setBlobTransparente(arquivo);
    setPreviewTransparente(url);
    mostrarMensagem("Versão transparente selecionada para pré-visualização.", "info");
  }

  async function enviarLogoPrincipal() {
    if (!arquivoLogo) {
      mostrarMensagem("Selecione primeiro a logomarca principal.", "erro");
      return;
    }

    try {
      setEnviandoLogo(true);
      mostrarMensagem("Enviando logomarca principal...", "info");

      const extensao = extensaoDoArquivo(arquivoLogo);
      const caminho = `logos/logo-principal.${extensao}`;

      const { error } = await supabase.storage
        .from("empresa")
        .upload(caminho, arquivoLogo, {
          upsert: true,
          contentType: arquivoLogo.type,
          cacheControl: "3600",
        });

      if (error) throw error;

      const { data } = supabase.storage.from("empresa").getPublicUrl(caminho);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      alterarCampo("logo_url", url);
      mostrarMensagem(
        "Logomarca principal enviada. Clique em Salvar configurações para confirmar.",
        "sucesso",
      );
    } catch (erro) {
      console.error("Erro ao enviar logomarca:", erro);
      mostrarMensagem(
        erro instanceof Error
          ? `Erro ao enviar a logomarca: ${erro.message}`
          : "Não foi possível enviar a logomarca.",
        "erro",
      );
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function enviarVersaoTransparente() {
    const arquivo = arquivoTransparente ?? blobTransparente;

    if (!arquivo) {
      mostrarMensagem(
        "Selecione primeiro um PNG transparente para a marca d’água.",
        "erro",
      );
      return;
    }

    try {
      setEnviandoTransparente(true);
      mostrarMensagem("Enviando versão transparente...", "info");

      const caminho = "logos/logo-transparente.png";

      const { error } = await supabase.storage
        .from("empresa")
        .upload(caminho, arquivo, {
          upsert: true,
          contentType: "image/png",
          cacheControl: "3600",
        });

      if (error) throw error;

      const { data } = supabase.storage.from("empresa").getPublicUrl(caminho);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      alterarCampo("logo_transparente_url", url);
      mostrarMensagem(
        "Versão transparente enviada. Clique em Salvar configurações para confirmar.",
        "sucesso",
      );
    } catch (erro) {
      console.error("Erro ao enviar versão transparente:", erro);
      mostrarMensagem(
        erro instanceof Error
          ? `Erro ao enviar a versão transparente: ${erro.message}`
          : "Não foi possível enviar a versão transparente.",
        "erro",
      );
    } finally {
      setEnviandoTransparente(false);
    }
  }

  async function salvarConfiguracao() {
    try {
      setSalvando(true);
      setMensagem("");

      const payload = {
        nome_empresa: config.nome_empresa.trim(),
        subtitulo: config.subtitulo.trim(),
        razao_social: config.razao_social.trim(),
        cnpj: config.cnpj.trim(),
        endereco: config.endereco.trim(),
        cidade: config.cidade.trim(),
        estado: config.estado.trim(),
        cep: config.cep.trim(),
        telefone: config.telefone.trim(),
        whatsapp: config.whatsapp.trim(),
        instagram: config.instagram.trim(),
        slogan: config.slogan.trim(),
        logo_url: config.logo_url.trim(),
        logo_transparente_url: config.logo_transparente_url.trim(),
        cor_primaria: config.cor_primaria,
        cor_secundaria: config.cor_secundaria,
        cor_texto: config.cor_texto,
        marca_dagua_ativa: config.marca_dagua_ativa,
        marca_dagua_opacidade: config.marca_dagua_opacidade,
        atualizado_em: new Date().toISOString(),
      };

      let resultado;

      if (config.id) {
        resultado = await supabase
          .from("configuracoes_empresa")
          .update(payload)
          .eq("id", config.id)
          .select("*")
          .single();
      } else {
        resultado = await supabase
          .from("configuracoes_empresa")
          .insert(payload)
          .select("*")
          .single();
      }

      if (resultado.error) throw resultado.error;

      if (resultado.data) {
        setConfig((atual) => ({
          ...atual,
          id: resultado.data.id,
        }));
      }

      mostrarMensagem("Configurações salvas com sucesso.", "sucesso");
    } catch (erro) {
      console.error("Erro ao salvar configurações da empresa:", erro);

      mostrarMensagem(
        erro instanceof Error
          ? `Erro ao salvar: ${erro.message}`
          : "Não foi possível salvar as configurações.",
        "erro",
      );
    } finally {
      setSalvando(false);
    }
  }

  const imagemPrincipal = previewLogo || config.logo_url;
  const imagemTransparente = previewTransparente || config.logo_transparente_url;

  if (carregando) {
    return (
      <section className="p-4 md:p-7">
        <div className="mx-auto max-w-6xl rounded-3xl border border-yellow-400/30 bg-black p-6 text-zinc-400">
          Carregando configurações da empresa...
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-yellow-400/30 bg-black p-5 shadow-2xl md:p-7">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
            ⚙️ Administração
          </p>

          <h2 className="mt-2 text-3xl font-black uppercase text-white">
            Configurações da Empresa
          </h2>

          <p className="mt-3 max-w-3xl text-zinc-400">
            Dados institucionais utilizados pelos módulos e documentos do CHOQUESEG PRO.
          </p>

          {mensagem && (
            <div
              className={`mt-5 rounded-xl border px-4 py-3 text-sm font-bold ${
                tipoMensagem === "sucesso"
                  ? "border-green-500/40 bg-green-500/10 text-green-300"
                  : tipoMensagem === "erro"
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
              }`}
            >
              {mensagem}
            </div>
          )}

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="🏢 Dados da empresa">
              <Campo
                titulo="Nome / título principal"
                valor={config.nome_empresa}
                aoAlterar={(valor) => alterarCampo("nome_empresa", valor)}
              />

              <Campo
                titulo="Subtítulo"
                valor={config.subtitulo}
                aoAlterar={(valor) => alterarCampo("subtitulo", valor)}
              />

              <p className="-mt-2 text-xs leading-relaxed text-zinc-500">
                Exemplo visual: CHOQUESEG em destaque e SISTEMAS E ENERGIA SOLAR em tamanho menor.
              </p>

              <Campo
                titulo="Razão social"
                valor={config.razao_social}
                aoAlterar={(valor) => alterarCampo("razao_social", valor)}
              />

              <Campo
                titulo="CNPJ"
                valor={config.cnpj}
                aoAlterar={(valor) => alterarCampo("cnpj", valor)}
              />

              <Campo
                titulo="Endereço"
                valor={config.endereco}
                aoAlterar={(valor) => alterarCampo("endereco", valor)}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Campo
                  titulo="Cidade"
                  valor={config.cidade}
                  aoAlterar={(valor) => alterarCampo("cidade", valor)}
                />

                <Campo
                  titulo="Estado"
                  valor={config.estado}
                  aoAlterar={(valor) => alterarCampo("estado", valor)}
                />

                <Campo
                  titulo="CEP"
                  valor={config.cep}
                  aoAlterar={(valor) => alterarCampo("cep", valor)}
                />
              </div>
            </Bloco>

            <Bloco titulo="📞 Contatos">
              <Campo
                titulo="Telefone"
                valor={config.telefone}
                aoAlterar={(valor) => alterarCampo("telefone", valor)}
              />

              <Campo
                titulo="WhatsApp"
                valor={config.whatsapp}
                aoAlterar={(valor) => alterarCampo("whatsapp", valor)}
              />

              <Campo
                titulo="Instagram"
                valor={config.instagram}
                aoAlterar={(valor) => alterarCampo("instagram", valor)}
              />

              <Campo
                titulo="Slogan"
                valor={config.slogan}
                aoAlterar={(valor) => alterarCampo("slogan", valor)}
              />
            </Bloco>
          </div>

          <div className="mt-6 rounded-3xl border border-yellow-400/30 bg-zinc-950 p-5 md:p-6">
            <div>
              <h3 className="text-xl font-black uppercase text-yellow-400">🛡️ Logomarca</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Envie a logomarca principal da empresa. Para marca d&apos;água, você pode selecionar separadamente um PNG que já tenha fundo transparente.
              </p>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="font-black uppercase text-white">Logomarca principal</p>
                <p className="mt-1 text-xs text-zinc-500">PNG, JPG/JPEG ou WebP. Máximo de 10 MB.</p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(evento) => selecionarLogo(evento.target.files?.[0])}
                  className="mt-4 block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-yellow-400 file:px-4 file:py-3 file:font-black file:uppercase file:text-black"
                />

                {imagemPrincipal && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="mb-3 text-xs font-black uppercase text-zinc-500">Pré-visualização</p>
                    <img
                      src={imagemPrincipal}
                      alt="Pré-visualização da logomarca principal"
                      className="mx-auto max-h-52 max-w-full object-contain"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!arquivoLogo || enviandoLogo}
                  onClick={() => void enviarLogoPrincipal()}
                  className="mt-4 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviandoLogo ? "Enviando..." : "⬆ Enviar logomarca"}
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="font-black uppercase text-white">Versão transparente / marca d&apos;água</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Opcional. Se você já tiver a logomarca em PNG transparente, selecione o arquivo aqui. O sistema não fará remoção automática de fundo.
                  </p>

                  <input
                    type="file"
                    accept="image/png"
                    onChange={(evento) => selecionarTransparenteManual(evento.target.files?.[0])}
                    className="mt-4 block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-800 file:px-4 file:py-3 file:font-black file:uppercase file:text-white"
                  />

                  {imagemTransparente && (
                    <div
                      className="mt-4 min-h-48 rounded-xl border border-zinc-700 p-4"
                      style={{
                        backgroundColor: "#f3f3f3",
                        backgroundImage:
                          "linear-gradient(45deg,#d1d1d1 25%,transparent 25%),linear-gradient(-45deg,#d1d1d1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d1d1d1 75%),linear-gradient(-45deg,transparent 75%,#d1d1d1 75%)",
                        backgroundSize: "24px 24px",
                        backgroundPosition: "0 0,0 12px,12px -12px,-12px 0px",
                      }}
                    >
                      <img
                        src={imagemTransparente}
                        alt="Pré-visualização da logomarca transparente"
                        className="mx-auto max-h-52 max-w-full object-contain"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!blobTransparente || enviandoTransparente}
                    onClick={() => void enviarVersaoTransparente()}
                    className="mt-4 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {enviandoTransparente ? "Enviando..." : "⬆ Enviar versão transparente"}
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="font-black uppercase text-white">Marca d&apos;água nos documentos</p>

                  <label className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <input
                      type="checkbox"
                      checked={config.marca_dagua_ativa}
                      onChange={(evento) => alterarCampo("marca_dagua_ativa", evento.target.checked)}
                      className="h-5 w-5 accent-yellow-400"
                    />
                    <span className="font-bold text-white">Ativar marca d&apos;água</span>
                  </label>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold uppercase text-zinc-300">Opacidade</span>
                      <span className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 font-black text-yellow-300">
                        {Math.round(config.marca_dagua_opacidade * 100)}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0.05"
                      max="0.30"
                      step="0.01"
                      value={config.marca_dagua_opacidade}
                      onChange={(evento) =>
                        alterarCampo("marca_dagua_opacidade", Number(evento.target.value))
                      }
                      className="mt-3 w-full accent-yellow-400"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Recomendado: 10% a 30%. Comece em 20%.</p>
                  </div>

                  <div className="relative mt-4 min-h-60 overflow-hidden rounded-xl border border-zinc-700 bg-white p-5 text-black">
                    <div className="flex items-start justify-between border-b border-yellow-500 pb-3">
                      <div>
                        <p className="text-lg font-black uppercase leading-none">{config.nome_empresa || "CHOQUESEG"}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                          {config.subtitulo || "SISTEMAS E ENERGIA SOLAR"}
                        </p>
                        <p className="mt-1 text-xs">{config.telefone || "Telefone"} • {config.instagram || "@choqueseg"}</p>
                      </div>
                      <p className="text-sm font-black">ORÇAMENTO</p>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-px bg-zinc-300 text-center text-[10px] font-bold">
                      <div className="bg-zinc-100 p-2">ITEM</div>
                      <div className="bg-zinc-100 p-2">DESCRIÇÃO</div>
                      <div className="bg-zinc-100 p-2">QUANT.</div>
                      <div className="bg-zinc-100 p-2">VALOR</div>
                    </div>

                    {config.marca_dagua_ativa && imagemTransparente && (
                      <img
                        src={imagemTransparente}
                        alt="Prévia da marca d'água"
                        className="pointer-events-none absolute left-1/2 top-1/2 w-[55%] -translate-x-1/2 -translate-y-1/2 object-contain"
                        style={{ opacity: config.marca_dagua_opacidade }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="🎨 Identidade visual">
              <CampoCor
                titulo="Cor primária"
                valor={config.cor_primaria}
                aoAlterar={(valor) => alterarCampo("cor_primaria", valor)}
              />

              <CampoCor
                titulo="Cor secundária"
                valor={config.cor_secundaria}
                aoAlterar={(valor) => alterarCampo("cor_secundaria", valor)}
              />

              <CampoCor
                titulo="Cor do texto"
                valor={config.cor_texto}
                aoAlterar={(valor) => alterarCampo("cor_texto", valor)}
              />
            </Bloco>

            <Bloco titulo="👁️ Pré-visualização da identidade">
              <div
                className="rounded-2xl border border-zinc-700 p-5"
                style={{
                  backgroundColor: config.cor_secundaria,
                  color: config.cor_texto,
                }}
              >
                {imagemPrincipal && (
                  <img
                    src={imagemPrincipal}
                    alt="Logomarca da empresa"
                    className="mb-4 max-h-24 max-w-[220px] object-contain"
                  />
                )}

                <p
                  className="text-2xl font-black uppercase"
                  style={{ color: config.cor_primaria }}
                >
                  {config.nome_empresa || "CHOQUESEG"}
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] opacity-80">
                  {config.subtitulo || "SISTEMAS E ENERGIA SOLAR"}
                </p>

                <p className="mt-2 text-sm">{config.slogan || "Slogan da empresa"}</p>

                <p className="mt-4 text-xs opacity-70">
                  {config.telefone || "Telefone"} • {config.instagram || "@instagram"}
                </p>
              </div>
            </Bloco>
          </div>

          <button
            type="button"
            onClick={() => void salvarConfiguracao()}
            disabled={salvando}
            className="mt-7 w-full rounded-xl bg-yellow-400 px-5 py-4 font-black uppercase text-black transition hover:bg-yellow-300 disabled:opacity-60 md:w-auto"
          >
            {salvando ? "Salvando..." : "💾 Salvar configurações"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="font-black uppercase text-yellow-400">{titulo}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
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
      <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
        {titulo}
      </span>

      <input
        type="text"
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-yellow-400"
      />
    </label>
  );
}

function CampoCor({
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
      <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
        {titulo}
      </span>

      <div className="flex gap-3">
        <input
          type="color"
          value={valor}
          onChange={(evento) => aoAlterar(evento.target.value)}
          className="h-12 w-16 cursor-pointer rounded-lg border border-zinc-700 bg-black"
        />

        <input
          type="text"
          value={valor}
          onChange={(evento) => aoAlterar(evento.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black px-4 py-3 font-mono text-white outline-none focus:border-yellow-400"
        />
      </div>
    </label>
  );
}
