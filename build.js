// ─────────────────────────────────────────────────────────
//  ResiRamos — build.js
//  Lê as peças de content/pecas/*.json e escreve os cards
//  dentro de cada página de categoria, ENTRE os marcadores:
//      <!-- PECAS:INICIO -->   ...   <!-- PECAS:FIM -->
//  Todo o resto da página (menu, SEO, textos) fica intacto.
//
//  Como usar:  node build.js
// ─────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PASTA_PECAS = path.join(RAIZ, 'content', 'pecas');
const SITE = 'https://resiramos.vercel.app';
const WA = 'https://wa.me/5515991488234?text=';

const INICIO = '<!-- PECAS:INICIO -->';
const FIM = '<!-- PECAS:FIM -->';

// ── As categorias do site ──────────────────────────────────
//  chave   = o valor do campo "categoria" nas peças
//  arquivo = onde está a página dessa categoria
//  vazio   = aviso mostrado quando a categoria não tem peças
//  blocoSempre = true mostra o aviso mesmo com peças (Atacado)
const CATEGORIAS = [
    {
        chave: 'beleza',
        arquivo: 'beleza/beleza.html',
        vazio: {
            titulo: 'Coleção em preparação',
            texto: 'Ainda não há peças publicadas nesta categoria. Para saber das novidades ou encomendar uma peça sob medida, fale com a Resi pelo WhatsApp.',
            botao: 'Falar pelo WhatsApp',
            link: WA + 'Olá,%20gostaria%20de%20saber%20das%20novidades%20e%20encomendar%20uma%20peça.'
        }
    },
    {
        chave: 'decoracao',
        arquivo: 'decoracao/decoracao.html',
        vazio: {
            titulo: 'Coleção em preparação',
            texto: 'Ainda não há peças publicadas nesta categoria. Para saber das novidades ou encomendar uma peça sob medida, fale com a Resi pelo WhatsApp.',
            botao: 'Falar pelo WhatsApp',
            link: WA + 'Olá,%20gostaria%20de%20saber%20das%20novidades%20e%20encomendar%20uma%20peça.'
        }
    },
    {
        chave: 'jogos',
        arquivo: 'jogos/jogos.html',
        vazio: {
            titulo: 'Coleção em preparação',
            texto: 'Ainda não há peças publicadas nesta categoria. Para saber das novidades ou encomendar uma peça sob medida, fale com a Resi pelo WhatsApp.',
            botao: 'Falar pelo WhatsApp',
            link: WA + 'Olá,%20gostaria%20de%20saber%20das%20novidades%20e%20encomendar%20uma%20peça.'
        }
    },
    {
        chave: 'atacado',
        arquivo: 'atacado/atacado.html',
        blocoSempre: true,
        vazio: {
            titulo: 'Para lojistas e revendedores',
            texto: 'Cada peça é produzida à mão e sob encomenda. Para valores, prazos e quantidades, fale direto com a Resi pelo WhatsApp.',
            botao: 'Solicitar condições de atacado',
            link: WA + 'Olá,%20gostaria%20de%20saber%20as%20condições%20para%20atacado.'
        }
    }
];

// ── Funções de apoio ───────────────────────────────────────

