"""
System prompt e template di MoneyBuddy.
"""


SYSTEM_PROMPT = """Sei MoneyBuddy, un assistente finanziario personale dell'utente.

PERSONALITÀ
- Amichevole ma diretto: niente fronzoli, niente sermoni
- Pragmatico: rispondi con dati concreti
- Italiano: rispondi sempre in italiano, dai del "tu"
- Onesto: se non sai qualcosa, dillo. Se i dati non bastano, chiedi
- Conciso: 2-4 frasi per risposta tipica. Solo dettagli se l'utente chiede

COSA SAI FARE
- Rispondere a domande sui dati finanziari: saldi, transazioni recenti, budget, debiti
- Ragionare su pattern di spesa
- Dare contesto: "hai speso X in ristoranti questo mese, il 30% in più del precedente"
- PROPORRE TRANSAZIONI: quando l'utente dice di aver speso/incassato qualcosa,
  usa il tool `propose_transaction` per preparare una proposta che l'utente confermerà.

COME USARE `propose_transaction`
- Quando rilevi una nuova spesa/entrata da registrare, chiama il tool
- NON dare prima una risposta testuale "ok, registro": il tool dà già la conferma
- Usa l'account_id suggerito nel context (di solito il principale)
- Usa la category_id solo se sei sicuro che corrisponda
- Esempi di trigger:
  * "Ho speso 12€ al bar" → propose_transaction(expense, 12, "Bar", ...)
  * "Mi sono arrivati 1500€ di stipendio" → propose_transaction(income, 1500, "Stipendio", ...)
  * "Ho comprato il pane per 2 euro" → propose_transaction(expense, 2, "Pane", ...)

COSA NON FAI
- Non dare consigli di investimento specifici (non sei un consulente)
- Non inventare dati: se non sono nel context, dì "non ho questa informazione"
- Non confermare azioni mai prese: usa SEMPRE il tool per le proposte

REGOLE
- Usa il formato italiano per i numeri: 1.234,56 €
- Se l'utente chiede qualcosa fuori dal tuo scope (es. ricette di cucina), riportalo gentilmente al tema finanziario
- Non ripetere informazioni già date nei messaggi precedenti
"""


def format_user_context(
    *,
    display_name: str,
    currency: str,
    accounts_summary: dict | None,
    active_budgets: list[dict],
    recent_transactions: list[dict],
    relevant_memories: list[str],
) -> str:
    """
    Costruisce il blocco di "context" da prepend al messaggio user.
    
    È un blob testuale strutturato che l'AI legge come "stato attuale".
    """
    lines = ["# CONTEXT ATTUALE DELL'UTENTE", ""]
    
    lines.append(f"Nome: {display_name}")
    lines.append(f"Valuta: {currency}")
    lines.append("")
    
    # ============================================================
    # Saldi
    # ============================================================
    lines.append("## Saldi")
    if accounts_summary and accounts_summary.get("accounts_count", 0) > 0:
        lines.append(f"- Totale spendibile: {accounts_summary['total_spendable']} {currency}")
        meal = accounts_summary.get("total_meal_vouchers", 0)
        if float(meal) > 0:
            lines.append(f"- Buoni pasto: {meal} {currency}")
        inv = accounts_summary.get("total_investments", 0)
        if float(inv) > 0:
            lines.append(f"- Investimenti: {inv} {currency}")
        lines.append(f"- Numero account: {accounts_summary['accounts_count']}")
    else:
        lines.append("- Nessun account configurato.")
    lines.append("")
    
    # ============================================================
    # Budget
    # ============================================================
    lines.append("## Budget attivi")
    if active_budgets:
        for b in active_budgets:
            cat = b.get("category_name") or "Tutte le spese"
            pct = float(b["percentage"])
            status_label = "ok" if pct < 70 else ("attenzione" if pct < 100 else "sforato")
            lines.append(
                f"- {cat} ({b['budget']['period']}): "
                f"{b['spent']} / {b['budget']['amount_limit']} {currency} "
                f"= {pct:.0f}% [{status_label}]"
            )
    else:
        lines.append("- Nessun budget attivo.")
    lines.append("")
    
    # ============================================================
    # Transazioni recenti
    # ============================================================
    lines.append("## Ultime transazioni")
    if recent_transactions:
        for t in recent_transactions:
            sign = "+" if t["direction"] == "income" else "-"
            cat = t.get("category_name") or "no categoria"
            lines.append(
                f"- {t['occurred_at'][:10]}: "
                f"{sign}{t['amount']} {currency} - "
                f"{t['description']} ({cat})"
            )
    else:
        lines.append("- Nessuna transazione recente.")
    lines.append("")
    
    # ============================================================
    # Memorie rilevanti (RAG)
    # ============================================================
    if relevant_memories:
        lines.append("## Memorie rilevanti dall'utente")
        for m in relevant_memories:
            lines.append(f"- {m}")
        lines.append("")
    
    return "\n".join(lines)