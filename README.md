# Incantare Joinville — Harmonização de Bumbum

Landing estática publicada em https://harmonizacao-bumbum-joinville.vercel.app/.

## Fotos e correção de 18/09/2026

Os três WebP anteriores estavam truncados e não podiam ser decodificados:

| Arquivo | Bytes anteriores | Bytes declarados no RIFF | Bytes corrigidos | Resolução |
| --- | ---: | ---: | ---: | --- |
| `assets/resultado-1.webp` | 7.500 | 7.554 | 152.656 | 1600 × 1197 |
| `assets/resultado-2.webp` | 15.008 | 19.978 | 46.468 | 1082 × 497 |
| `assets/resultado-3.webp` | 7.512 | 76.770 | 25.836 | 700 × 525 |

As fotos foram substituídas pelos três JPEG originais encontrados em Downloads,
com nome `WhatsApp Image 2026-09-18 at 15.47.46.jpeg`, `.jpeg1.jpeg` e `.jpeg2.jpeg`,
respectivamente. Conversão WebP com qualidade 95, sem redimensionar ou retocar.
Cada arquivo foi aberto e completamente decodificado com Pillow e no navegador.

O HTML usa `/assets/resultado-1.webp`, `/assets/resultado-2.webp` e
`/assets/resultado-3.webp`. O lightbox usa os mesmos arquivos. O logotipo existente
foi extraído sem alteração para `assets/incantare-logo.webp`; não há imagens em
Base64 nem dependência do GitHub RAW.

`assets/results.js` controla os três slides, setas, indicadores, swipe horizontal,
lightbox, contador, Escape e teclas de seta. O diálogo nativo mantém o foco dentro
da ampliação. A altura do carrossel acompanha a proporção de cada original.

Hero, oferta, quiz, contatos e rodapés foram preservados. O script de tracking
permaneceu idêntico ao original, incluindo os cinco eventos existentes e seus
metadados. O WhatsApp da clínica continua sendo `5547996650381`.

## Testar localmente

Execute `python tests/serve.py` e abra http://127.0.0.1:4174. O servidor define
explicitamente `image/webp`, inclusive no Windows.

Com o pacote Node `playwright` e o Google Chrome disponíveis:

```sh
node tests/verify.cjs http://127.0.0.1:4174 local
node tests/verify.cjs https://harmonizacao-bumbum-joinville.vercel.app production
```

O teste verifica 360, 375, 390, 414, 430 e 1440 px: três imagens decodificadas,
proporção, ausência de overflow, setas, indicadores, swipe por eventos reais de
touch do Chrome, ampliação, fechamento, teclado, quiz e dataLayer. Os links de
contato são testados com navegação impedida; nenhuma mensagem é enviada.
Também verifica HTTP 200, MIME WebP, estrutura RIFF e igualdade dos bytes servidos
com os arquivos locais. Relatórios e screenshots ficam em `test-results/`.

## Publicação

Repositório: `acantomarketingdigital-beep/harmonizacao-bumbum-joinville`.
Projeto Vercel: `harmonizacao-bumbum-joinville`, conectado ao GitHub, produção em `main`.
Um push em `main` aciona o deploy da raiz do repositório, incluindo `assets/`.
`vercel.json` define projeto estático e diretório de saída `.`.

Para uma publicação manual, execute na raiz deste repositório:

```sh
vercel link --yes --project harmonizacao-bumbum-joinville
vercel --prod --yes
```

Nunca publique apenas `index.html`. Os arquivos de teste e os resultados locais
são excluídos do deploy por `.vercelignore`.
