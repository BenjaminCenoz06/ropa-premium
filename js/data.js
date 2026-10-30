/* Güemes Vintage · datos de la tienda
   Contacto, horarios, dirección y fotos salen del Instagram (@guemesvintage) y de Google Maps.
   Son piezas únicas y no publican precios: las prendas figuran como "Consultar" y se consultan por WhatsApp.
   Si más adelante querés mostrar precios, poné `price` en cada prenda y `noPrices: false`. */
window.STORE = {
  key: 'guemes',
  name: 'Güemes Vintage',
  word: 'GÜEMES',
  tagline: 'Vintage, americana y segunda mano',
  slogan: ['Esto es', 'Güemes'],
  handle: '@guemesvintage',
  whatsapp: '5493512586695',
  phone: '0351 15-258-6695',
  instagram: 'https://www.instagram.com/guemesvintage/',
  address: 'Dr. T. Achával Rodríguez 238',
  city: 'Güemes, Córdoba',
  barrio: 'Güemes',
  maps: 'https://www.google.com/maps/search/?api=1&query=G%C3%BCemes+Vintage+Achaval+Rodriguez+238+Cordoba',
  hours: [['Lunes a domingo', '18 a 22 h']],
  hoursShort: 'Lun a dom 18 a 22 h',
  installments: 0,
  noPrices: true,
  feeText: 'Pieza única · consultá el precio por WhatsApp',
  shipText: 'Entrega a domicilio',
  payments: 'Consultá los medios de pago por WhatsApp',
  rating: '4,8',
  reviews: 31,
  marquee: ['Piezas únicas', 'Vintage y americana'],
  heroCut: ['assets/guemes/hero-calle-cut.webp', 'assets/guemes/hero-calle2-cut.webp'],   // recortes del chico (uno por foto): se dibujan encima de la palabra GÜEMES
  hero: [
    ['assets/guemes/hero-calle.webp', 'Chico sentado en la calle con remera azul y jean ancho'],
    ['assets/guemes/hero-calle2.webp', 'Chico sentado en la calle con las manos juntas']
  ],
  duo: [
    { href: '#/catalogo', img: 'assets/guemes/r36.webp', alt: 'Chica sonriendo con una gorra y un buzo vintage', title: 'ARCHIVO', tag: 'PIEZAS ÚNICAS', desc: 'Remeras, buzos y camisas de marcas americanas, una por una.' },
    { href: '#/catalogo/looks', img: 'assets/guemes/p04.webp', alt: 'Look del día con buzo gris oversize', title: 'LOOKS', tag: 'GÜEMES EDIT', desc: 'Outfits armados con prendas de la tienda para inspirarte.' }
  ],
  visitImg: ['assets/guemes/r01.webp', 'Pasillo del local de Güemes Vintage con ropa colgada'],
  visitTitle: 'Nuestro local en Güemes',
  visitText: 'Entrá a revolver: cada pieza es única. También hacemos pop ups de vintage, joyitas y cafecito; las fechas las anunciamos en Instagram.',
  perks: [
    ['Piezas únicas', 'Cada prenda es una sola. Escribinos por WhatsApp para saber si sigue disponible.'],
    ['Pop ups y cafecito', 'Ferias de vintage, joyitas y gangas. Las fechas, en nuestro Instagram.'],
    ['Entrega a domicilio', 'Coordinamos la entrega por WhatsApp.']
  ],
  chips: ['Muy buenos precios', 'Variedad inagotable', 'Buena curaduría de vintage', 'Atención amable'],
  quotes: [
    ['Excelente atención, buena curaduría de vintages, calidad y precios acordes.', 'Adriana R.'],
    ['Ropa muy difícil de conseguir a excelente precio. Nace un clásico cordobés en lo que respecta a ropa.', 'Joa V.'],
    ['Muy buenos precios y buena variedad de prendas.', 'Reseña en Google']
  ],
  split: ['remera-harley-davidson', 'remera-palmeras', 'remera-wild-life-caballos', 'camisaco-a-cuadros-con-capucha', 'remera-blue-jays', 'remera-puente-japones', 'remeras-carhartt-de-bolsillo', 'remera-dickies', 'hoodie-essentials']
};

const G = 'assets/guemes/';
const UNICA = ['Única'];
const spec = ['Pieza única', 'Vintage / americana', 'Consultá talle y estado por WhatsApp'];
const specLook = ['Look armado con prendas de la tienda', 'Consultá qué piezas siguen disponibles'];

window.CATS = ['Remeras', 'Abrigos y buzos', 'Looks'];

function item(id, slug, name, cat, img, desc, extra) {
  return Object.assign({ id: id, slug: slug, name: name, cat: cat, price: 0, img: G + img + '.webp', hover: null, gallery: [G + img + '.webp'], sizes: UNICA, desc: desc, specs: cat === 'Looks' ? specLook : spec }, extra || {});
}