// Protege o texto para entrar no HTML sem quebrar a página
function escapar(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// "189,90" ou "189.90" ou "R$ 189,90" -> 189.9  (ou null se vazio/inválido)
function paraNumero(texto) {
    let t = String(texto || '').replace(/[^\d.,]/g, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
}

// 189.9 -> "R$ 189,90"
function formatarPreco(texto) {
    const n = paraNumero(texto);
    if (n === null) return null;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function urlAbsoluta(caminhoImagem) {
    const c = caminhoImagem.startsWith('/') ? caminhoImagem : '/' + caminhoImagem;
    return SITE + encodeURI(c);
}

// ── Leitura das peças ──────────────────────────────────────

function lerPecas() {
    if (!fs.existsSync(PASTA_PECAS)) {
        throw new Error('Pasta não encontrada: ' + PASTA_PECAS);
    }
    return fs.readdirSync(PASTA_PECAS)
        .filter(nome => nome.endsWith('.json'))
        .map(nome => {
            try {
                return JSON.parse(fs.readFileSync(path.join(PASTA_PECAS, nome), 'utf8'));
            } catch (erro) {
                throw new Error(`Arquivo com problema (${nome}): ${erro.message}`);
            }
        })
        .filter(p => p.visivel !== false) // "Visível no site" desmarcado = esconde
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || String(a.titulo).localeCompare(String(b.titulo), 'pt-BR'));
}

// ── Montagem do HTML ───────────────────────────────────────

function renderCard(p) {
    const fotos = Array.isArray(p.fotos) ? p.fotos : [];

    const imagens = fotos.map((f, i) => {
        const alt = f.descricao || (i === 0 ? `${p.titulo} - Resi Ramos` : `${p.titulo} - foto ${i + 1}`);
        return `                        <img src="${escapar(encodeURI(f.imagem))}" alt="${escapar(alt)}" loading="lazy" width="400" height="400">`;
    }).join('\n');

    const pontos = fotos
        .map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}"></span>`)
        .join('');

    // O script.js espera sempre ter setas e pontos; com 1 foto só, o CSS os esconde
    const classeCarrossel = fotos.length <= 1 ? 'carousel carousel-unica' : 'carousel';

    const preco = formatarPreco(p.preco);
    const promo = formatarPreco(p.preco_promocional);
    let blocoPreco = '';
    if (promo && preco) {
        blocoPreco = `<div class="card-preco"><s>${preco}</s> <span>${promo}</span></div>`;
    } else if (promo || preco) {
        blocoPreco = `<div class="card-preco"><span>${promo || preco}</span></div>`;
    }

    const descricao = escapar(p.descricao || '').replace(/\n/g, '<br>');

    return `            <article class="card">
                <div class="${classeCarrossel}" data-index="0">
                    <div class="carousel-track">
${imagens}
                    </div>
                    <button class="carousel-btn prev" aria-label="Foto anterior">&#10094;</button>
                    <button class="carousel-btn next" aria-label="Próxima foto">&#10095;</button>
                    <div class="carousel-dots">${pontos}</div>
                </div>
                <div class="card-content">
                    <h3>${escapar(String(p.titulo).toLocaleUpperCase('pt-BR'))}</h3>
                    <h4>${escapar(p.tamanho || '')}</h4>
                    ${blocoPreco}
                    <p>${descricao}</p>
                    <a href="${WA}Olá,%20gostaria%20de%20solicitar%20uma%20peça%20personalizada." target="_blank" class="btn-outline btn-whatsapp" rel="noopener">Solicitar peça personalizada</a>
                </div>
            </article>`;
}

function renderVazio(cat) {
    const v = cat.vazio;
    const classe = cat.blocoSempre ? 'vazio vazio-fixo' : 'vazio';
    return `        <section class="${classe}">
            <h2>${escapar(v.titulo)}</h2>
            <p>${escapar(v.texto)}</p>
            <a href="${v.link}" target="_blank" class="btn-outline btn-whatsapp" rel="noopener">${escapar(v.botao)}</a>
        </section>`;
}

// Dados estruturados (ajudam o Google a entender produto e preço)
function renderJsonLd(pecas) {
    const produtos = pecas
        .map(p => {
            const valor = paraNumero(p.preco_promocional) ?? paraNumero(p.preco);
            if (valor === null) return null; // sem preço, sem oferta
            const fotos = Array.isArray(p.fotos) ? p.fotos : [];
            return {
                '@type': 'Product',
                name: p.titulo,
                description: p.descricao,
                image: fotos.map(f => urlAbsoluta(f.imagem)),
                brand: { '@type': 'Brand', name: 'Resi Ramos' },
                offers: { '@type': 'Offer', price: valor.toFixed(2), priceCurrency: 'BRL' }
            };
        })
        .filter(Boolean);

    if (produtos.length === 0) return '';

    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': produtos }, null, 2)
        .replace(/</g, '\\u003c'); // impede que um texto feche a tag <script> sem querer

    return `        <script type="application/ld+json">\n${json}\n        </script>`;
}

// ── Escrita na página ──────────────────────────────────────

function aplicarNaPagina(cat, pecas) {
    const caminho = path.join(RAIZ, cat.arquivo);
    if (!fs.existsSync(caminho)) {
        throw new Error(`Página não encontrada: ${cat.arquivo}`);
    }
    const html = fs.readFileSync(caminho, 'utf8');
    const i = html.indexOf(INICIO);
    const f = html.indexOf(FIM);
    if (i === -1 || f === -1 || f < i) {
        throw new Error(`Faltam os marcadores ${INICIO} e ${FIM} em ${cat.arquivo}`);
    }

    const partes = [];
    if (pecas.length > 0) {
        partes.push(`        <div class="grid">\n${pecas.map(renderCard).join('\n')}\n        </div>`);
    }
    if (pecas.length === 0 || cat.blocoSempre) {
        partes.push(renderVazio(cat));
    }
    const jsonLd = renderJsonLd(pecas);
    if (jsonLd) partes.push(jsonLd);

    const novo = html.slice(0, i + INICIO.length) + '\n' + partes.join('\n') + '\n        ' + html.slice(f);
    fs.writeFileSync(caminho, novo, 'utf8');
}

// ── Execução ───────────────────────────────────────────────

function main() {
    const todas = lerPecas();
    const conhecidas = new Set(CATEGORIAS.map(c => c.chave));

    todas
        .filter(p => !conhecidas.has(p.categoria))
        .forEach(p => console.warn(`Aviso: a peça "${p.titulo}" tem categoria desconhecida ("${p.categoria}") e não aparece em nenhuma página.`));

    CATEGORIAS.forEach(cat => {
        const pecas = todas.filter(p => p.categoria === cat.chave);
        aplicarNaPagina(cat, pecas);
        console.log(`${cat.arquivo}: ${pecas.length} peça(s)`);
    });
}

try {
    main();
} catch (erro) {
    console.error('Erro: ' + erro.message);
    process.exit(1);
}
