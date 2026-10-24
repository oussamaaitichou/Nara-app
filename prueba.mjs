import { readFileSync } from "node:fs";
import { importarCSV, numero, fecha } from "./importar.ts";
import { analizar, PARAMETROS_POR_DEFECTO } from "./calculo.ts";

let fallos = 0;
const igual = (nombre, a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { fallos++; console.log("FALLA", nombre, "→", a, "esperado", b); } else console.log("ok   ", nombre);
};

// Utilidades de importación
igual("numero 1.234,56", numero("1.234,56"), 1234.56);
igual("numero 1,234.56", numero("1,234.56"), 1234.56);
igual("numero 12,5", numero("12,5"), 12.5);
igual("numero texto", numero("abc"), null);
igual("fecha MM/AAAA", fecha("02/2028"), "2028-02-29");
igual("fecha DD/MM/AAAA", fecha("5/3/2027"), "2027-03-05");
igual("fecha ISO", fecha("2027-03-05"), "2027-03-05");
igual("fecha rara", fecha("mañana"), null);

// Importación del ejemplo
const imp = importarCSV(readFileSync(new URL("./ejemplo.csv", import.meta.url), "utf8"));
igual("sin errores de importación", imp.errores, []);
igual("12 productos", imp.productos.length, 12);

// Falta una columna obligatoria
const roto = importarCSV("Código;Descripción;Stock\nA;B;3");
igual("columna obligatoria ausente da error", roto.productos.length === 0 && roto.errores.length === 1, true);

// Análisis
const r = analizar(imp.productos, { ...PARAMETROS_POR_DEFECTO, diasPeriodo: 90, hoy: "2026-10-06" });
const por = Object.fromEntries(r.filas.map((f) => [f.codigo, f]));

igual("DEMO004 sin ventas y con stock = sin_salida", por.DEMO004.estado, "sin_salida");
igual("DEMO009 sin ventas ni stock", por.DEMO009.estado, "sin_stock_sin_ventas");
igual("DEMO003 sobrestock (96 uds, 12 vendidas en 90 d)", por.DEMO003.estado, "sobrestock");
igual("DEMO007 sobrestock", por.DEMO007.estado, "sobrestock");
igual("DEMO001 ok", por.DEMO001.estado, "ok");
// DEMO006: 240/90=2.67 ud/día, stock 10 -> cobertura 3.75 d < 1+3 => riesgo rotura
igual("DEMO006 riesgo de rotura", por.DEMO006.estado, "riesgo_rotura");
// pedido DEMO006: objetivo = 2.667*(1+7+3)=29.33; stock 10 -> ceil(19.33)=20
igual("DEMO006 pedido sugerido 20", por.DEMO006.pedidoSugerido, 20);
igual("sobrestock no genera pedido", por.DEMO003.pedidoSugerido, 0);
// Caducidad DEMO003: caduca 30/11/2026 = 55 días; ventas 12/90=0.1333/d -> vende 7.33; stock 96 -> riesgo ceil(88.67)=89
igual("DEMO003 días para caducar", por.DEMO003.diasParaCaducar, 55);
igual("DEMO003 unidades en riesgo de caducidad", por.DEMO003.unidadesEnRiesgoCaducidad, 89);
igual("DEMO003 valor en riesgo", Math.round(por.DEMO003.valorEnRiesgoCaducidad * 100) / 100, 872.2);
// DEMO007 caduca 31/12/2026 = 86 días; 60/90 = .6667/d -> vende 57.3; stock 220 -> 163
igual("DEMO007 unidades en riesgo de caducidad", por.DEMO007.unidadesEnRiesgoCaducidad, 163);
// DEMO002 caduca 03/2027 = 176 días > aviso 120 -> sin riesgo calculado
igual("DEMO002 fuera del aviso de caducidad", por.DEMO002.unidadesEnRiesgoCaducidad, 0);

// Resumen
igual("valor stock parado = DEMO004", Math.round(r.resumen.valorStockParado * 100) / 100, 403.2);
igual("hay al menos un aviso o ninguno (array)", Array.isArray(r.avisos), true);
const sumaClases = r.resumen.porClase.A + r.resumen.porClase.B + r.resumen.porClase.C;
igual("ABC cubre todos los productos", sumaClases, 12);

console.log("\nResumen:", JSON.stringify(r.resumen, null, 1));
console.log(fallos ? `\n${fallos} PRUEBA(S) FALLAN` : "\nTodas las pruebas pasan");
process.exit(fallos ? 1 : 0);
