/**
 * Seed the Material Master master tables (FRD §3–6) + demo role users.
 *
 * Idempotent: skips any record whose unique code/email already exists, so it is
 * safe to re-run. Values mirror the frontend mock pools so the API contract and
 * the UI line up out of the box.
 *
 *   npm run seed
 */
import bcrypt from "bcryptjs";
import { uuidv7 } from "uuidv7";
import { connectToDatabase, closeDatabaseConnection } from "../db/db-connection";
import {
  gradeRepo,
  majorSpecRepo,
  materialCategoryRepo,
  subtypeRepo,
  supplierRepo,
  unitRepo,
  userRepo,
  warehouseRepo,
} from "../repository";
import type { WarehouseType } from "../db/schema";
import type { SupplierStatus } from "../db/schema";
import type { Role } from "../db/schema";
import { logger } from "../util";

// ── 14 categories (TT) with their subtypes (SS) and default UoM ──────────────
const CATEGORIES: {
  name: string;
  type: string;
  uom: string;
  subtypes: { name: string; code: string }[];
}[] = [
  { name: "Mechanical Bought-out", type: "MB", uom: "Nos", subtypes: [
    { name: "Valve", code: "VA" }, { name: "Pump", code: "PU" }, { name: "Gearbox", code: "GB" },
    { name: "Bearing", code: "BR" }, { name: "Coupling", code: "CP" }, { name: "Motor", code: "MO" },
    { name: "Blower", code: "BL" }, { name: "Compressor", code: "CM" } ] },
  { name: "Mechanical Fabricated", type: "MF", uom: "Nos", subtypes: [
    { name: "Pressure Vessel", code: "VS" }, { name: "Storage Tank", code: "TK" }, { name: "Skid", code: "SK" },
    { name: "Frame", code: "FR" }, { name: "Bracket", code: "BK" }, { name: "Hopper", code: "HP" },
    { name: "Chute", code: "CH" }, { name: "Platform", code: "PL" } ] },
  { name: "Piping", type: "PP", uom: "Mtr", subtypes: [
    { name: "Pipe", code: "PI" }, { name: "Tube", code: "TU" }, { name: "Header", code: "HD" }, { name: "Spool", code: "SP" } ] },
  { name: "Pipe Fittings", type: "PF", uom: "Nos", subtypes: [
    { name: "Elbow", code: "EL" }, { name: "Tee", code: "TE" }, { name: "Flange", code: "FL" },
    { name: "Reducer", code: "RD" }, { name: "Coupling", code: "CO" }, { name: "Union", code: "UN" },
    { name: "Cap", code: "CA" }, { name: "Nipple", code: "NP" } ] },
  { name: "Structural Materials", type: "ST", uom: "Mtr", subtypes: [
    { name: "Beam", code: "BM" }, { name: "Channel", code: "CN" }, { name: "Angle", code: "AN" },
    { name: "Plate", code: "PT" }, { name: "Grating", code: "GR" }, { name: "Ladder", code: "LD" } ] },
  { name: "Process Equipment", type: "PE", uom: "Nos", subtypes: [
    { name: "Heat Exchanger", code: "HE" }, { name: "Filter", code: "FT" }, { name: "Reactor", code: "RX" },
    { name: "Centrifuge", code: "CF" }, { name: "Dryer", code: "DR" }, { name: "Mixer", code: "MX" },
    { name: "Column", code: "CL" } ] },
  { name: "Field Instruments", type: "FI", uom: "Nos", subtypes: [
    { name: "Transmitter", code: "TR" }, { name: "Gauge", code: "GA" }, { name: "Switch", code: "SW" },
    { name: "Sensor", code: "SN" }, { name: "Flowmeter", code: "FM" }, { name: "Level Element", code: "LV" } ] },
  { name: "Panel Instruments", type: "PN", uom: "Nos", subtypes: [
    { name: "Controller", code: "CT" }, { name: "Indicator", code: "ID" }, { name: "Recorder", code: "RC" },
    { name: "PLC Module", code: "PC" }, { name: "HMI", code: "HM" } ] },
  { name: "Instrument Accessories", type: "IA", uom: "Nos", subtypes: [
    { name: "Manifold", code: "MN" }, { name: "Impulse Tube", code: "TB" }, { name: "Fitting", code: "FG" },
    { name: "Impulse Line", code: "IL" }, { name: "Mounting Bracket", code: "MK" } ] },
  { name: "Electrical", type: "EL", uom: "Nos", subtypes: [
    { name: "Cable", code: "CB" }, { name: "Motor", code: "MT" }, { name: "Breaker", code: "BK" },
    { name: "Panel", code: "PN" }, { name: "Transformer", code: "TF" }, { name: "Light Fitting", code: "LT" },
    { name: "Junction Box", code: "JB" } ] },
  { name: "Reagents", type: "RG", uom: "Ltr", subtypes: [
    { name: "Acid", code: "AC" }, { name: "Base", code: "BS" }, { name: "Solvent", code: "SV" },
    { name: "Buffer", code: "BF" }, { name: "Culture Media", code: "MD" }, { name: "Catalyst", code: "CT" } ] },
  { name: "Packings & Fillings", type: "PK", uom: "Nos", subtypes: [
    { name: "Gasket", code: "GK" }, { name: "Gland Packing", code: "GP" }, { name: "Mechanical Seal", code: "SL" },
    { name: "O-Ring", code: "OR" }, { name: "Tower Filler", code: "TW" } ] },
  { name: "Elastomers", type: "EM", uom: "Nos", subtypes: [
    { name: "Rubber", code: "RB" }, { name: "Silicone", code: "SI" }, { name: "Viton (FKM)", code: "VT" },
    { name: "EPDM", code: "EP" }, { name: "Nitrile (NBR)", code: "NT" } ] },
  { name: "Consumables", type: "CN", uom: "Nos", subtypes: [
    { name: "Bolt", code: "BO" }, { name: "Nut", code: "NU" }, { name: "Washer", code: "WA" },
    { name: "Welding Rod", code: "WR" }, { name: "PTFE Tape", code: "TP" }, { name: "Lubricant", code: "LB" } ] },
];

