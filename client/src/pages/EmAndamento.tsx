import { useState } from "react";
import { api, useMachines, useTickets } from "../lib/api";
import { TicketCard } from "../components/TicketCard";
import type { AuthUser } from "../lib/types";

export function EmAndamento({ user }: { user: AuthUser }) {
  const { tickets, refresh } = useTickets();
  const machines = useMachines();
  const [closeError, setCloseError] = useState<string | null>(null);

  const emAndamento = tickets
    .filter((t) => t.status === "em_andamento")
    .sort((a, b) => (a.assumidoEm && b.assumidoEm && a.assumidoEm < b.assumidoEm ? -1 : 1));

  async function handleClose(id: string) {
    setCloseError(null);
    try {
      await api.closeTicket(id);
      await refresh();
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Erro ao encerrar o chamado.");
      await refresh();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-industrial text-2xl font-bold text-white">Manutenção em andamento</h1>
      <p className="mt-1 text-sm text-slate-400">
        Chamados já assumidos por um manutentor — evita que duas pessoas resolvam a mesma
        máquina ao mesmo tempo.
      </p>

      {closeError && (
        <p className="mt-4 rounded-lg border border-critical-600/40 bg-critical-600/10 px-3 py-2 text-sm text-critical-500">
          {closeError}
        </p>
      )}

      {emAndamento.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-slate-300">Nenhum chamado em andamento</p>
          <p className="text-sm text-slate-500">
            Assim que alguém assumir um chamado no Painel, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {emAndamento.map((ticket) => {
            const isOwner = ticket.assumidoPor?.id === user.id;
            const canClose = isOwner || user.role === "team-leader";
            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                machine={machines.find((m) => m.nome === ticket.maquina)}
                onClose={canClose ? handleClose : undefined}
                disabledCloseReason={
                  !canClose && ticket.assumidoPor
                    ? `Em atendimento por ${ticket.assumidoPor.nome}`
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
