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
  unitRepo,
  userRepo,
} from "../repository";
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

  logger.info("Seed complete.");
  await closeDatabaseConnection();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`Seed failed: ${err}`);
    process.exit(1);
  });
