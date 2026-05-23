/**
 * Business model analysis engine.
 *
 * Market prices are 2024-2025 estimates for the Medellín metro area sourced
 * from Finca Raíz / Properati market reports. All values are in COP.
 *
 * The property price from the dataset is the actual acquisition cost.
 * Market reference prices are used to estimate exit value and rental income.
 */

// ─── Market data per neighborhood ─────────────────────────────────────────

type NeighborhoodMarket = {
  avgPricePerM2: number; // COP/m²
  avgRentPerM2: number;  // COP/m²/month
};

const NEIGHBORHOOD_MARKET: Record<string, NeighborhoodMarket> = {
  "El Poblado": { avgPricePerM2: 12_500_000, avgRentPerM2: 43_000 },
  Laureles:     { avgPricePerM2:  8_000_000, avgRentPerM2: 31_000 },
  Envigado:     { avgPricePerM2:  7_000_000, avgRentPerM2: 26_000 },
  Sabaneta:     { avgPricePerM2:  5_800_000, avgRentPerM2: 21_000 },
  Belén:        { avgPricePerM2:  5_000_000, avgRentPerM2: 19_000 },
  Itagüí:       { avgPricePerM2:  4_500_000, avgRentPerM2: 17_000 },
  "La Estrella":{ avgPricePerM2:  4_000_000, avgRentPerM2: 16_000 },
  Robledo:      { avgPricePerM2:  3_800_000, avgRentPerM2: 15_000 },
  Castilla:     { avgPricePerM2:  3_200_000, avgRentPerM2: 13_000 },
  "La Candelaria": { avgPricePerM2: 3_000_000, avgRentPerM2: 13_000 },
  Copacabana:   { avgPricePerM2:  2_700_000, avgRentPerM2: 10_000 },
  Bello:        { avgPricePerM2:  2_800_000, avgRentPerM2: 11_000 },
};

const DEFAULT_MARKET: NeighborhoodMarket = { avgPricePerM2: 5_000_000, avgRentPerM2: 18_000 };

export function getMarketData(neighborhood: string): NeighborhoodMarket {
  return NEIGHBORHOOD_MARKET[neighborhood] ?? DEFAULT_MARKET;
}

// ─── Constants ─────────────────────────────────────────────────────────────

// Income-hold models benefit from steady long-term appreciation (~3.5% EA).
// Capital-gain models assume a more active/bullish short-term market (~7% EA)
// but deteriorate if the exit is delayed — see staleness model below.
const INCOME_APPRECIATION  = 0.035; // buyRent, coliving
const CAPITAL_APPRECIATION = 0.07;  // flipping, buySell

// Monthly carrying cost on market value for idle capital-gain properties
// (predial ~0.7% EA + maintenance ~0.5% EA = ~1.2% EA total).
const MONTHLY_CARRYING_RATE = 0.012 / 12;

// Staleness: the longer an unsold property sits, the more buyers discount it.
// Flipping:  staleness starts after month 12 (gave renovation time to shine).
// Buy&Sell:  staleness starts after month 6 (no improvements to justify waiting).
// Rate: 1%/month beyond those thresholds, capped at 20% total.
const FLIPPING_STALE_START   = 12;
const BUY_SELL_STALE_START   = 6;
const STALE_RATE_PER_MONTH   = 0.01;
const STALE_CAP              = 0.20;

const BUYER_COST_RATE  = 0.025; // notaría + registro
const SELLER_COST_RATE = 0.035; // comisión 3% + cierre 0.5%

// Flipping-specific
const RENOVATION_COST_PER_M2       = 900_000;
const RENOVATION_MONTHS            = 3;
const FLIPPING_SALE_PREMIUM_START  = 0.08; // 8% above market at sale
const FLIPPING_PREMIUM_DECAY_MONTHS = 21;  // premium → 0 by month 24 (renovation ages)

