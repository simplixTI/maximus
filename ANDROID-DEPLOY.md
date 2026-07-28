# Maximus Solutions — Android Deploy Guide

Guia completo para gerar, assinar e publicar o app **Maximus Solutions** para Android via **Capacitor**, mantendo o WebApp em [https://maximussolutions.app](https://maximussolutions.app) funcionando sem alterações.

---

## 1. Tecnologias & Versões

| Item | Versão / Detalhe |
|---|---|
| Framework Web | React 18 + Vite 5 + TypeScript |
| Runtime nativo | Capacitor 8 |
| App ID | `com.maximussolutions.app` |
| App Name | Maximus Solutions |
| versionCode / versionName | `1` / `1.0.0` |
| Deep link scheme | `com.maximussolutions.app://auth/callback` |
| App Links (HTTPS) | `https://app.maximussolutions.app` + `https://maximussolutions.app/auth/*` |
| Supabase project | `kcryjyznkxaoclrmbadi.supabase.co` |
| Node | **20 LTS ou superior** |
| Java | **JDK 17** (obrigatório para Gradle 8 + Android SDK 34+) |
| Android Studio | Iguana 2023.2.1 ou mais recente |
| Android SDK | Platform 34 + Build-tools 34.0.0 |

### Instalar as dependências de sistema (Windows)

1. **Node 20 LTS** — [nodejs.org](https://nodejs.org)
2. **JDK 17** — Microsoft OpenJDK ou Adoptium Temurin: `winget install Microsoft.OpenJDK.17`
3. **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio) (instala Android SDK, Platform-Tools e Emulator)
4. Confirme que `java -version` e `keytool -help` funcionam no PowerShell (reabra o terminal após instalar).
5. Defina `ANDROID_HOME` e `JAVA_HOME` nas variáveis de ambiente do sistema.

---

## 2. Estrutura de scripts npm

Todos os scripts assumem que você está em `max-property-pros-main/`.

| Script | O que faz |
|---|---|
| `npm run dev` | Vite dev server (web, com PWA) |
| `npm run build` | Build de produção **web** (com PWA/SW ativos) |
| `npm run build:android` | Build de produção **Capacitor** (PWA/SW desabilitados, `HashRouter`) |
| `npm run android:sync` | `build:android` + `cap sync android` (copia assets + plugins) |
| `npm run android:build` | Sync + `gradlew assembleDebug` (APK debug) |
| `npm run android:bundle` | Sync + `gradlew bundleRelease` (AAB para Play Store) |
| `npm run android:open` | Abre o projeto no Android Studio |
| `npm run android:run` | Sync + `cap run android` (dispositivo/emulator) |

O flag `VITE_CAPACITOR=1` é injetado pelo `cross-env` no `build:android`. Ele é usado em `src/lib/platform.ts` para escolher `HashRouter` e desabilitar o Service Worker do PWA.

---

## 3. Fluxo de build

### 3.1 Build web (inalterado)
```bash
npm ci
npm run build          # gera dist/ com PWA
```

### 3.2 Build Android debug (APK)
```bash
npm ci
npm run android:sync
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### 3.3 Build Android release (AAB)
Requer keystore configurado (ver seção 4).
```bash
npm run android:bundle
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. Keystore de assinatura

**A keystore de release NUNCA vai para o Git.** Perder essa keystore = perder controle do app na Play Store. Faça backup em local seguro (1Password/Bitwarden/USB físico).

### 4.1 Gerar a keystore (uma vez)
```bash
cd android
keytool -genkeypair -v \
  -keystore maximus-release.keystore \
  -alias maximus-release \
  -keyalg RSA -keysize 2048 -validity 10000
```
O `keytool` vai pedir:
- **Senha do keystore** (mín. 6 caracteres, anote em cofre)
- **Nome, organização, cidade, país** (usados no certificado)
- **Senha do alias** (pode ser a mesma do keystore)

### 4.2 Configurar `keystore.properties`
```bash
cd android
cp keystore.properties.example keystore.properties
```
Edite `android/keystore.properties`:
```properties
storeFile=maximus-release.keystore
storePassword=<sua senha real>
keyAlias=maximus-release
keyPassword=<sua senha real do alias>
```

O `android/.gitignore` já exclui `*.keystore`, `*.jks` e `keystore.properties`.

### 4.3 Extrair SHA-256 e SHA-1 fingerprints
```bash
cd android
keytool -list -v -keystore maximus-release.keystore -alias maximus-release
```
Anote:
- **SHA-256** → usado no `assetlinks.json` (App Links) e no Firebase (se usado)
- **SHA-1** → usado no Google Cloud Console para OAuth Android client

---

## 5. Deep Links + App Links (padronizado em HTTPS)

O callback OAuth usa **um único URL canônico** para web e Android:
```
https://www.maximussolutions.app/auth/callback
```

### 5.1 Web
- Rota registrada em `src/App.tsx`: `<Route path="/auth/callback" element={<AuthCallback />} />`
- Página em `src/pages/AuthCallback.tsx`: aguarda `session` (Supabase troca `?code=` automaticamente via `detectSessionInUrl: true`) e navega para `/`.

### 5.2 Android App Links (HTTPS, exclusivo)
- Intent filter único no `AndroidManifest.xml`:
  ```xml
  <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https"
            android:host="www.maximussolutions.app"
            android:pathPrefix="/auth/callback" />
  </intent-filter>
  ```
- **Custom scheme (`com.maximussolutions.app://`) foi removido** — não é mais necessário nem usado.
- `src/contexts/AuthContext.tsx` intercepta o App Link via `@capacitor/app` `appUrlOpen` (match no prefixo HTTPS) e chama `supabase.auth.exchangeCodeForSession(code)`.

### 5.3 assetlinks.json
Publicado em:
```
https://www.maximussolutions.app/.well-known/assetlinks.json
```
com o SHA-256 real da keystore de release. Verificado HTTP 200 + JSON correto.

- Após publicar, valide em:
  ```
  https://developers.google.com/digital-asset-links/tools/generator
  ```
- E teste no dispositivo:
  ```
  adb shell pm verify-app-links --re-verify com.maximussolutions.app
  adb shell pm get-app-links com.maximussolutions.app
  ```

---

## 6. Configuração do Supabase

### 6.1 Redirect URLs
No dashboard do projeto Supabase (Authentication → URL Configuration → Redirect URLs), adicione **apenas estes 2 URLs**:
```
https://www.maximussolutions.app/auth/callback
https://www.maximussolutions.app/reset-password
```
E o **Site URL**: `https://www.maximussolutions.app`

O primeiro cobre OAuth (Google) — mesmo URL para web e Android (via App Link).
O segundo cobre o link de reset de senha enviado por email.
**Não** adicione o custom-scheme `com.maximussolutions.app://` — não é mais usado.
**Não** adicione URLs do apex `maximussolutions.app` (sem www) — o site redireciona 308 para www.

### 6.2 PKCE flow
Já configurado em `src/lib/supabase.ts` (`flowType: "pkce"`). Nada a fazer no dashboard além dos URLs acima.

### 6.3 Provider Google
Em Authentication → Providers → Google:
- Enable: **ON**
- Client ID e Client Secret: os que você já cadastrou

O callback do Google **permanece** apontando para Supabase (não muda):
```
https://kcryjyznkxaoclrmbadi.supabase.co/auth/v1/callback
```

---

## 7. Configuração do Google Cloud Console

No projeto Google Cloud onde está o OAuth client existente:

1. **Credentials → OAuth 2.0 Client IDs → +Create → Android**
2. Package name: `com.maximussolutions.app`
3. SHA-1 certificate fingerprint: **cole o SHA-1 da sua keystore** (seção 4.3)
4. Salve. O Android client é usado para APIs Google (se necessário no futuro); para o fluxo OAuth atual, o cliente **Web** existente já basta.

Na **OAuth consent screen**, verifique que `maximussolutions.app` está nas Authorized domains e o app está no modo "In production" (ou os usuários estão em Test users).

---

## 8. Permissões Android — Auditoria

### 8.1 Permissões declaradas em `AndroidManifest.xml`
```
INTERNET
ACCESS_NETWORK_STATE
ACCESS_COARSE_LOCATION
ACCESS_FINE_LOCATION
```

### 8.2 Permissões explicitamente **removidas** via `tools:node="remove"`
```
ACCESS_BACKGROUND_LOCATION
FOREGROUND_SERVICE
FOREGROUND_SERVICE_LOCATION
com.google.android.gms.permission.AD_ID
```
Isso bloqueia qualquer manifest merger de plugin de reintroduzi-las.

### 8.3 Verificar o manifest final gerado (após build)
```bash
cd android
./gradlew :app:processReleaseMainManifest
# Windows:
type app\build\intermediates\merged_manifest\release\AndroidManifest.xml | Select-String "uses-permission"
# macOS/Linux:
grep uses-permission app/build/intermediates/merged_manifest/release/AndroidManifest.xml
```
Deve mostrar **apenas** as 4 declaradas. Nada de BACKGROUND_LOCATION, FOREGROUND_SERVICE, AD_ID.

### 8.4 Política de privacidade — atualização obrigatória
Adicione uma seção **"Localização"** em `https://maximussolutions.app/privacy`:

> **Localização (Location).** O aplicativo Maximus Solutions coleta a localização precisa do dispositivo **apenas de prestadores de serviço**, **somente quando o app está em uso** (foreground) e **somente após o prestador iniciar explicitamente o compartilhamento** ao ficar online para receber jobs. A localização é enviada em tempo real ao cliente que tenha um serviço ativo, para permitir que ele acompanhe a chegada do prestador. O compartilhamento é interrompido automaticamente quando o prestador fica offline, encerra o atendimento, minimiza o app ou faz logout. **Não coletamos localização em segundo plano**, **não usamos geofencing** e **não vendemos nem compartilhamos dados de localização com terceiros**. Clientes finais **não** têm localização coletada pelo app.

Sem essa seção, a Google Play rejeita apps com permissão de localização.

---

## 9. Assets (ícone + splash)

O `npx cap add android` gerou ícones padrão do Capacitor. Para trocar por assets Maximus:

### 9.1 Estrutura recomendada
Crie `resources/` na raiz do projeto (fora do `android/`):
```
resources/
  icon.png        # 1024x1024, logo Maximus centralizada
  splash.png      # 2732x2732, logo centralizada em fundo #000
```

### 9.2 Gerar todas as densidades
```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --android
```
Isto sobrescreve `android/app/src/main/res/mipmap-*` e `drawable-*/splash.png`.

Se preferir manter o splash preto atual (já é o design mobile), pule este passo.

---

## 10. Segurança — checklist

- [x] `android:usesCleartextTraffic="false"` (apenas HTTPS)
- [x] `android:allowBackup="false"` (não expõe dados via `adb backup`)
- [x] `webContentsDebuggingEnabled=false` no `capacitor.config.ts` (release não permite Chrome DevTools inspect)
- [x] Nenhuma Service Role Key no bundle (`.env.local` só contém `VITE_SUPABASE_ANON_KEY` + URL, ambas públicas por design)
- [x] `.env.local` gitignored
- [x] Keystore + `keystore.properties` gitignored
- [x] RLS: sua responsabilidade no Supabase — todas as tabelas devem ter policies

---

## 11. Publicação na Google Play Console

### 11.1 Primeira publicação
1. Crie o app em [play.google.com/console](https://play.google.com/console)
   - App name: **Maximus Solutions**
   - Default language: **Português (Brasil)**
   - App / Game: **App**; Free / Paid: **Free**
2. **App integrity** → Play App Signing: **Enable** (Play gerencia sua chave de upload)
3. Faça upload do `app-release.aab`
4. **Store listing**: short/full description, screenshots, feature graphic 1024x500, ícone 512x512
5. **Data safety** — declare:
   - Coleta de **localização precisa/aproximada** apenas de prestadores, em uso, para funcionalidade principal (real-time tracking)
   - **Personal info**: email, nome (para conta)
   - Segurança: dados criptografados em trânsito (HTTPS)
   - Usuário pode solicitar exclusão da conta
6. **Content rating** — questionário; app de serviços = provavelmente **Everyone**
7. **Target audience** — 18+ (marketplace)
8. **Ads** — **No** (nenhum anúncio)
9. **Countries** — Brasil (para começo)
10. Enviar para **Internal testing** → **Closed testing** → **Production**

### 11.2 Publicações subsequentes (atualização)
```bash
# 1. Bump versionCode e opcionalmente versionName em android/app/build.gradle
#      versionCode 2    # sempre +1
#      versionName "1.0.1"
# 2. Rebuild
npm run android:bundle
# 3. Upload novo AAB em Play Console → Production → Create new release
```

---

## 12. Checklist completo antes de subir para Play Store

### Código
- [ ] `npm run build:android` termina sem erro
- [ ] `npm run android:sync` roda sem warnings
- [ ] Ícone + splash Maximus configurados (ou aceito o default do Capacitor)
- [ ] Login Google testado em device real (não emulator)
- [ ] Tracking de localização testado: sai online → permissão pedida → indicador visual aparece → offline para → app minimizado pausa
- [ ] Botão voltar do Android não fecha o app inesperadamente
- [ ] Upload de fotos de serviço funciona no WebView
- [ ] Chat realtime funciona
- [ ] Mapas Leaflet renderizam corretamente

### Assinatura + Manifest
- [ ] Keystore de release gerada + backup off-site
- [ ] `keystore.properties` criado (não commitado)
- [ ] `assetlinks.json` publicado em `maximussolutions.app/.well-known/` com SHA-256 real
- [ ] AAB gerado (`android/app/build/outputs/bundle/release/app-release.aab`)
- [ ] Manifest merged verificado: **sem** BACKGROUND_LOCATION / FOREGROUND_SERVICE / FOREGROUND_SERVICE_LOCATION / AD_ID

### Supabase + Google
- [ ] Redirect URLs incluem os 4 URLs da seção 6.1
- [ ] Google OAuth Android client criado com SHA-1 real
- [ ] Consent screen aprovada (não Testing) ou usuários em Test users

### Play Store
- [ ] App criado no Play Console
- [ ] Data safety completa (localização, PII)
- [ ] Política de privacidade atualizada com seção de Localização
- [ ] Content rating preenchido
- [ ] Target audience: 18+
- [ ] Ads: No
- [ ] Screenshots + feature graphic subidos
- [ ] Uploaded to Internal testing primeiro
- [ ] Testado por conta interna
- [ ] Promovido para Production

---

## 13. Comandos rápidos de referência

```bash
# Instalar
npm ci

# Rodar em dev
npm run dev                            # web
npm run android:run                    # Android device/emulator

# Build web
npm run build

# Build Android debug
npm run android:build
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Build Android release (produção)
npm run android:bundle
# AAB: android/app/build/outputs/bundle/release/app-release.aab

# Abrir no Android Studio
npm run android:open

# Regenerar assets
npx capacitor-assets generate --android

# Extrair SHA-256 do keystore
keytool -list -v -keystore android/maximus-release.keystore -alias maximus-release
```

---

## 14. Troubleshooting

**Build falha com "Java version too low"** — instale JDK 17 e defina `JAVA_HOME`.

**`cap sync android` não copia mudanças** — verifique que o `dist/` foi regenerado (`npm run build:android` primeiro).

**OAuth Google volta pra tela de login** — cheque:
- Supabase Redirect URLs inclui `com.maximussolutions.app://auth/callback`
- `flowType: "pkce"` presente em `src/lib/supabase.ts`
- No dispositivo, o intent filter no manifest está registrado (reinstale o APK após alterar manifest)

**App Links não abrem no app (abre no browser)** — `assetlinks.json` no domínio errado ou SHA-256 errado. Rode:
```bash
adb shell pm get-app-links com.maximussolutions.app
```
Deve mostrar `Status: verified`.

**Localização não pede permissão no Android** — usuário já negou. Vá em Configurações → Apps → Maximus Solutions → Permissões → Localização → Permitir.

**AAB rejeitado por permissão FOREGROUND_SERVICE** — algum plugin novo introduziu. Cheque `android/app/build/intermediates/merged_manifest/release/AndroidManifest.xml` e adicione outro `tools:node="remove"` no seu manifest.

---

## 15. Futuro: esconder URL do Supabase no consentimento do Google

Hoje, quando o usuário faz login com Google pela 1ª vez, a tela de consentimento mostra `kcryjyznkxaoclrmbadi.supabase.co` como destino do redirect. Isso expõe o project ID do Supabase e reduz percepção de marca. **Decisão atual: aceitar essa exposição no MVP e migrar depois.** A migração é a **Supabase Custom Domain** feature.

### Passos (quando decidir migrar)

1. **Upgrade para plano Pro** (~$25/mo, inclui 1 custom domain).
2. **Supabase Dashboard** → Settings → Custom Domains → digite `auth.maximussolutions.app`. Ele gera 1 CNAME + 1 TXT de verificação.
3. **DNS** (Vercel/Cloudflare):
   - `CNAME auth.maximussolutions.app → <valor-supabase>.supabase.co`
   - `TXT _cf-custom-hostname.auth → <valor-supabase>`
   Aguarde 5-30 min e clique **Activate** no dashboard.
4. **Google Cloud Console** → Credentials → Web OAuth Client → Authorized redirect URIs:
   - Remover: `https://kcryjyznkxaoclrmbadi.supabase.co/auth/v1/callback`
   - Adicionar: `https://auth.maximussolutions.app/auth/v1/callback`
5. **Código**: trocar 1 linha em `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://auth.maximussolutions.app
   ```
   Depois `npm run build` (web) + `npm run android:bundle` (AAB), push para main.
6. **Validar** com `curl https://auth.maximussolutions.app/auth/v1/health` → deve retornar `200 OK`. Fazer login com Google — tela de consentimento agora mostra `auth.maximussolutions.app`.

Nenhuma alteração no `assetlinks.json` ou nos Redirect URLs do Supabase (Site URL + Redirect URLs já estão em `www.maximussolutions.app` e continuam iguais).
