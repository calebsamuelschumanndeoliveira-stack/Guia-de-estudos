/* =========================================================================
   CONFIGURAÇÃO DO LOGIN NA NUVEM (Supabase)
   -------------------------------------------------------------------------
   Enquanto os campos abaixo estiverem vazios, o site funciona em "modo local"
   (os dados ficam só no navegador, sem login). Para ativar o login de verdade,
   siga o passo a passo do arquivo CONFIGURAR-LOGIN.md e cole aqui os dois
   valores do seu projeto Supabase.

   ⚠️ A chave "anon" é PÚBLICA por natureza — pode ser enviada ao GitHub sem
   problema. A segurança real vem das regras (RLS) que você cria no Supabase.
   ========================================================================= */
window.SUPABASE_CONFIG = {
  url: "https://hwtgskdjgyacikkrvqbd.supabase.co",      // ex.: "https://hwtgskdjgyacikkrvqbd.supabase.co"
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGdza2RqZ3lhY2lra3J2cWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTQ3OTQsImV4cCI6MjA5NzEzMDc5NH0.zBCIiqWkZrM072Z6ToAewOxwsavqchOJ_0wzp5pfodg",  // a chave pública "anon public"
};
