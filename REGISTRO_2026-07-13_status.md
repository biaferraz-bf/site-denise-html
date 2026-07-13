# Denise Damiani Site — Status 13/07/2026

## ✅ Concluído
1. **Dobra 3D do livro restaurada** — wrapper `.book-3d` com perspectiva e spine animado
2. **Livro com fundo transparente** — removido fundo branco, adicionada sombra CSS
3. **Nova imagem do livro** — substituída por versão com mais perspectiva (mais inclinada)
4. **Estrutura i18n completa** — PT/EN/FR/ES em subdirectórios
5. **Todas as páginas online** — home + Sobre, Livro, Conselho, Fundo Saphira, Palestras, Blog, Acervo

## 🚨 Pendente
1. **Parallax do hero não está funcionando**
   - Mapa deveria girar em perspectiva 3D conforme scroll (rotateX/rotateY)
   - CSS tem `perspective: 1200px` + `transform-style: preserve-3d`
   - JS tem heroJob que calcula CAM (rx: 50, ry: 8, scale: 0.34, tx: 8, ty: -4, drift: 0.10)
   - Problema: transform do mapa não está sendo atualizado durante scroll
   - Suspeita: scrollJobs não está sendo acionado ou heroJob não está executando
   - Próximo passo: Debugar por que requestAnimationFrame/scroll listener não está funcionando

2. **Double mockup na página do livro**
   - Remover CSS 3D wrapper ou usar imagem direta na livro.html
   - Atual: `<img class="book-3d__cover">` dentro de `<div class="book-3d">`
   - Solução: Remover wrapper ou remover CSS 3D styling de livro.html

## 📊 Dados Técnicos
- **Repo**: https://github.com/biaferraz-bf/site-denise-html
- **Deploy**: Cloudflare Pages (denisedamiani-aprovacao.biaferraz.com.br)
- **Arquivos principais**:
  - `css/style.css` — design system v3, perspective, animations
  - `js/main.js` — 402 linhas, scroll orchestration com scrollJobs array
  - `img/livro-mockup-3d.png` — nova imagem 171KB (fundo transparente)

## 💭 Notas
- Removidas tentativas Astro (CSS bundling falhou)
- Mantida arquitetura HTML pura com JS vanilla
- Loader + globe animation funcionam corretamente
- FontShare General Sans carregando OK
- Network canvas (net-bg) funcionando

---
**Próxima ação**: Debugar parallax hero — verificar se scrollJobs.push(heroJob) está sendo chamado e se requestAnimationFrame está acionando runJobs.
