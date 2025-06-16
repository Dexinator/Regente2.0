// Definición de las sentencias con sus componentes
const SENTENCIAS = {
  "Infracción": {
    nombre: "Infracción",
    descripcion: "Sentencia leve para infracciones menores",
    componentes: [
      {
        tipo: "opcion",
        opciones: [
          { categoria: "Preparados", filtro: "Brebaje", variantes: ["Café", "Piña-Limón"] }
        ],
        cantidad: 1
      },
      {
        tipo: "opcion",
        opciones: [
          { categoria: "Cerveza", filtro: "Popular", cantidad: 1 },
          { categoria: "Pulque", filtro: "Natural", tamano: "1/2 Litro", cantidad: 1 }
        ]
      }
    ]
  },
  "El Apando": {
    nombre: "El Apando",
    descripcion: "Sentencia media para delitos moderados",
    componentes: [
      {
        tipo: "fijo",
        categoria: "Pulque",
        filtro: "Curado Especial",
        tamano: "1/2 Litro",
        cantidad: 1
      },
      {
        tipo: "opcion",
        opciones: [
          { categoria: "Preparados", filtro: "Brebaje", variantes: ["Café", "Piña-Limón"] }
        ],
        cantidad: 1
      },
      {
        tipo: "fijo",
        categoria: "Antojitos",
        filtro: "Molletes",
        ingrediente: true,
        cantidad: 1
      }
    ]
  },
  "Noche en los Separos": {
    nombre: "Noche en los Separos",
    descripcion: "Sentencia grave para delitos mayores",
    componentes: [
      {
        tipo: "opcion",
        opciones: [
          { categoria: "Preparados", filtro: "Brebaje", variantes: ["Café", "Piña-Limón"] }
        ],
        cantidad: 1
      },
      {
        tipo: "opcion",
        opciones: [
          { categoria: "Cerveza", filtro: "Popular", cantidad: 2 },
          { categoria: "Pulque", filtro: "de la Semana", tamano: "1 Litro", cantidad: 1 }
        ]
      },
      {
        tipo: "fijo",
        categoria: "Antojitos",
        filtro: "Molletes",
        ingrediente: true,
        cantidad: 1
      }
    ]
  },
  "Pena Capital": {
    nombre: "Pena Capital",
    descripcion: "Sentencia máxima para los delitos más graves",
    componentes: [
      {
        tipo: "fijo",
        categoria: "Preparados",
        filtro: "Brebaje Tradicional",
        cantidad: 1
      },
      {
        tipo: "fijo",
        categoria: "Pulque",
        filtro: "Natural",
        tamano: "1/2 Litro",
        cantidad: 1
      },
      {
        tipo: "fijo",
        categoria: "Cerveza",
        filtro: "Popular",
        cantidad: 1
      }
    ]
  }
};

export default SENTENCIAS; 