const MAJOR_SPECS: { code: string; label: string }[] = [
  { code: "00", label: "Not Applicable" },
  { code: "08", label: "8 mm / NB" },
  { code: "10", label: "10 mm / NB" },
  { code: "15", label: "15 mm / NB" },
  { code: "20", label: "20 mm / NB" },
  { code: "25", label: "25 mm / NB" },
  { code: "40", label: "40 mm / NB" },
  { code: "50", label: "50 mm / NB" },
  { code: "65", label: "65 mm / NB" },
  { code: "80", label: "80 mm / NB" },
];

const GRADES: { code: string; label: string }[] = [
  { code: "0000", label: "Standard / Unspecified" },
  { code: "3040", label: "SS 304" },
  { code: "3160", label: "SS 316" },
  { code: "316L", label: "SS 316L" },
  { code: "CS10", label: "Carbon Steel" },
  { code: "DUPX", label: "Duplex 2205" },
  { code: "PTFE", label: "PTFE Lined" },
  { code: "PP00", label: "Polypropylene" },
  { code: "PVDF", label: "PVDF" },
  { code: "HAST", label: "Hastelloy C276" },
  { code: "TI00", label: "Titanium Gr2" },
  { code: "BRSS", label: "Brass" },
  { code: "GIPV", label: "GI / Galvanised" },
];

const UNITS: { code: string; name: string }[] = [
  { code: "Nos", name: "Numbers" },
  { code: "Mtr", name: "Metre" },
  { code: "Ltr", name: "Litre" },
  { code: "Kg", name: "Kilogram" },
  { code: "Set", name: "Set" },
  { code: "Sqm", name: "Square Metre" },
  { code: "Box", name: "Box" },
  { code: "Roll", name: "Roll" },
];