window.PRODUCTS = [
  item(1, 'remera-harley-davidson', 'Remera Harley-Davidson', 'Remeras', 'p44', 'Remera negra vintage de Harley-Davidson, con estampa de época y mucho carácter.', { tag: 'Pieza única' }),
  item(2, 'remera-palmeras', 'Remera Estampa Palmeras', 'Remeras', 'p45', 'Remera azul oversize con estampa de palmeras en el frente. Pieza americana difícil de conseguir.'),
  item(3, 'remera-wild-life-caballos', 'Remera Wild Life Tees', 'Remeras', 'p46', 'Remera tie dye azul con estampa de caballos al galope, de la línea Wild Life Tees.', { tag: 'Pieza única' }),
  item(4, 'remera-blue-jays', 'Remera Blue Jays', 'Remeras', 'r32', 'Remera blanca con una escena nevada de aves azules (blue jays). Una estampa de las que ya no se ven.'),
  item(5, 'remera-puente-japones', 'Remera Puente Japonés', 'Remeras', 'r34', 'Remera con estampa de un puente japonés y degradé azul. Corte holgado y tela suave.'),
  item(6, 'remeras-carhartt-de-bolsillo', 'Remeras Carhartt de Bolsillo', 'Remeras', 'r42', 'Remeras Carhartt con bolsillo en el pecho, en bordó y verde agua. Clásicos del workwear americano.'),
  item(7, 'remera-dickies', 'Remera Dickies', 'Remeras', 'r18', 'Remera azul marino Dickies con el logo grande en el pecho.'),
  item(8, 'remera-dickies-de-bolsillo', 'Remera Dickies de Bolsillo', 'Remeras', 'r16', 'Remera Dickies de manga corta con bolsillo, en tono arena. Una base americana.'),
  item(9, 'remera-verde-con-pin', 'Remera Verde con Pin', 'Remeras', 'p38', 'Remera verde botella con un pin pintado a mano en el pecho.'),
  item(10, 'remera-bordada-boston', 'Remera Bordada Boston', 'Remeras', 'r40', 'Remera gris con bordado en la espalda, de estilo college americano.'),
  item(11, 'camisaco-a-cuadros-con-capucha', 'Camisaco a Cuadros con Capucha', 'Abrigos y buzos', 'p43', 'Camisaco a cuadros grises con capucha y bolsillos. Abriga y se lleva como campera liviana.', { tag: 'Pieza única' }),
  item(12, 'hoodie-essentials', 'Hoodie Essentials Gris', 'Abrigos y buzos', 'p04', 'Hoodie gris oversize con la marca grande en la espalda. Corte holgado y capucha amplia.'),
  item(13, 'look-guemes-edit-01', 'Güemes Edit #01', 'Looks', 'p12', 'Texturas, capas y tonos que nos gustan: camisa y pantalón oscuros con medias bordó y mocasines.'),
  item(14, 'look-guemes-edit-02', 'Güemes Edit #02', 'Looks', 'p10', 'Una selección de looks para inspirarte: tapado gris, buzo, gorro y auriculares.'),
  item(15, 'look-guemes-edit-03', 'Güemes Edit #03', 'Looks', 'p06', 'Chomba rugby a rayas, pantalón azul marino y tote bag blanca.'),
  item(16, 'look-guemes-edit-04', 'Güemes Edit #04', 'Looks', 'p03', 'Buzo Baylor gris, pantalón a cuadros celestes y zapatillas azules.'),
  item(17, 'look-windbreaker-azul', 'Look Windbreaker Azul', 'Looks', 'p22', 'Rompevientos azul con vivos, pantalón beige, short y zapatillas de gamuza.'),
  item(18, 'look-camisa-a-rayas', 'Look Camisa a Rayas', 'Looks', 'p24', 'Camisa a rayas oversize, short marrón, mocasines y accesorios.'),
  item(19, 'look-beige-y-crema', 'Look Beige y Crema', 'Looks', 'p31', 'Remera crema, pantalón beige y sandalias: un look relajado para el calor.')
];

/* prendas recortadas (sin fondo, silueta) para el riel "Recién colgado" */
window.CUTOUTS = {
  'remera-harley-davidson': 'assets/cut/p44.webp',
  'remera-palmeras': 'assets/cut/p45.webp',
  'remera-wild-life-caballos': 'assets/cut/p46.webp',
  'remera-puente-japones': 'assets/cut/r34.webp',
  'remera-bordada-boston': 'assets/cut/r40.webp',
  'camisaco-a-cuadros-con-capucha': 'assets/cut/p43.webp',
  'remeras-carhartt-de-bolsillo': 'assets/cut/r42.webp',
  'hoodie-essentials': 'assets/cut/p04.webp',
  'look-guemes-edit-01': 'assets/cut/p12.webp',
  'look-guemes-edit-02': 'assets/cut/p10.webp',
  'look-guemes-edit-03': 'assets/cut/p06.webp',
  'look-guemes-edit-04': 'assets/cut/p03.webp',
  'look-windbreaker-azul': 'assets/cut/p22.webp',
  'look-camisa-a-rayas': 'assets/cut/p24.webp',
  'look-beige-y-crema': 'assets/cut/p31.webp'
};
/* las prendas con recorte se muestran sin fondo en todo el sitio (tarjetas, ficha, buscador, carrito) */
window.PRODUCTS.forEach(function (p) { var c = window.CUTOUTS[p.slug]; if (c) { p.img = c; p.gallery = [c]; p.cut = true; p.thumb = c.replace('assets/cut/', 'assets/cut/s/'); } });

window.FEATURED =['remera-harley-davidson', 'camisaco-a-cuadros-con-capucha', 'remera-wild-life-caballos', 'look-guemes-edit-01'];

/* fondos del panel fijo de "Nueva temporada" (uno por prenda) */
window.SPLIT_BG = ['r01', 'r07', 'r08', 'r26', 'r36', 'p37', 'p04', 'p17', 'p14'].map(function (n) { return G + n + '.webp'; });

/* carrusel de Instagram */
window.FEED = ['p14', 'p17', 'p37', 'r36', 'r26', 'r08', 'r01', 'p04'].map(function (n) { return G + n + '.webp'; });
