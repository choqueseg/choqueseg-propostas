"use client";

import { useEffect, useState } from "react";

type Funcionario = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  usuario: string;
  senha: string;
  cargo: string;
  nivelAcesso: string;
  status: "Ativo" | "Inativo";
};

const funcionarioInicial: Omit<Funcionario, "id"> = {
  nome: "",
  telefone: "",
  email: "",
  usuario: "",
  senha: "",
  cargo: "",
  nivelAcesso: "Funcionário",
  status: "Ativo",
};

export default function CadastroFuncionario() {
  const [formulario, setFormulario] = useState(funcionarioInicial);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem("choqueseg-funcionarios");

    if (dadosSalvos) {
      setFuncionarios(JSON.parse(dadosSalvos));
    }
  }, []);

  function atualizarCampo(
    campo: keyof typeof funcionarioInicial,
    valor: string
  ) {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: valor,
    }));
  }

  function salvarFuncionario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!formulario.nome.trim()) {
      alert("Informe o nome do funcionário.");
      return;
    }

    if (!formulario.telefone.trim()) {
      alert("Informe o telefone do funcionário.");
      return;
    }
if (!formulario.usuario.trim()) {
  alert("Informe o usuário de acesso.");
  return;
}

if (!formulario.senha.trim()) {
  alert("Informe a senha de acesso.");
  return;
}

if (formulario.senha.length < 4) {
  alert("A senha deve ter pelo menos 4 caracteres.");
  return;
}

const usuarioJaExiste = funcionarios.some(
  (funcionario) =>
    funcionario.usuario.trim().toLowerCase() ===
    formulario.usuario.trim().toLowerCase()
);

if (usuarioJaExiste) {
  alert("Esse usuário de acesso já está cadastrado.");
  return;
}
   const novoFuncionario: Funcionario = {
  id: crypto.randomUUID(),
  ...formulario,
  usuario: formulario.usuario.trim().toLowerCase(),
};

    const novaLista = [...funcionarios, novoFuncionario];

    setFuncionarios(novaLista);
    localStorage.setItem(
      "choqueseg-funcionarios",
      JSON.stringify(novaLista)
    );

    setFormulario(funcionarioInicial);
    alert("Funcionário cadastrado com sucesso!");
  }

  function excluirFuncionario(id: string) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este funcionário?"
    );

    if (!confirmar) return;

    const novaLista = funcionarios.filter(
      (funcionario) => funcionario.id !== id
    );

    setFuncionarios(novaLista);
    localStorage.setItem(
      "choqueseg-funcionarios",
      JSON.stringify(novaLista)
    );
  }

  return (
    <section className="funcionarios-container">
      <div className="funcionarios-cabecalho">
        <div>
          <span className="funcionarios-etiqueta">
            EQUIPE CHOQUESEG
          </span>

          <h2>Cadastro de funcionários</h2>

          <p>
            Cadastre os funcionários e defina o nível de acesso de cada um.
          </p>
        </div>
      </div>

      <form
        className="funcionarios-formulario"
        onSubmit={salvarFuncionario}
      >
        <div className="funcionarios-campo">
          <label htmlFor="nome">Nome completo *</label>

          <input
            id="nome"
            type="text"
            value={formulario.nome}
            onChange={(evento) =>
              atualizarCampo("nome", evento.target.value)
            }
            placeholder="Nome do funcionário"
          />
        </div>

        <div className="funcionarios-campo">
          <label htmlFor="telefone">Telefone/WhatsApp *</label>

          <input
            id="telefone"
            type="tel"
            value={formulario.telefone}
            onChange={(evento) =>
              atualizarCampo("telefone", evento.target.value)
            }
            placeholder="(79) 9 9999-9999"
          />
        </div>

        <div className="funcionarios-campo">
          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            value={formulario.email}
            onChange={(evento) =>
              atualizarCampo("email", evento.target.value)
            }
            placeholder="funcionario@email.com"
          />
        </div>

        <div className="funcionarios-campo">
          <label htmlFor="cargo">Cargo</label>

          <input
            id="cargo"
            type="text"
            value={formulario.cargo}
            onChange={(evento) =>
              atualizarCampo("cargo", evento.target.value)
            }
            placeholder="Ex.: Vendedor, Instalador ou Atendente"
          />
        </div>

        <div className="funcionarios-campo">
          <label htmlFor="nivelAcesso">Nível de acesso</label>

          <select
            id="nivelAcesso"
            value={formulario.nivelAcesso}
            onChange={(evento) =>
              atualizarCampo("nivelAcesso", evento.target.value)
            }
          >
            <option value="Administrador">Administrador</option>
            <option value="Gerente">Gerente</option>
            <option value="Funcionário">Funcionário</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Técnico">Técnico</option>
          </select>
        </div>

        <div className="funcionarios-campo">
          <label htmlFor="status">Status</label>

          <select
            id="status"
            value={formulario.status}
            onChange={(evento) =>
              atualizarCampo("status", evento.target.value)
            }
          >
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        <button className="funcionarios-botao" type="submit">
          Cadastrar funcionário
        </button>
      </form>

      <div className="funcionarios-lista">
        <h3>Funcionários cadastrados</h3>

        {funcionarios.length === 0 ? (
          <p className="funcionarios-vazio">
            Nenhum funcionário cadastrado.
          </p>
        ) : (
          funcionarios.map((funcionario) => (
            <article
              className="funcionario-card"
              key={funcionario.id}
            >
              <div>
                <strong>{funcionario.nome}</strong>
                <span>{funcionario.cargo || "Cargo não informado"}</span>
                <small>{funcionario.telefone}</small>
                <small>{funcionario.nivelAcesso}</small>
              </div>

              <div className="funcionario-acoes">
                <span
                  className={
                    funcionario.status === "Ativo"
                      ? "status-ativo"
                      : "status-inativo"
                  }
                >
                  {funcionario.status}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    excluirFuncionario(funcionario.id)
                  }
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}