// Coliving
const COLIVING_M2_PER_ROOM          = 18;
const COLIVING_SETUP_COST_PER_ROOM  = 5_000_000;
const COLIVING_SETUP_MONTHS         = 2;
const COLIVING_RENT_PREMIUM         = 1.5;
const COLIVING_EXPENSE_RATE         = 0.25;

// Buy & Rent
const RENT_EXPENSE_RATE = 0.15;

// ─── Types ─────────────────────────────────────────────────────────────────

export type BusinessModel = "flipping" | "buySell" | "coliving" | "buyRent";

export type PropertyInput = {
  price: number;
  area: number;
  neighborhood: string;
};

export type TimelinePoint = {
  month: number;
  profit: number;
  roiPct: number;
};

export type ModelSummary = {
  totalInvested: number;
  monthlyIncome: number;
  renovationCost: number;
  marketRefValue: number;
};

// ─── Risk data ─────────────────────────────────────────────────────────────

type L = { es: string; en: string };
export type RiskLevel = "low" | "medium" | "high";
export type Risk = { level: RiskLevel; label: L; description: L };

export const MODEL_RISKS: Record<BusinessModel, Risk[]> = {
  flipping: [
    {
      level: "high",
      label:       { es: "Sobrecosto de obra",   en: "Construction overrun" },
      description: {
        es: "El presupuesto de remodelación suele excederse un 20-40% por imprevistos estructurales, subidas de materiales o atrasos de contratistas.",
        en: "Renovation budgets typically run 20-40% over due to structural surprises, materials inflation, or contractor delays.",
      },
    },
    {
      level: "high",
      label:       { es: "Mercado a la baja",   en: "Market downturn" },
      description: {
        es: "Una corrección de precios durante la remodelación reduce el margen de salida directamente; sin arrendatario no hay plan B.",
        en: "A price correction during renovation directly erodes the exit margin; with no tenant there is no fallback plan.",
      },
    },
    {
      level: "medium",
      label:       { es: "Tiempo de venta",   en: "Time to sell" },
      description: {
        es: "Un inmueble reformado puede tardar 3-6 meses en venderse, acumulando costos de tenencia que comprimen la utilidad.",
        en: "A renovated property can take 3-6 months to sell, accumulating holding costs that compress the profit.",
      },
    },
    {
      level: "medium",
      label:       { es: "Riesgo constructivo",   en: "Hidden defects" },
      description: {
        es: "Hallazgos imprevistos (filtraciones, instalaciones, estructura) pueden paralizar la obra y disparar los costos de forma significativa.",
        en: "Hidden defects (waterproofing, outdated wiring, structure) can stall the renovation and significantly inflate costs.",
      },
    },
    {
      level: "low",
      label:       { es: "Costos de cierre",   en: "Transaction costs" },
      description: {
        es: "Los gastos notariales, de registro y comisión (~6%) reducen el margen de forma directa e inevitable en cada operación.",
        en: "Notary, registration, and commission costs (~6%) inevitably reduce the margin in every transaction.",
      },
    },
  ],

  buySell: [
    {
      level: "high",
      label:       { es: "Márgenes muy ajustados",   en: "Very thin margins" },
      description: {
        es: "Los costos de doble transacción (~5-6%) consumen toda la utilidad si el descuento inicial es menor al esperado.",
        en: "Double transaction costs (~5-6%) wipe out all profit if the initial discount is smaller than anticipated.",
      },
    },
    {
      level: "high",
      label:       { es: "Sobreestimación del descuento",   en: "Overestimated discount" },
      description: {
        es: "Confirmar que el precio está realmente por debajo de mercado exige análisis comparativo riguroso; la percepción de descuento puede ser errónea.",
        en: "Confirming a genuine below-market price requires rigorous comps analysis; perceived discounts can be illusions.",
      },
    },
    {
      level: "medium",
      label:       { es: "Tiempo para vender",   en: "Time to sell" },
      description: {
        es: "Encontrar comprador al precio objetivo puede tomar 3-6 meses, especialmente sin mejoras visibles que justifiquen el precio.",
        en: "Finding a buyer at the target price can take 3-6 months, especially with no visible improvements to justify it.",
      },
    },
    {
      level: "medium",
      label:       { es: "Sin flujo de caja",   en: "No cash flow" },
      description: {
        es: "Durante el periodo de tenencia no hay ingreso que compense los costos ni ofrezca un plan B si el inmueble no se vende.",
        en: "During the holding period there is no income to offset costs or provide a fallback if the property does not sell.",
      },
    },
    {
      level: "low",
      label:       { es: "Dependencia del ciclo",   en: "Cycle dependency" },
      description: {
        es: "El modelo funciona bien en mercados al alza y puede destruir valor en mercados planos o a la baja.",
        en: "This model works well in rising markets but can destroy value in flat or declining market conditions.",
      },
    },
  ],

  coliving: [
    {
      level: "high",
      label:       { es: "Riesgo regulatorio",   en: "Regulatory risk" },
      description: {
        es: "En muchas propiedades horizontales el subarriendo por habitaciones está prohibido en el reglamento de copropiedad, con multas y acciones legales.",
        en: "In many condominiums, room-by-room subletting is prohibited by HOA bylaws, with fines and legal exposure.",
      },
    },
    {
      level: "high",
      label:       { es: "Vacancia por rotación",   en: "Turnover vacancy" },
      description: {
        es: "La rotación de inquilinos es alta en coliving; habitaciones desocupadas entre contratos impactan el flujo de caja directamente.",
        en: "Tenant turnover is high in coliving; vacant rooms between contracts directly impact cash flow.",
      },
    },
    {
      level: "medium",
      label:       { es: "Desgaste acelerado",   en: "Accelerated wear" },
      description: {
        es: "El uso intensivo por múltiples ocupantes genera mayor mantenimiento y depreciación acelerada del inmueble.",
        en: "Intensive use by multiple occupants generates higher maintenance and faster property depreciation.",
      },
    },
    {
      level: "medium",
      label:       { es: "Complejidad operativa",   en: "Operational complexity" },
      description: {
        es: "Gestionar servicios compartidos, conflictos entre inquilinos, limpieza y rotación requiere tiempo o un gasto adicional de administración.",
        en: "Managing shared utilities, tenant conflicts, cleaning, and turnover requires time or additional management costs.",
      },
    },
    {
      level: "low",
      label:       { es: "Recuperación del setup",   en: "Setup recovery time" },
      description: {
        es: "La inversión inicial en adecuaciones y mobiliario puede tardar 18-24 meses en recuperarse antes de generar utilidad neta.",
        en: "The upfront investment in fit-out and furniture can take 18-24 months to recover before generating net profit.",
      },
    },
  ],

  buyRent: [
    {
      level: "high",
      label:       { es: "Impago y desalojo",   en: "Default and eviction" },
      description: {
        es: "El proceso legal de cobro y desalojo en Colombia puede tomar 6-18 meses, periodo en que el inmueble genera costos sin ingresos.",
        en: "Legal collection and eviction in Colombia can take 6-18 months, during which the property generates costs with no income.",
      },
    },
    {
      level: "medium",
      label:       { es: "Vacancia entre contratos",   en: "Vacancy between leases" },
      description: {
        es: "Periodos de 1-3 meses sin arrendatario entre contratos son comunes e impactan la rentabilidad anual de forma directa.",
        en: "Gaps of 1-3 months without a tenant between leases are common and directly impact annual yield.",
      },
    },
    {
      level: "medium",
      label:       { es: "Iliquidez del capital",   en: "Capital illiquidity" },
      description: {
        es: "El capital queda inmovilizado en el activo; una venta urgente puede forzar un descuento del 5-15% sobre el valor justo de mercado.",
        en: "Capital is tied up in the asset; an urgent sale can force a 5-15% discount below fair market value.",
      },
    },
    {
      level: "medium",
      label:       { es: "Rentabilidad vs. inflación",   en: "Yield vs. inflation" },
      description: {
        es: "El incremento anual del canon está limitado al IPC por ley, lo que puede erosionar el rendimiento real en periodos de alta inflación.",
        en: "Annual rent increases are capped at CPI by law, which can erode real returns during high-inflation periods.",
      },
    },
    {
      level: "low",
      label:       { es: "Mantenimiento ordinario",   en: "Ongoing maintenance" },
      description: {
        es: "El deterioro del inmueble a lo largo del tiempo reduce el flujo neto si los costos de mantenimiento no se presupuestan correctamente.",
        en: "Property deterioration over time reduces net cash flow if maintenance costs are not properly budgeted.",
      },
    },
  ],
};