// Demo role users (mirror the frontend src/auth/credentials.ts).
const USERS: {
  name: string; email: string; password: string; role: Role; team: string; initials: string; hue: number;
}[] = [
  { name: "Priya Nair", email: "admin@innopolis.bio", password: "admin123", role: "Administrator", team: "Admin", initials: "PN", hue: 280 },
  { name: "Elena Vasquez", email: "engineer@innopolis.bio", password: "engineer123", role: "Engineering", team: "Engineering", initials: "EV", hue: 172 },
  { name: "Omar Haddad", email: "commercial@innopolis.bio", password: "commercial123", role: "Commercial", team: "Commercial", initials: "OH", hue: 38 },
  { name: "James Park", email: "purchase@innopolis.bio", password: "purchase123", role: "Purchase", team: "Purchase", initials: "JP", hue: 210 },
  { name: "Raj Patel", email: "stores@innopolis.bio", password: "stores123", role: "Stores", team: "Stores", initials: "RP", hue: 152 },
  { name: "Hannah Berg", email: "management@innopolis.bio", password: "management123", role: "Management", team: "Management", initials: "HB", hue: 320 },
];

// Representative vendor master (FRD §7), mirroring the frontend supplier pool.
const VENDORS: {
  code: string; name: string; country: string; region: string; category: string;
  categories: string[]; tier: number; status: SupplierStatus; approved: boolean;
  contact: string; email: string; phone: string; gst_vat: string;
  payment_terms: string; lead_time_avg: number; rating: number;
  on_time_pct: number; quality_pct: number; risk_score: number;
}[] = [
  { code: "V-INOX", name: "Inox Valves Pvt Ltd", country: "India", region: "Domestic", category: "Mechanical Bought-out", categories: ["Mechanical Bought-out", "Pipe Fittings"], tier: 1, status: "Preferred", approved: true, contact: "S. Mehta", email: "sales@inoxvalves.in", phone: "+91 22 4012 8800", gst_vat: "27AABCI1234M1Z5", payment_terms: "30 days", lead_time_avg: 21, rating: 4.6, on_time_pct: 94.5, quality_pct: 97.2, risk_score: 18 },
  { code: "V-GRUND", name: "Grundfos Pumps India", country: "India", region: "Domestic", category: "Mechanical Bought-out", categories: ["Mechanical Bought-out"], tier: 1, status: "Approved", approved: true, contact: "R. Iyer", email: "orders@grundfos.in", phone: "+91 44 6677 1200", gst_vat: "33AAACG5678P1Z2", payment_terms: "45 days", lead_time_avg: 28, rating: 4.4, on_time_pct: 91.0, quality_pct: 96.0, risk_score: 22 },
  { code: "V-EH", name: "Endress+Hauser India", country: "India", region: "Domestic", category: "Field Instruments", categories: ["Field Instruments", "Panel Instruments"], tier: 1, status: "Preferred", approved: true, contact: "A. Kulkarni", email: "info@endress.in", phone: "+91 22 6694 1234", gst_vat: "27AAACE9012Q1Z8", payment_terms: "30 days", lead_time_avg: 35, rating: 4.7, on_time_pct: 95.5, quality_pct: 98.1, risk_score: 14 },
  { code: "V-JINDAL", name: "Jindal SAW", country: "India", region: "Domestic", category: "Piping", categories: ["Piping", "Structural Materials"], tier: 2, status: "Approved", approved: true, contact: "P. Singh", email: "sales@jindalsaw.com", phone: "+91 11 2618 0800", gst_vat: "07AAACJ3456R1Z4", payment_terms: "60 days", lead_time_avg: 18, rating: 4.1, on_time_pct: 88.0, quality_pct: 93.5, risk_score: 30 },
  { code: "V-ALFA", name: "Alfa Laval India", country: "India", region: "Domestic", category: "Process Equipment", categories: ["Process Equipment"], tier: 1, status: "Approved", approved: true, contact: "M. Desai", email: "process@alfalaval.in", phone: "+91 20 4071 7000", gst_vat: "27AAACA7890S1Z1", payment_terms: "45 days", lead_time_avg: 56, rating: 4.5, on_time_pct: 90.5, quality_pct: 97.8, risk_score: 20 },
  { code: "V-POLY", name: "Polycab Wires", country: "India", region: "Domestic", category: "Electrical", categories: ["Electrical"], tier: 2, status: "Approved", approved: true, contact: "K. Shah", email: "b2b@polycab.com", phone: "+91 22 6735 1400", gst_vat: "27AAACP2345T1Z7", payment_terms: "30 days", lead_time_avg: 12, rating: 4.2, on_time_pct: 92.0, quality_pct: 94.0, risk_score: 24 },
  { code: "V-MERCK", name: "Merck Life Science", country: "Germany", region: "Import", category: "Reagents", categories: ["Reagents"], tier: 1, status: "Preferred", approved: true, contact: "Dr. H. Klein", email: "lifescience@merck.com", phone: "+49 6151 720", gst_vat: "DE811138197", payment_terms: "Advance", lead_time_avg: 42, rating: 4.8, on_time_pct: 96.0, quality_pct: 99.0, risk_score: 12 },
  { code: "V-SWAGE", name: "Swagelok India", country: "India", region: "Domestic", category: "Instrument Accessories", categories: ["Instrument Accessories", "Pipe Fittings"], tier: 1, status: "Approved", approved: true, contact: "N. Rao", email: "sales@swagelok.in", phone: "+91 80 4123 5600", gst_vat: "29AAACS6789U1Z3", payment_terms: "30 days", lead_time_avg: 24, rating: 4.5, on_time_pct: 93.0, quality_pct: 97.0, risk_score: 17 },
  { code: "V-GARLK", name: "Garlock Sealing", country: "USA", region: "Import", category: "Packings & Fillings", categories: ["Packings & Fillings", "Elastomers"], tier: 2, status: "Conditional", approved: true, contact: "J. Reed", email: "intl@garlock.com", phone: "+1 800 448 6688", gst_vat: "US-EIN-160747", payment_terms: "Advance", lead_time_avg: 49, rating: 3.9, on_time_pct: 85.0, quality_pct: 95.0, risk_score: 38 },
  { code: "V-TATA", name: "Tata Structural Steel", country: "India", region: "Domestic", category: "Structural Materials", categories: ["Structural Materials"], tier: 2, status: "Approved", approved: true, contact: "B. Kumar", email: "structurals@tatasteel.com", phone: "+91 657 664 5000", gst_vat: "20AAACT1234V1Z9", payment_terms: "45 days", lead_time_avg: 20, rating: 4.0, on_time_pct: 87.5, quality_pct: 92.0, risk_score: 28 },
  { code: "V-HIMED", name: "HiMedia Labs", country: "India", region: "Domestic", category: "Reagents", categories: ["Reagents", "Consumables"], tier: 3, status: "Under Review", approved: false, contact: "S. Joshi", email: "sales@himedialabs.com", phone: "+91 22 6147 1919", gst_vat: "27AAACH5678W1Z6", payment_terms: "Advance", lead_time_avg: 10, rating: 3.6, on_time_pct: 82.0, quality_pct: 90.0, risk_score: 45 },
  { code: "V-LKVAL", name: "L&T Valves", country: "India", region: "Domestic", category: "Mechanical Bought-out", categories: ["Mechanical Bought-out", "Pipe Fittings"], tier: 1, status: "Approved", approved: true, contact: "G. Nair", email: "valves@lntvalves.com", phone: "+91 44 2249 2900", gst_vat: "33AAACL9012X1Z0", payment_terms: "30 days", lead_time_avg: 26, rating: 4.3, on_time_pct: 90.0, quality_pct: 95.5, risk_score: 23 },
];

