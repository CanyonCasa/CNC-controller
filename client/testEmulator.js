/*
Machine Report...
  GC: G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0
  G54: -68.000,-116.000,-47.600
  G55: 0.000,0.000,0.000
  G56: 0.000,0.000,0.000
  G57: 0.000,0.000,0.000
  G58: 0.000,0.000,0.000
  G59: 0.000,0.000,0.000
  G28: -298.000,-299.000,-1.000
  G30: -68.000,-116.000,-47.600
  G92: 0.000,0.000,0.000
  PRB: 0.000,0.000,0.000
  VER: 1.1f.20170131
  OPT: V,15,128
  $N0: 
  $N1: 
  $0: 10
  $1: 255
  $2: 0
  $3: 1
  $4: 0
  $5: 0
  $6: 0
  $10: 3
  $11: 0.010
  $12: 0.002
  $13: 0
  $20: 0
  $21: 1
  $22: 1
  $23: 3
  $24: 25.000
  $25: 500.000
  $26: 250
  $27: 1.000
  $30: 10000
  $31: 0
  $32: 0
  $100: 800.000
  $101: 800.000
  $102: 800.000
  $110: 2000.000
  $111: 2000.000
  $112: 1600.000
  $120: 150.000
  $121: 150.000
  $122: 150.000
  $130: 300.000
  $131: 300.000
  $132: 75.000
...End of Report
*/

const Anolex = { // machine defaults...
    acceleration: {X: 150, Y: 150, Z: 150}, // mm/s^2 (not presently used)
    fudge: 61/60,                           // optional fudge factor adds ~1s/min
    homing: 500,                            // mm/min (not presently used)
    idleDelay: 255,                         // ms (not presently used)
    origin: {X: -298, Y: -299, Z: -1},      // (not presently used)
    maxFeed: 2000,                          // mm/min (required)
    maxSpeed: 10000,                        // rpm (not presently used)
    maxTravel: {X: 300, Y: 300, Z: 75},     // mm (not presently used)
    positioning: 'absolute',                // (presently only supports absolute)
    units: 'mm'                             // default units
};

const fs = require('fs');
const CNCEmulator = require('./cncEmulator');
const cnc = new CNCEmulator(Anolex);
const file = process.argv[2] || './nc/simple test.nc';
const nc = fs.readFileSync(file,'utf-8');
const lines = nc.split(/\r?\n/);

console.log(`${file}: ${nc.length} bytes, lines: ${lines.length}`);
let estimate = cnc.processGCODE(lines);
console.log(`gcode:${cnc.gcodeData.length}`);
console.log(`runtime: ${estimate}`);
//console.log(cnc.prepViewData())
cnc.prepViewData()