// ─── Engine helpers ────────────────────────────────────────────────────────

function mvAt(area: number, avgPricePerM2: number, annualRate: number, month: number): number {
  return area * avgPricePerM2 * Math.pow(1 + annualRate / 12, month);
}

/**
 * Cumulative carrying cost over [1..month] for capital-gain models.
 * Uses closed-form geometric series: Σ(m=1..T) V0*(1+r)^m * c
 *   = V0 * c * (1+r) * ((1+r)^T - 1) / r
 */
function cumulativeCarryingCost(
  area: number,
  avgPricePerM2: number,
  annualRate: number,
  month: number,
): number {
  const r = annualRate / 12;
  const V0 = area * avgPricePerM2;
  return V0 * MONTHLY_CARRYING_RATE * (1 + r) * (Math.pow(1 + r, month) - 1) / r;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function computeModelSummary(model: BusinessModel, input: PropertyInput): ModelSummary {
  const market = getMarketData(input.neighborhood);
  const buyerCosts     = input.price * BUYER_COST_RATE;
  const totalAcquisition = input.price + buyerCosts;
  const marketRefValue = input.area * market.avgPricePerM2;

  switch (model) {
    case "flipping": {
      const renovationCost = input.area * RENOVATION_COST_PER_M2;
      return { totalInvested: totalAcquisition + renovationCost, monthlyIncome: 0, renovationCost, marketRefValue };
    }
    case "buySell": {
      return { totalInvested: totalAcquisition, monthlyIncome: 0, renovationCost: 0, marketRefValue };
    }
    case "coliving": {
      const numRooms   = Math.max(2, Math.floor(input.area / COLIVING_M2_PER_ROOM));
      const setupCost  = numRooms * COLIVING_SETUP_COST_PER_ROOM;
      const monthlyNet = input.area * market.avgRentPerM2 * COLIVING_RENT_PREMIUM * (1 - COLIVING_EXPENSE_RATE);
      return { totalInvested: totalAcquisition + setupCost, monthlyIncome: monthlyNet, renovationCost: setupCost, marketRefValue };
    }
    case "buyRent": {
      const monthlyNet = input.area * market.avgRentPerM2 * (1 - RENT_EXPENSE_RATE);
      return { totalInvested: totalAcquisition, monthlyIncome: monthlyNet, renovationCost: 0, marketRefValue };
    }
  }
}

/**
 * Returns profit/ROI series from month 6 to maxMonths.
 *
 * "Profit at month T" = net exit proceeds + cumulative cash flows − total invested.
 * This lets all models be compared on equal terms: what do you walk away with
 * if you liquidate at month T?
 *
 * Capital-gain models (flipping, buySell) include cumulative carrying costs
 * (predial + maintenance, ~1.2% EA) so their ROI deteriorates if exit is delayed.
 * Income models (coliving, buyRent) use a conservative 3.5% annual appreciation.
 */
export function computeTimeline(
  model: BusinessModel,
  input: PropertyInput,
  maxMonths?: number,
): TimelinePoint[] {
  maxMonths = maxMonths ?? getModelMaxMonths(model);
  const market  = getMarketData(input.neighborhood);
  const summary = computeModelSummary(model, input);
  const points: TimelinePoint[] = [];

  for (let month = MIN_MONTHS; month <= maxMonths; month++) {
    let profit = 0;

    switch (model) {
      case "flipping": {
        // Renovation premium decays 8% → 0% from month 3 to month 24
        const premiumAge = Math.max(0, month - RENOVATION_MONTHS);
        const premium    = FLIPPING_SALE_PREMIUM_START * Math.max(0, 1 - premiumAge / FLIPPING_PREMIUM_DECAY_MONTHS);
        // Staleness discount: buyer interest fades the longer the property sits post-reno
        const stale = Math.min(STALE_CAP, Math.max(0, (month - FLIPPING_STALE_START) * STALE_RATE_PER_MONTH));
        const mv    = mvAt(input.area, market.avgPricePerM2, CAPITAL_APPRECIATION, month);
        const exit  = mv * (1 + premium) * (1 - stale) * (1 - SELLER_COST_RATE);
        const carry = cumulativeCarryingCost(input.area, market.avgPricePerM2, CAPITAL_APPRECIATION, month);
        profit = exit - summary.totalInvested - carry;
        break;
      }
      case "buySell": {
        // Staleness is faster — no renovation to justify a delayed premium
        const stale = Math.min(STALE_CAP, Math.max(0, (month - BUY_SELL_STALE_START) * STALE_RATE_PER_MONTH));
        const mv    = mvAt(input.area, market.avgPricePerM2, CAPITAL_APPRECIATION, month);
        const exit  = mv * (1 - stale) * (1 - SELLER_COST_RATE);
        const carry = cumulativeCarryingCost(input.area, market.avgPricePerM2, CAPITAL_APPRECIATION, month);
        profit = exit - summary.totalInvested - carry;
        break;
      }
      case "coliving": {
        const activeMonths  = Math.max(0, month - COLIVING_SETUP_MONTHS);
        const rentalIncome  = activeMonths * summary.monthlyIncome;
        const mv   = mvAt(input.area, market.avgPricePerM2, INCOME_APPRECIATION, month);
        const exit = mv * (1 - SELLER_COST_RATE);
        profit = exit + rentalIncome - summary.totalInvested;
        break;
      }
      case "buyRent": {
        const rentalIncome = month * summary.monthlyIncome;
        const mv   = mvAt(input.area, market.avgPricePerM2, INCOME_APPRECIATION, month);
        const exit = mv * (1 - SELLER_COST_RATE);
        profit = exit + rentalIncome - summary.totalInvested;
        break;
      }
    }

    points.push({ month, profit, roiPct: (profit / summary.totalInvested) * 100 });
  }

  return points;
}

export const MIN_MONTHS = 6;
export const MAX_MONTHS = 120;

/** Capital-gain models cap at 24 months — beyond that the risk of loss dominates. */
export const CAPITAL_GAIN_MAX_MONTHS = 24;

export function getModelMaxMonths(model: BusinessModel): number {
  return model === "flipping" || model === "buySell" ? CAPITAL_GAIN_MAX_MONTHS : MAX_MONTHS;
}

/**
 * Benchmark: same capital in a Colombian high-yield savings account / CDT.
 * ~10.5% EA — representative of Nubank Cajita, Lulo Cuenta, and competitive
 * CDTs in 2026 with BanRep rates stabilised around 8.5-9%.
 */
export const BENCHMARK_ANNUAL_RATE = 0.105;

export function computeBenchmarkTimeline(
  totalInvested: number,
  maxMonths = MAX_MONTHS,
): TimelinePoint[] {
  const r = Math.pow(1 + BENCHMARK_ANNUAL_RATE, 1 / 12) - 1;
  const points: TimelinePoint[] = [];
  for (let month = MIN_MONTHS; month <= maxMonths; month++) {
    const profit = totalInvested * (Math.pow(1 + r, month) - 1);
    points.push({ month, profit, roiPct: (profit / totalInvested) * 100 });
  }
  return points;
}
