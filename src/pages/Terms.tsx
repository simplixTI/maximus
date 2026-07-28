// NOTE: Baseline Terms of Use template for a service marketplace app.
// Have it reviewed by legal counsel before publishing materially outside a
// limited MVP audience.

import { Link } from "react-router-dom";

const LAST_UPDATED = "28 de julho de 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <h1 className="font-display text-3xl font-bold">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            Estes Termos regem o uso do aplicativo <strong>Maximus Solutions</strong> e do site{" "}
            <a className="underline" href="https://www.maximussolutions.app">
              www.maximussolutions.app
            </a>{" "}
            (o "Serviço"), operados pela <strong>Maximus Solutions</strong> ("nós"). Ao criar
            conta ou usar o Serviço, você concorda com estes Termos e com a{" "}
            <Link to="/privacy" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">1. O que é o Serviço</h2>
          <p className="text-sm leading-relaxed">
            O Serviço é um marketplace que conecta <strong>clientes</strong> que precisam de
            serviços residenciais a <strong>prestadores de serviço</strong> independentes.
            Não somos empregadores dos prestadores; somos uma plataforma que facilita o
            encontro, a comunicação, o agendamento e o pagamento.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">2. Elegibilidade</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Você deve ter no mínimo 18 anos.</li>
            <li>Deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
            <li>Você é responsável por manter a segurança da sua conta e senha.</li>
            <li>Uma conta por pessoa. Contas duplicadas podem ser suspensas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">3. Contas de cliente</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Descreva com precisão o serviço solicitado.</li>
            <li>Forneça endereço correto e esteja disponível no horário agendado.</li>
            <li>Pague pelo serviço contratado após aceitar o orçamento.</li>
            <li>Trate prestadores com respeito. Avaliações devem ser honestas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">4. Contas de prestador</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Comprove suas habilidades e possua as licenças ou documentos exigidos.</li>
            <li>Realize os serviços aceitos com competência e no prazo combinado.</li>
            <li>Cumpra normas de segurança, trabalhistas e sanitárias aplicáveis.</li>
            <li>Você é responsável por seus próprios impostos e obrigações trabalhistas.</li>
            <li>
              O compartilhamento de localização em tempo real é acionado apenas quando você
              ativa o modo "Online" e é usado exclusivamente para permitir o acompanhamento
              pelo cliente do atendimento ativo.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">5. Pagamentos</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Pagamentos são processados por Stripe, Inc.</li>
            <li>Cliente autoriza a cobrança ao aceitar o orçamento.</li>
            <li>
              A Maximus pode reter uma taxa de serviço sobre cada transação (divulgada antes do
              aceite).
            </li>
            <li>
              Reembolsos e disputas seguem a política vigente e a mediação da Maximus, sem
              prejuízo dos direitos do consumidor previstos em lei.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">6. Cancelamento</h2>
          <p className="text-sm leading-relaxed">
            Você pode cancelar sua conta a qualquer momento pelas configurações do app ou pelo
            email{" "}
            <a className="underline" href="mailto:support@maximussolutions.app">
              support@maximussolutions.app
            </a>
            . Nós podemos suspender ou encerrar contas que violarem estes Termos, mediante
            aviso (exceto em casos graves).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">7. Conteúdo do usuário</h2>
          <p className="text-sm leading-relaxed">
            Você mantém a propriedade de fotos, textos e avaliações que envia. Ao publicar
            conteúdo, concede à Maximus licença não exclusiva, gratuita e mundial para
            hospedar, processar e exibir esse conteúdo dentro do Serviço. Você garante que
            possui os direitos sobre o conteúdo enviado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">8. Condutas proibidas</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Fraude, lavagem de dinheiro ou pagamentos fora da plataforma para evitar taxas.</li>
            <li>Assédio, discriminação, violência ou ameaças.</li>
            <li>Falsificação de documentos, licenças ou avaliações.</li>
            <li>Uso do Serviço para atividades ilegais.</li>
            <li>Engenharia reversa ou tentativa de burlar controles técnicos.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">9. Isenção de garantias</h2>
          <p className="text-sm leading-relaxed">
            A Maximus faz o razoável para verificar prestadores, mas não garante a qualidade,
            segurança ou legalidade dos serviços prestados por terceiros. O Serviço é fornecido
            "como está", sem garantias de disponibilidade contínua ou ausência de erros.
            Nada nestes Termos afasta direitos irrenunciáveis do consumidor previstos em lei.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">10. Limitação de responsabilidade</h2>
          <p className="text-sm leading-relaxed">
            Na máxima extensão permitida em lei, a Maximus não responde por danos indiretos,
            lucros cessantes, perda de dados, ou danos decorrentes de atos ou omissões de
            prestadores. Nossa responsabilidade total agregada, quando aplicável, fica
            limitada ao valor pago pelo cliente à Maximus nos 6 meses anteriores ao evento
            que causou o dano.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">11. Lei aplicável e foro</h2>
          <p className="text-sm leading-relaxed">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito
            o foro da comarca de São Paulo/SP para dirimir controvérsias, sem prejuízo do
            direito do consumidor de propor ação no seu domicílio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">12. Alterações destes Termos</h2>
          <p className="text-sm leading-relaxed">
            Podemos atualizar estes Termos. Mudanças materiais serão notificadas por e-mail ou
            no app com no mínimo 15 dias de antecedência. O uso continuado após a data de
            vigência significa aceite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">13. Contato</h2>
          <p className="text-sm leading-relaxed">
            Dúvidas ou notificações jurídicas:{" "}
            <a className="underline" href="mailto:legal@maximussolutions.app">
              legal@maximussolutions.app
            </a>
            .
          </p>
        </section>

        <footer className="pt-8 text-sm text-muted-foreground">
          <Link to="/privacy" className="underline">
            Política de Privacidade
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
