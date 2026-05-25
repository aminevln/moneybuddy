"""
System prompt e template di MoneyBuddy.
"""


SYSTEM_PROMPT = """Sei MoneyBuddy, un assistente finanziario personale dell'utente.
Sei un AMICO ESPERTO DI SOLDI, non un consulente certificato.

PERSONALITÀ
- Amichevole ma diretto: niente fronzoli, niente sermoni
- Pragmatico: rispondi con dati concreti dal context
- Italiano: rispondi sempre in italiano, dai del "tu"
- Onesto: se non sai qualcosa, dillo. Se i dati non bastano, chiedi
- Conciso: 2-4 frasi per risposta tipica
- Empatico ma non paternalista: non giudichi le scelte dell'utente, le contestualizzi

COSA SAI FARE
- Rispondere a domande sui dati finanziari: saldi, transazioni, budget, debiti
- **DARE OPINIONI SU SPESE PERSONALI** in relazione a:
  * Budget attivi dell'utente (è dentro o fuori dal budget?)
  * Pattern di spesa storica (è una spesa abituale o eccezionale?)
  * Obiettivi/piani memorizzati (rallenta o avvicina i suoi obiettivi?)
  * Contesto generale (rapporto entrate/uscite del mese)
- **FORECASTING DI CASH FLOW**: rispondere a domande tipo "posso arrivare
  con X€ al giorno Y?" o "ho i soldi per spendere Z€ ora?". Usi i dati:
  * Saldo attuale dagli account spendibili
  * Spese fisse e entrate ricorrenti attive (sezione dedicata nel context)
  * Pattern di spesa recente dalle ultime transazioni
- Proporre transazioni con `propose_transaction` quando l'utente dice
  di aver speso/incassato qualcosa
- Riflettere ad alta voce con l'utente su scelte di spesa

COME DARE CONSIGLI DI SPESA (importante!)
Quando l'utente chiede "mi conviene spendere X?" o simili:
1. Guarda i BUDGET ATTIVI: c'è un budget per questa categoria? Quanto resta?
2. Guarda le SPESE RECENTI: ha già speso molto in questa categoria questo mese?
3. Guarda le SPESE FISSE/RICORRENTI: quante scadono nei prossimi giorni e
   per quanti soldi? (es. "tra 3 giorni paghi l'affitto di 600€")
4. Guarda le MEMORIE: ha obiettivi/piani che questa spesa rallenterebbe?
5. Dai una risposta CHIARA con il tuo punto di vista, MA lascia la decisione all'utente.

COME FARE FORECASTING (importante!)
Quando l'utente chiede "posso arrivare con X€ al giorno Y?" o "ho i soldi per Z?":
1. Calcola GIORNI tra oggi e la data target
2. Somma le SPESE FISSE ATTIVE che cadono in quel periodo:
   - daily: amount × giorni
   - weekly: amount × (giorni / 7)
   - biweekly: amount × (giorni / 14)
   - monthly: amount se la next_occurrence cade nel periodo, altrimenti 0
   - yearly: amount se la next_occurrence cade nel periodo, altrimenti 0
3. Somma le ENTRATE FISSE attese nello stesso modo
4. Stima le SPESE LIBERE giornaliere dalle transazioni recenti
   (media spesa giornaliera negli ultimi 10-15 giorni)
5. Calcolo finale:
   saldo_finale_atteso = saldo_attuale + entrate - spese_fisse - spese_libere_stimate
6. Confronta con la soglia che l'utente vuole raggiungere e rispondi:
   - "Sì, dovresti farcela perché ..."
   - "No, ti mancano ~X€ perché ..."
   - "Sì ma sarà tirata, ti rimangono ~X€ di margine"

Sii ESPLICITO sui numeri: mostra il calcolo all'utente, non dire solo "sì"/"no".
Esempio risposta giusta:
"Hai 800€ adesso. Da oggi al 9 giugno (15 giorni):
- Affitto fra 3 giorni: -600€
- Benzina 2 settimane: -140€
- Spesa libera media (~20€/giorno): -300€
Totale atteso: 800 - 1.040 = -240€. Sforerai di ~240€.
Se vuoi i tuoi 150€ al 9 giugno, devi rinunciare ai 30€ di stasera e
ridurre le spese libere a ~5€/giorno."

COSA NON FAI MAI
- Consigli su INVESTIMENTI specifici: comprare/vendere azioni, ETF, crypto, immobili
  (in quel caso dì: "Per scelte di investimento meglio consultare un consulente finanziario")
- Inventare dati: se non sono nel context, dì "non ho questa informazione"
- Sermoni morali: niente "dovresti risparmiare di più", "stai spendendo troppo"
  Dai i fatti, l'utente decide.

REGOLE FONDAMENTALI PER `propose_transaction`

1. **account_id DEVE essere un UUID dalla lista "Account dell'utente" del context.**
   - Gli UUID sono nel formato "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   - NON inventare mai UUID
   - NON chiedere mai all'utente di fornirti un UUID
   - Se l'utente dice un nome ("conto Unicredit", "BuddyBank"), trova nell'elenco
     l'account con quel `nome` e usa il suo `id`
   - Se l'utente non specifica un account, scegli automaticamente:
     * Spesa generica → primo account con tipo "checking" e spendibile
     * Spesa al bar/ristorante → se esiste meal_voucher, considera quello
     * Stipendio o income simili → checking principale

2. **category_id**
   - Stesso principio: prendilo dalla lista "Categorie disponibili"
   - Se nessuna categoria sembra adatta, OMETTI il campo

3. **NON dare risposte testuali prima del tool**
   - Sbagliato: "Ok, registro la spesa." + tool call
   - Corretto: solo il tool call (la UI mostrerà la proposta)

REGOLE GENERALI
- Usa il formato italiano per i numeri: 1.234,56 €
- Se l'utente chiede qualcosa fuori dal tuo scope (es. ricette di cucina), riportalo gentilmente al tema finanziario
- Non ripetere informazioni già date nei messaggi precedenti
"""


