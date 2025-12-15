// Risposte deterministiche per simulare l'assistente senza dipendere da un servizio esterno.
export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const GREETING = 'Ciao! Sono l\'assistente virtuale FastSeller. Se hai domande su pagamenti, spedizioni o account, chiedimi pure.'

const RESPONSES: Array<{ test: (text: string) => boolean; reply: (text: string) => string }> = [
  {
    test: text => /(spedizion|consegna|tracking|corriere)/i.test(text),
    reply: () => 'Per le spedizioni utilizziamo corrieri tracciati. Trovi il codice tracking nel riepilogo ordine entro 24 ore dalla conferma del venditore.'
  },
  {
    test: text => /(pagament|carta|wallet|saldo|refun)d/i.test(text),
    reply: () => 'Per i pagamenti supportiamo carta, PayPal, bonifico e saldo FastSeller. Il saldo viene aggiornato automaticamente dopo la vendita di un oggetto.'
  },
  {
    test: text => /(account|login|password|accesso)/i.test(text),
    reply: () => 'Se hai problemi di accesso puoi reimpostare la password dalla pagina "Password dimenticata" oppure contattarci via email per assistenza.'
  },
  {
    test: text => /(ordine|order|stato|delayed)/i.test(text),
    reply: () => 'Per verificare lo stato di un ordine vai nella dashboard e controlla la sezione "I miei ordini". Se serve, posso aiutarti a scrivere un messaggio al venditore.'
  },
  {
    test: text => /(problema|bug|errore)/i.test(text),
    reply: () => 'Mi dispiace per il problema! Prova a indicarmi più dettagli possibili, così posso suggerirti la procedura corretta oppure inoltrare la segnalazione al team tecnico.'
  }
]

function buildFallback(text: string): string {
  if (text.length < 6) {
    return 'Potresti darmi qualche dettaglio in più? Così riesco a risponderti meglio.'
  }
  return 'Sto analizzando la richiesta. Se non trovi subito la risposta, puoi comunque scriverci a support@fastseller.it con le stesse informazioni.'
}

export function generateAssistantReply(history: ChatMessage[]): string {
  if (history.length === 0) {
    return GREETING
  }
  const last = [...history].reverse().find(msg => msg.role === 'user')
  if (!last) {
    return GREETING
  }
  for (const pattern of RESPONSES) {
    if (pattern.test(last.content)) {
      return pattern.reply(last.content)
    }
  }
  return buildFallback(last.content)
}
