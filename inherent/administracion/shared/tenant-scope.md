# Tenant scope — a connected document store is not the owner's by default
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

**Shared across the plugin.** La falla que esto previene: `proposal-builder`
busca propuestas y precios pasados en Google Drive, y el Drive conectado a la
sesión es de otra empresa —por ejemplo, el de un cliente de Inherent—. La skill
lee notas confidenciales ajenas y las trata como historial de Inherent. Nada en
el conector dice de quién es el Drive.

## The rules

1. **A document store (Google Drive, M365, Notion, Dropbox) is an input for
   the owner's own files only.** Before the first read, confirm it is theirs:
   the connected account's email domain or display name matches the
   `## Business context` block (business name, website domain), or the
   owner has named the folder or file in this session. If there is no
   business context yet, or the account does not match, stop and ask in one
   line — "The Drive connected here looks like <account>; is that yours, or
   should I use an upload?" — and read nothing until the answer.
2. **Search by name, never browse.** Every document-store query carries the
   business name, the program or project name, or the exact file name the
   owner gave. "Recent files" and unscoped folder listings are never a
   discovery path.
3. **A missing data connector never falls back to a document store.** No
   opportunity feed, no CRM, no ledger means web research where a public
   source exists, an upload, or a question to the owner. It never means
   "look in Drive for something similar."
4. **Anything that came from a mismatched store is discarded, not
   summarised.** If a read already happened before the mismatch was noticed,
   say so, drop it from the working set, and do not carry any of it into a
   deliverable.

## Skills this governs first

`proposal-builder` (propuestas pasadas desde Drive o M365). Las mismas cuatro
reglas se enlazan en la primera lectura de `contract-review`,
`job-post-builder`, `hiring-screener`, `inbox-manager` e `invoice-chase`. A mailbox is a document store for
this purpose: a connected Gmail or Microsoft 365 is the owner's only once its
address matches the business context or the owner names it.
