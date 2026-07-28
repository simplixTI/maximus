// NOTE: This template covers Play Store, Google OAuth Consent Screen and LGPD
// baseline requirements. Have it reviewed by legal counsel before publishing
// materially outside a limited MVP audience.

import { Link } from "react-router-dom";

const LAST_UPDATED = "28 de julho de 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <h1 className="font-display text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            Esta Política de Privacidade descreve como a <strong>Maximus Solutions</strong> ("nós",
            "nosso") coleta, usa, compartilha e protege as informações dos usuários do aplicativo
            móvel Maximus Solutions e do site{" "}
            <a className="underline" href="https://www.maximussolutions.app">
              www.maximussolutions.app
            </a>{" "}
            ("Serviço"). Ao usar o Serviço, você concorda com esta política.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">1. Controlador dos dados</h2>
          <p className="text-sm leading-relaxed">
            O controlador dos dados pessoais é a <strong>Maximus Solutions</strong>. Para exercer
            seus direitos (LGPD art. 18) ou tirar dúvidas, entre em contato pelo email{" "}
            <a className="underline" href="mailto:privacy@maximussolutions.app">
              privacy@maximussolutions.app
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">2. Dados que coletamos</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Dados de conta:</strong> nome completo, e-mail, telefone, foto de perfil,
              tipo de conta (cliente ou prestador).
            </li>
            <li>
              <strong>Dados de cliente:</strong> endereço de atendimento, cidade, estado, CEP,
              histórico de solicitações e agendamentos.
            </li>
            <li>
              <strong>Dados de prestador:</strong> nome comercial, CNPJ/EIN, documentos de
              habilitação, especialidades, veículo (quando aplicável), avaliações e reputação.
            </li>
            <li>
              <strong>Localização precisa (apenas prestadores, apenas em uso):</strong> quando o
              prestador ativa "Online" para receber jobs, seu dispositivo compartilha
              coordenadas GPS em tempo real para permitir que clientes com atendimento ativo
              acompanhem sua chegada. A coleta é interrompida ao ficar offline, minimizar o app,
              fazer logout ou encerrar o atendimento.{" "}
              <strong>
                Não coletamos localização em segundo plano. Não fazemos geofencing. Clientes
                finais não têm localização coletada pelo app.
              </strong>
            </li>
            <li>
              <strong>Fotos:</strong> imagens que você anexa a uma solicitação de serviço ou ao
              perfil (upload voluntário).
            </li>
            <li>
              <strong>Comunicações:</strong> mensagens trocadas no chat entre cliente e prestador
              dentro de um atendimento.
            </li>
            <li>
              <strong>Pagamentos:</strong> processados por Stripe. Não armazenamos números
              completos de cartão nem CVV em nossos servidores.
            </li>
            <li>
              <strong>Dados técnicos:</strong> logs de acesso, timestamps, identificadores de
              sessão, tipo de dispositivo, sistema operacional, versão do app. Usados para
              segurança, prevenção de fraude e melhoria do serviço.
            </li>
            <li>
              <strong>Não coletamos:</strong> Advertising ID (AAID), contatos, agenda, mídia
              não solicitada, histórico de navegação de outros apps.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">3. Finalidades do tratamento</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Autenticar sua conta e manter sua sessão ativa.</li>
            <li>Conectar clientes e prestadores no marketplace de serviços.</li>
            <li>Processar pagamentos e emitir comprovantes.</li>
            <li>Permitir que clientes acompanhem a chegada do prestador em tempo real.</li>
            <li>Enviar notificações operacionais (novo job, mensagem, atualização de status).</li>
            <li>Investigar e prevenir fraude, abuso e violações dos termos de uso.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">4. Bases legais (LGPD art. 7)</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Execução de contrato</strong> — prestação do serviço solicitado.
            </li>
            <li>
              <strong>Consentimento</strong> — para localização em tempo real (pedida a cada
              ativação de "Online").
            </li>
            <li>
              <strong>Legítimo interesse</strong> — prevenção de fraude, segurança e melhoria do
              produto.
            </li>
            <li>
              <strong>Cumprimento de obrigação legal</strong> — retenção fiscal, ordens
              judiciais.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">5. Compartilhamento com terceiros</h2>
          <p className="text-sm leading-relaxed">
            Compartilhamos dados estritamente necessários com os seguintes operadores:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Supabase Inc.</strong> — banco de dados, autenticação, storage. Servidores
              nos EUA.
            </li>
            <li>
              <strong>Stripe, Inc.</strong> — processamento de pagamentos. Certificado PCI-DSS.
            </li>
            <li>
              <strong>Google</strong> — quando você opta por entrar com Google (OAuth).
            </li>
            <li>
              <strong>Resend</strong> — envio de e-mails transacionais.
            </li>
            <li>
              <strong>Vercel</strong> — hospedagem da aplicação web.
            </li>
          </ul>
          <p className="text-sm leading-relaxed">
            Todos os operadores são contratualmente obrigados a proteger os dados. Não vendemos
            dados pessoais. Não compartilhamos localização com terceiros para fins de marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">6. Retenção</h2>
          <p className="text-sm leading-relaxed">
            Mantemos os dados enquanto sua conta estiver ativa. Após exclusão da conta, apagamos
            dados pessoais em até 30 dias, exceto informações que devemos reter por obrigação
            legal (por exemplo, registros fiscais de pagamento por até 5 anos). Dados de
            localização históricos são mantidos por até 90 dias para fins de auditoria de
            atendimentos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">7. Seus direitos (LGPD art. 18)</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Confirmar se tratamos dados seus e acessá-los.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Portabilidade dos seus dados para outro fornecedor.</li>
            <li>Revogar consentimento a qualquer momento (por exemplo, desativar "Online").</li>
            <li>
              Solicitar exclusão da conta pelo email{" "}
              <a className="underline" href="mailto:privacy@maximussolutions.app">
                privacy@maximussolutions.app
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">8. Segurança</h2>
          <p className="text-sm leading-relaxed">
            Todos os dados trafegam por HTTPS/TLS. Senhas são armazenadas com hash seguro pelo
            provedor de autenticação. Row Level Security (RLS) restringe acesso aos dados no
            banco. O app não permite backup automático via ADB (backup Android desativado).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">9. Menores de idade</h2>
          <p className="text-sm leading-relaxed">
            O Serviço é destinado a maiores de 18 anos. Não coletamos conscientemente dados de
            menores. Se identificarmos, os dados serão excluídos imediatamente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">10. Alterações desta política</h2>
          <p className="text-sm leading-relaxed">
            Podemos atualizar esta política. A data "Última atualização" no topo indica a
            versão vigente. Mudanças materiais serão notificadas por e-mail ou notificação no
            app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">11. Contato</h2>
          <p className="text-sm leading-relaxed">
            Dúvidas, solicitações ou reclamações:{" "}
            <a className="underline" href="mailto:privacy@maximussolutions.app">
              privacy@maximussolutions.app
            </a>
            . Encarregado de dados (DPO): a definir.
          </p>
        </section>

        <footer className="pt-8 text-sm text-muted-foreground">
          <Link to="/terms" className="underline">
            Termos de Uso
          </Link>
          <span className="mx-2">·</span>
          <Link to="/" className="underline">
            Início
          </Link>
        </footer>
      </div>
    </div>
  );
}