const WAREHOUSES: {
  code: string; name: string; type: WarehouseType; city: string; country: string; capacity: number;
}[] = [
  { code: "WH-PUN", name: "Pune Central Store", type: "Distribution", city: "Pune", country: "India", capacity: 62 },
  { code: "WH-FAB", name: "Fabrication Shop Store", type: "Manufacturing", city: "Pune", country: "India", capacity: 48 },
  { code: "WH-MUM", name: "Mumbai Buffer Store", type: "Buffer", city: "Mumbai", country: "India", capacity: 35 },
  { code: "WH-TRN", name: "Goods-in Transit", type: "Transit", city: "Pune", country: "India", capacity: 12 },
];

async function seed() {
  await connectToDatabase();

  // Users
  for (const u of USERS) {
    if (await userRepo.findByEmail(u.email)) continue;
    await userRepo.create({
      id: uuidv7(),
      name: u.name,
      email: u.email,
      password_hash: await bcrypt.hash(u.password, 10),
      role: u.role,
      team: u.team,
      initials: u.initials,
      hue: u.hue,
      is_active: true,
    });
    logger.info(`Seeded user ${u.email} (${u.role})`);
  }

  // Categories + subtypes
  for (const c of CATEGORIES) {
    let category = await materialCategoryRepo.findByTypeCode(c.type);
    if (!category) {
      category = await materialCategoryRepo.create({
        id: uuidv7(),
        name: c.name,
        type_code: c.type,
        default_uom: c.uom,
        is_active: true,
      });
      logger.info(`Seeded category ${c.type} — ${c.name}`);
    }
    if (!category) continue;

    for (const s of c.subtypes) {
      if (await subtypeRepo.findByCategoryAndCode(category.id, s.code)) continue;
      await subtypeRepo.create({
        id: uuidv7(),
        category_id: category.id,
        name: s.name,
        code: s.code,
        is_active: true,
      });
    }
  }

  // Major specs
  for (const m of MAJOR_SPECS) {
    if (await majorSpecRepo.findByCode(m.code)) continue;
    await majorSpecRepo.create({ id: uuidv7(), code: m.code, label: m.label, is_active: true });
  }

  // Grades
  for (const g of GRADES) {
    if (await gradeRepo.findByCode(g.code)) continue;
    await gradeRepo.create({ id: uuidv7(), code: g.code, label: g.label, is_active: true });
  }

  // Units
  for (const u of UNITS) {
    if (await unitRepo.findByCode(u.code)) continue;
    await unitRepo.create({ id: uuidv7(), code: u.code, name: u.name, is_active: true });
  }

  // Vendors (FRD §7)
  for (const v of VENDORS) {
    if (await supplierRepo.findByCode(v.code)) continue;
    await supplierRepo.create({
      id: uuidv7(),
      code: v.code,
      name: v.name,
      country: v.country,
      region: v.region,
      category: v.category,
      categories_supplied: v.categories,
      tier: v.tier,
      contact: v.contact,
      email: v.email,
      phone: v.phone,
      gst_vat: v.gst_vat,
      payment_terms: v.payment_terms,
      lead_time_avg: v.lead_time_avg,
      rating: v.rating.toString(),
      on_time_pct: v.on_time_pct.toString(),
      quality_pct: v.quality_pct.toString(),
      risk_score: v.risk_score.toString(),
      status: v.status,
      approved: v.approved,
    });
    logger.info(`Seeded vendor ${v.code} — ${v.name}`);
  }

  // Warehouses (FRD §14)
  for (const w of WAREHOUSES) {
    if (await warehouseRepo.findByCode(w.code)) continue;
    await warehouseRepo.create({
      id: uuidv7(),
      code: w.code,
      name: w.name,
      type: w.type,
      city: w.city,
      country: w.country,
      capacity_pct: w.capacity.toString(),
    });
    logger.info(`Seeded warehouse ${w.code} — ${w.name}`);
  }

  logger.info("Seed complete.");
  await closeDatabaseConnection();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`Seed failed: ${err}`);
    process.exit(1);
  });
