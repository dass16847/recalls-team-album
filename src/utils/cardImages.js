// Helper function to get card image by name
export const getCardImage = (cardName) => {
  // Convert database name to filename
  const nameToFilename = {
    'ADRIANA CRUZ': 'adriana-cruz',
    'JEFF BEZOS': 'jeff-bezos', 
    'JP': 'jp',
    'SJO 16 AFZ': 'amazon-sjo-16',
    'ANDREY SOTO': 'andrey-soto',
    'RAFA': 'rafa-aguero',
    'IRE': 'ire-vargas',
    'PAWEL': 'pawel',
    'ISMA VINDAS': 'isma-vindas',
    'ARIEL BOLANOS': 'ariel-bolanos',
    'EIMY TORRES': 'eimy-torres',
    'MARYPAZ MORA': 'marypaz-mora',
    'DARIO CAMPOS': 'dario-campos',
    'JULIAN HERNANDEZ': 'julian-hernandez',
    'STEVEN GONZALEZ': 'steven-gonzalez',
    'DANIEL GUADAMUZ': 'daniel-guadamuz',
    'JORGE BRENES': 'jorge-brenes',
    'NICK NOVA': 'nick-nova',
    'VERO DURAN': 'vero-duran',
    'JOSE REYES': 'jose-reyes',
    'PAULETTE RUIZ': 'paulette-ruiz',
    'JOSE MONGE': 'jose-monge',
    'NATHALIE GONZALEZ': 'nathalie-gonzalez',
    'BRAYAN SALAZAR': 'brayan-salazar',
    'YANIFEL ALVARADO': 'yanifel-alvarado',
    'VALERIA CUBERO': 'valeria-cubero',
    'ANTONIO AMEZ': 'antonio-amez',
    'GREIVIN MEZA': 'greivin-meza',
    'PAOLA JIMENEZ': 'paola-jimenez',
    'NATALIA ABARCA': 'natalia-abarca',
    'ISAAC AVILA': 'isaac-avila',
    'ANDREINA CASTILLO': 'andreina-castillo',
    'WILBERT CEDENO': 'wilbert-cedeno',
    'RAQUEL FERNANDEZ': 'raquel-fernandez',
    'FERGIE MONCADA': 'fergie-moncada',
    'TOMAS SOLEY': 'tomas-soley',
    'MARIANELLA PEREZ': 'marianella-perez',
    'ALLAN HIDALGO': 'allan-hidalgo',
    'KATHERINE MORERA': 'katherine-morera',
    'DANIELA JIMENEZ': 'daniela-jimenez',
    'PILAR HERNANDEZ': 'pilar-hernandez',
    'MAIKOL DIAZ': 'maikol-diaz',
    'RAQUEL BLANCO': 'raquel-blanco',
    'TAYRON DURAN': 'tayron-duran',
    'STEPH ANGULO': 'steph-angulo',
    'GABRIELA GOMEZ': 'gabriela-gomez',
    'RAMIRO CHACON': 'ramiro-chacon',
    'HENRY RODRIGUEZ': 'henry-rodriguez',
    'NATALIA BLANCO': 'natalia-blanco',
    'YEYLAN AGUIRRE': 'yeylan-aguirre',
    'LY ANN HERRERA': 'ly-ann-herrera',
    'PABLO DELGADO': 'pablo-delgado',
    'DAVID GONZALEZ': 'david-gonzalez',
    'ARIANA ALCAZAR': 'ariana-alcazar',
    'PAOLA QUIROS': 'paola-quiros',
    'SHARON UMANA': 'sharon-umana',
    'DAVID LOAIZA': 'david-loaiza',
    'LAURA MUNOZ': 'laura-munoz',
    'HENRY MOLINA': 'henry-molina',
    'ESTEBAN VALERIO': 'esteban-valerio',
    'JENSI PEINADO': 'jensi-peinado',
    'DAVID SEITZ': 'david-seitz',
    'JAZMIN DELGADO': 'jazmin-delgado',
    'JOSE MASIS': 'jose-masis',
    'MARIA PANA': 'maria-pana',
    'JORDAN MORA': 'jordan-mora',
    'SHARON QUESADA': 'sharon-quesada',
    'MITZY HERNANDEZ': 'mitzy-hernandez',
    'KEVIN HIDALGO': 'kevin-hidalgo',
    'MAYCOL MOREIRA': 'maycol-moreira',
    'ANDY JASSY': 'andy-jassy'
  };

  const filename = nameToFilename[cardName.toUpperCase()];

  if (!filename) {
    console.warn(`No filename mapping found for: ${cardName}`);
    return null;
  }

  try {
    return require(`../images/cards/${filename}.png`);
  } catch (error) {
    console.warn(`Card image not found: ${filename}.png`);
    return null;
  }
};

export default getCardImage;