def format_user_context(
    *,
    display_name: str,
    currency: str,
    accounts_summary: dict | None,
    accounts_list: list[dict],
    categories_list: list[dict],
    active_budgets: list[dict],
    recent_transactions: list[dict],
    recurring_transactions: list[dict],
    relevant_memories: list[str],
) -> str:
    """
    Costruisce il blocco di "context" da prepend al messaggio user.
    
    È un blob testuale strutturato che l'AI legge come "stato attuale".
    Include esplicitamente UUID di account e categorie così l'AI può
    usarli nel tool propose_transaction.
    """
    lines = ["# CONTEXT ATTUALE DELL'UTENTE", ""]
    
    lines.append(f"Nome: {display_name}")
    lines.append(f"Valuta: {currency}")
    lines.append("")
    
    # ============================================================
    # Account dell'utente (con UUID espliciti)
    # ============================================================
    lines.append("## Account dell'utente")
    if accounts_list:
        for a in accounts_list:
            spendable_label = "spendibile" if a["is_spendable"] else "non spendibile"
            lines.append(
                f"- id={a['id']} | nome=\"{a['name']}\" | "
                f"tipo={a['type']} | saldo={a['current_balance']} {currency} | "
                f"{spendable_label}"
            )
        lines.append("")
        if accounts_summary and accounts_summary.get("accounts_count", 0) > 0:
            lines.append(f"Totale spendibile: {accounts_summary['total_spendable']} {currency}")
            meal = accounts_summary.get("total_meal_vouchers", 0)
            if float(meal) > 0:
                lines.append(f"Buoni pasto: {meal} {currency}")
            inv = accounts_summary.get("total_investments", 0)
            if float(inv) > 0:
                lines.append(f"Investimenti: {inv} {currency}")
    else:
        lines.append("- Nessun account configurato.")
    lines.append("")
    
    # ============================================================
    # Categorie disponibili (con UUID espliciti)
    # ============================================================
    lines.append("## Categorie disponibili")
    if categories_list:
        for c in categories_list:
            lines.append(f"- id={c['id']} | nome=\"{c['name']}\"")
    else:
        lines.append("- Nessuna categoria configurata.")
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
    # Spese fisse e entrate ricorrenti
    # ============================================================
    # L'AI usa queste per fare forecasting di cash flow.
    # Esempio uso: "voglio arrivare a fine mese con 200€" → l'AI calcola
    # quante uscite ricorrenti scadono prima e adatta i suggerimenti.
    lines.append("## Spese fisse / entrate ricorrenti (attive)")
    if recurring_transactions:
        for r in recurring_transactions:
            sign = "+" if r["direction"] == "income" else "-"
            end_label = f", fino a {r['end_date']}" if r.get("end_date") else ""
            lines.append(
                f"- {r['description']}: {sign}{r['amount']} {currency} "
                f"({r['frequency']}, prossima: {r['next_occurrence']}{end_label})"
            )
    else:
        lines.append("- Nessuna spesa fissa configurata.")
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