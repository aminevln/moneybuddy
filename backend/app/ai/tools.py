"""
Tool definitions per Gemini function calling.

Per MoneyBuddy MVP (Approccio A: conferma sempre), abbiamo questi tool:

1. propose_transaction: l'AI propone una transazione che l'utente conferma
   - Crea una "proposta" salvata in chat_messages.tool_calls (status=pending)
   - L'utente vede una bolla speciale con bottoni Conferma/Annulla
   - Su conferma → diventa una vera transazione

In futuro aggiungeremo:
- propose_budget, propose_category_change, ecc.
- query_xxx (lookup-only, no conferma)
"""

from google.genai import types


# ============================================================
# TOOL: propose_transaction
# ============================================================
# Schema per Gemini function calling
# Vedi: https://ai.google.dev/gemini-api/docs/function-calling

PROPOSE_TRANSACTION_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="propose_transaction",
            description=(
                "Proponi una transazione da registrare. NON la crea direttamente: "
                "l'utente deve confermarla. Usa questo tool ogni volta che l'utente "
                "dice di aver speso qualcosa o ricevuto soldi. "
                "Se l'account non è chiaro, usa quello principale (il primo nella lista). "
                "Se la categoria non è chiara, lascia null e l'utente la sceglierà."
            ),
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "direction": types.Schema(
                        type="STRING",
                        enum=["income", "expense"],
                        description="'expense' per uscita, 'income' per entrata",
                    ),
                    "amount": types.Schema(
                        type="NUMBER",
                        description="Importo positivo (il segno lo dà direction)",
                    ),
                    "description": types.Schema(
                        type="STRING",
                        description="Descrizione breve, max 100 caratteri",
                    ),
                    "merchant": types.Schema(
                        type="STRING",
                        description="Esercente, opzionale (es. 'Bar Stella')",
                    ),
                    "account_id": types.Schema(
                        type="STRING",
                        description=(
                            "UUID dell'account. Usa quello suggerito nel context. "
                            "Se ce n'è uno solo o uno chiaramente principale, usalo."
                        ),
                    ),
                    "category_id": types.Schema(
                        type="STRING",
                        description=(
                            "UUID della categoria, se ne identifichi una rilevante. "
                            "Lascia stringa vuota se non hai sufficienti elementi."
                        ),
                    ),
                },
                required=["direction", "amount", "description", "account_id"],
            ),
        )
    ]
)


# Lista di tutti i tools attivi
ALL_TOOLS: list[types.Tool] = [PROPOSE_TRANSACTION_TOOL]