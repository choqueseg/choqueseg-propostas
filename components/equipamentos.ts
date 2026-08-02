export type Equipamento = {
  id: string;
  marca: string;
  modelo: string;
  potencia: string;
  bifacial?: boolean;
};

export const modulosPadrao: Equipamento[] = [
  {
    id: "jinko-625",
    marca: "Jinko Solar",
    modelo: "Tiger Neo",
    potencia: "625 W",
    bifacial: true,
  },
  {
    id: "jinko-630",
    marca: "Jinko Solar",
    modelo: "Tiger Neo",
    potencia: "630 W",
    bifacial: true,
  },
  {
    id: "jinko-710",
    marca: "Jinko Solar",
    modelo: "Tiger Neo",
    potencia: "710 W",
    bifacial: true,
  },
  {
    id: "trina-625",
    marca: "Trina Solar",
    modelo: "Vertex N",
    potencia: "625 W",
    bifacial: true,
  },
  {
    id: "ja-620",
    marca: "JA Solar",
    modelo: "DeepBlue",
    potencia: "620 W",
    bifacial: true,
  },
  {
    id: "canadian-585",
    marca: "Canadian Solar",
    modelo: "TOPHiKu6",
    potencia: "585 W",
    bifacial: false,
  },
  {
    id: "longi-630",
    marca: "LONGi Solar",
    modelo: "Hi-MO",
    potencia: "630 W",
    bifacial: true,
  },
];

export const inversoresPadrao: Equipamento[] = [
  {
    id: "huawei-3",
    marca: "Huawei",
    modelo: "SUN2000",
    potencia: "3 kW",
  },
  {
    id: "huawei-5",
    marca: "Huawei",
    modelo: "SUN2000",
    potencia: "5 kW",
  },
  {
    id: "huawei-6",
    marca: "Huawei",
    modelo: "SUN2000",
    potencia: "6 kW",
  },
  {
    id: "huawei-8",
    marca: "Huawei",
    modelo: "SUN2000",
    potencia: "8 kW",
  },
  {
    id: "huawei-10",
    marca: "Huawei",
    modelo: "SUN2000",
    potencia: "10 kW",
  },
  {
    id: "growatt-3",
    marca: "Growatt",
    modelo: "MIN",
    potencia: "3 kW",
  },
  {
    id: "growatt-5",
    marca: "Growatt",
    modelo: "MIN",
    potencia: "5 kW",
  },
  {
    id: "growatt-6",
    marca: "Growatt",
    modelo: "MIN",
    potencia: "6 kW",
  },
  {
    id: "solplanet-5",
    marca: "Solplanet",
    modelo: "ASW",
    potencia: "5 kW",
  },
  {
    id: "foxess-6",
    marca: "FoxESS",
    modelo: "Série S",
    potencia: "6 kW",
  },
  {
    id: "saj-6",
    marca: "SAJ",
    modelo: "R5",
    potencia: "6 kW",
  },
];

export const microinversoresPadrao: Equipamento[] = [
  {
    id: "hoymiles-1600",
    marca: "Hoymiles",
    modelo: "HMS-1600",
    potencia: "1,6 kW",
  },
  {
    id: "hoymiles-2000",
    marca: "Hoymiles",
    modelo: "HMS-2000",
    potencia: "2 kW",
  },
  {
    id: "hoymiles-2250",
    marca: "Hoymiles",
    modelo: "HMS-2250",
    potencia: "2,25 kW",
  },
  {
    id: "apsystems-ds3",
    marca: "APsystems",
    modelo: "DS3",
    potencia: "0,96 kW",
  },
];