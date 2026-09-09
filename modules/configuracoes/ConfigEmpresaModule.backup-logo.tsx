"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type ConfigEmpresa = {
  id?: number;
  nome_empresa: string;
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
  marca_dagua_opacidade: 0.08,
};

export default function ConfigEmpresaModule() {
  const [config, setConfig] = useState<ConfigEmpresa>(CONFIG_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    void carregarConfiguracao();
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
          marca_dagua_opacidade: Number(data.marca_dagua_opacidade ?? 0.08),
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar configurações da empresa:", erro);
      setMensagem("Não foi possível carregar as configurações da empresa.");
    } finally {
      setCarregando(false);
    }
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

  async function salvarConfiguracao() {
    try {
      setSalvando(true);
      setMensagem("");

      const payload = {
        nome_empresa: config.nome_empresa.trim(),
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

      setMensagem("Configurações salvas com sucesso.");
    } catch (erro) {
      console.error("Erro ao salvar configurações da empresa:", erro);

      setMensagem(
        erro instanceof Error
          ? `Erro ao salvar: ${erro.message}`
          : "Não foi possível salvar as configurações.",
      );
    } finally {
      setSalvando(false);
    }
  }

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
            Dados institucionais utilizados pelos módulos e documentos do
            CHOQUESEG PRO.
          </p>

          {mensagem && (
            <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300">
              {mensagem}
            </div>
          )}

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <Bloco titulo="🏢 Dados da empresa">
              <Campo
                titulo="Nome da empresa"
                valor={config.nome_empresa}
                aoAlterar={(valor) => alterarCampo("nome_empresa", valor)}
              />

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

            <Bloco titulo="🛡️ Logomarca">
              <Campo
                titulo="URL da logomarca"
                valor={config.logo_url}
                aoAlterar={(valor) => alterarCampo("logo_url", valor)}
              />

              <Campo
                titulo="URL da logomarca transparente"
                valor={config.logo_transparente_url}
                aoAlterar={(valor) =>
                  alterarCampo("logo_transparente_url", valor)
                }
              />

              <p className="text-xs leading-relaxed text-zinc-500">
                Nesta primeira etapa, as URLs ficam salvas. Na próxima,
                adicionaremos upload direto da galeria ou dos arquivos.
              </p>
            </Bloco>

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

            <Bloco titulo="📄 Documentos">
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <input
                  type="checkbox"
                  checked={config.marca_dagua_ativa}
                  onChange={(evento) =>
                    alterarCampo("marca_dagua_ativa", evento.target.checked)
                  }
                  className="h-5 w-5 accent-yellow-400"
                />

                <span className="font-bold text-white">
                  Usar marca d&apos;água nos documentos
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold uppercase text-zinc-300">
                  Opacidade da marca d&apos;água
                </span>

                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.01"
                  value={config.marca_dagua_opacidade}
                  onChange={(evento) =>
                    alterarCampo(
                      "marca_dagua_opacidade",
                      Number(evento.target.value),
                    )
                  }
                  className="w-full accent-yellow-400"
                />

                <p className="mt-2 text-sm text-zinc-400">
                  {Math.round(config.marca_dagua_opacidade * 100)}%
                </p>
              </label>
            </Bloco>

            <Bloco titulo="👁️ Pré-visualização">
              <div
                className="rounded-2xl border border-zinc-700 p-5"
                style={{
                  backgroundColor: config.cor_secundaria,
                  color: config.cor_texto,
                }}
              >
                <p
                  className="text-2xl font-black uppercase"
                  style={{ color: config.cor_primaria }}
                >
                  {config.nome_empresa || "CHOQUESEG"}
                </p>

                <p className="mt-2 text-sm">
                  {config.slogan || "Slogan da empresa"}
                </p>

                <p className="mt-4 text-xs opacity-70">
                  {config.telefone || "Telefone"} •{" "}
                  {config.instagram || "@instagram"}
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