-- ============================================================================
--  Innopolis BOM / PLM  —  Master-data seed (manual / pgAdmin)
--  Mirrors src/scripts/seed-masters.ts (FRD §3–6 + demo users/vendors/warehouses).
--
--  HOW TO USE
--    Run the whole file once against your database in pgAdmin (or psql).
--    It is IDEMPOTENT — every insert is guarded, so re-running is safe and
--    will only add rows that are missing.
--
--  REQUIRES the pgcrypto extension (for gen_random_uuid + bcrypt password
--  hashing via crypt/gen_salt). The first statement enables it.
--  If your role cannot CREATE EXTENSION, ask a superuser to run it once,
--  or seed users with `npm run seed` instead and run the rest of this file.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ── 1. Demo role users (FRD §17) ────────────────────────────────────────────
--  Passwords are bcrypt-hashed (cost 10) — compatible with bcryptjs in the app.
--  Login = email / password shown in the pwd column.
INSERT INTO users (id, name, email, password_hash, role, team, initials, hue, is_active)
SELECT gen_random_uuid(), v.name, v.email,
       crypt(v.pwd, gen_salt('bf', 10)),
       v.role::user_role, v.team, v.initials, v.hue::smallint, true
FROM (VALUES
  ('Priya Nair',    'admin@innopolis.bio',       'admin123',      'Administrator', 'Admin',       'PN', 280),
  ('Elena Vasquez', 'engineer@innopolis.bio',    'engineer123',   'Engineering',   'Engineering', 'EV', 172),
  ('Omar Haddad',   'commercial@innopolis.bio',  'commercial123', 'Commercial',    'Commercial',  'OH', 38),
  ('James Park',    'purchase@innopolis.bio',    'purchase123',   'Purchase',      'Purchase',    'JP', 210),
  ('Raj Patel',     'stores@innopolis.bio',      'stores123',     'Stores',        'Stores',      'RP', 152),
  ('Hannah Berg',   'management@innopolis.bio',  'management123', 'Management',    'Management',  'HB', 320)
) AS v(name, email, pwd, role, team, initials, hue)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = v.email);

-- ── 2. Material Categories — 14 types (FRD §3–4, code TT) ────────────────────
INSERT INTO material_categories (id, name, type_code, default_uom)
SELECT gen_random_uuid(), v.name, v.type_code, v.uom
FROM (VALUES
  ('Mechanical Bought-out',  'MB', 'Nos'),
  ('Mechanical Fabricated',  'MF', 'Nos'),
  ('Piping',                 'PP', 'Mtr'),
  ('Pipe Fittings',          'PF', 'Nos'),
  ('Structural Materials',   'ST', 'Mtr'),
  ('Process Equipment',      'PE', 'Nos'),
  ('Field Instruments',      'FI', 'Nos'),
  ('Panel Instruments',      'PN', 'Nos'),
  ('Instrument Accessories', 'IA', 'Nos'),
  ('Electrical',             'EL', 'Nos'),
  ('Reagents',               'RG', 'Ltr'),
  ('Packings & Fillings',    'PK', 'Nos'),
  ('Elastomers',             'EM', 'Nos'),
  ('Consumables',            'CN', 'Nos')
) AS v(name, type_code, uom)
WHERE NOT EXISTS (SELECT 1 FROM material_categories mc WHERE mc.type_code = v.type_code);

-- ── 3. Subtypes — per-category (FRD §4, code SS; e.g. MB-VA = Valve) ─────────
INSERT INTO subtypes (id, category_id, name, code)
SELECT gen_random_uuid(), mc.id, v.name, v.code
FROM (VALUES
  ('MB','Valve','VA'),('MB','Pump','PU'),('MB','Gearbox','GB'),('MB','Bearing','BR'),
  ('MB','Coupling','CP'),('MB','Motor','MO'),('MB','Blower','BL'),('MB','Compressor','CM'),
  ('MF','Pressure Vessel','VS'),('MF','Storage Tank','TK'),('MF','Skid','SK'),('MF','Frame','FR'),
  ('MF','Bracket','BK'),('MF','Hopper','HP'),('MF','Chute','CH'),('MF','Platform','PL'),
  ('PP','Pipe','PI'),('PP','Tube','TU'),('PP','Header','HD'),('PP','Spool','SP'),
  ('PF','Elbow','EL'),('PF','Tee','TE'),('PF','Flange','FL'),('PF','Reducer','RD'),
  ('PF','Coupling','CO'),('PF','Union','UN'),('PF','Cap','CA'),('PF','Nipple','NP'),
  ('ST','Beam','BM'),('ST','Channel','CN'),('ST','Angle','AN'),('ST','Plate','PT'),
  ('ST','Grating','GR'),('ST','Ladder','LD'),
  ('PE','Heat Exchanger','HE'),('PE','Filter','FT'),('PE','Reactor','RX'),('PE','Centrifuge','CF'),
  ('PE','Dryer','DR'),('PE','Mixer','MX'),('PE','Column','CL'),
  ('FI','Transmitter','TR'),('FI','Gauge','GA'),('FI','Switch','SW'),('FI','Sensor','SN'),
  ('FI','Flowmeter','FM'),('FI','Level Element','LV'),
  ('PN','Controller','CT'),('PN','Indicator','ID'),('PN','Recorder','RC'),('PN','PLC Module','PC'),
  ('PN','HMI','HM'),
  ('IA','Manifold','MN'),('IA','Impulse Tube','TB'),('IA','Fitting','FG'),('IA','Impulse Line','IL'),
  ('IA','Mounting Bracket','MK'),
  ('EL','Cable','CB'),('EL','Motor','MT'),('EL','Breaker','BK'),('EL','Panel','PN'),
  ('EL','Transformer','TF'),('EL','Light Fitting','LT'),('EL','Junction Box','JB'),
  ('RG','Acid','AC'),('RG','Base','BS'),('RG','Solvent','SV'),('RG','Buffer','BF'),
  ('RG','Culture Media','MD'),('RG','Catalyst','CT'),
  ('PK','Gasket','GK'),('PK','Gland Packing','GP'),('PK','Mechanical Seal','SL'),('PK','O-Ring','OR'),
  ('PK','Tower Filler','TW'),
  ('EM','Rubber','RB'),('EM','Silicone','SI'),('EM','Viton (FKM)','VT'),('EM','EPDM','EP'),
  ('EM','Nitrile (NBR)','NT'),
  ('CN','Bolt','BO'),('CN','Nut','NU'),('CN','Washer','WA'),('CN','Welding Rod','WR'),
  ('CN','PTFE Tape','TP'),('CN','Lubricant','LB')
) AS v(type_code, name, code)
JOIN material_categories mc ON mc.type_code = v.type_code
WHERE NOT EXISTS (
  SELECT 1 FROM subtypes s WHERE s.category_id = mc.id AND s.code = v.code
);

-- ── 4. Major Specs (FRD §4, code MM — major specification / size) ────────────
INSERT INTO major_specs (id, code, label)
SELECT gen_random_uuid(), v.code, v.label
FROM (VALUES
  ('00','Not Applicable'),
  ('08','8 mm / NB'),
  ('10','10 mm / NB'),
  ('15','15 mm / NB'),
  ('20','20 mm / NB'),
  ('25','25 mm / NB'),
  ('40','40 mm / NB'),
  ('50','50 mm / NB'),
  ('65','65 mm / NB'),
  ('80','80 mm / NB')
) AS v(code, label)
WHERE NOT EXISTS (SELECT 1 FROM major_specs m WHERE m.code = v.code);

-- ── 5. Material Grades (FRD §4, code DDDD — detailed spec / grade) ───────────
INSERT INTO grades (id, code, label)
SELECT gen_random_uuid(), v.code, v.label
FROM (VALUES
  ('0000','Standard / Unspecified'),
  ('3040','SS 304'),
  ('3160','SS 316'),
  ('316L','SS 316L'),
  ('CS10','Carbon Steel'),
  ('DUPX','Duplex 2205'),
  ('PTFE','PTFE Lined'),
  ('PP00','Polypropylene'),
  ('PVDF','PVDF'),
  ('HAST','Hastelloy C276'),
  ('TI00','Titanium Gr2'),
  ('BRSS','Brass'),
  ('GIPV','GI / Galvanised')
) AS v(code, label)
WHERE NOT EXISTS (SELECT 1 FROM grades g WHERE g.code = v.code);

-- ── 6. Units of Measure (FRD §6 master table) ───────────────────────────────
INSERT INTO units (id, code, name)
SELECT gen_random_uuid(), v.code, v.name
FROM (VALUES
  ('Nos','Numbers'),
  ('Mtr','Metre'),
  ('Ltr','Litre'),
  ('Kg','Kilogram'),
  ('Set','Set'),
  ('Sqm','Square Metre'),
  ('Box','Box'),
  ('Roll','Roll')
) AS v(code, name)
WHERE NOT EXISTS (SELECT 1 FROM units u WHERE u.code = v.code);

-- ── 6b. Resource Spec master (FRD §6 master table) ──────────────────────────
INSERT INTO resource_specs (id, code, name, description)
SELECT gen_random_uuid(), v.code, v.name, v.description
FROM (VALUES
  ('RS-STD','Standard','Standard resource specification'),
  ('RS-HD','Heavy Duty','Heavy-duty rated resource specification'),
  ('RS-FG','Food Grade','Food-grade compliant resource specification'),
  ('RS-EXP','Explosion Proof','Explosion-proof / hazardous-area rated'),
  ('RS-CR','Corrosion Resistant','Corrosion-resistant resource specification'),
  ('RS-HT','High Temperature','High-temperature rated resource specification')
) AS v(code, name, description)
WHERE NOT EXISTS (SELECT 1 FROM resource_specs r WHERE r.code = v.code);

-- ── 7. Vendor Master (FRD §7) ───────────────────────────────────────────────
INSERT INTO suppliers (
  id, code, name, country, region, category, categories_supplied, tier,
  contact, email, phone, gst_vat, payment_terms, lead_time_avg,
  rating, on_time_pct, quality_pct, risk_score, status, approved
)
SELECT gen_random_uuid(), v.code, v.name, v.country, v.region, v.category,
       v.categories::jsonb, v.tier::smallint, v.contact, v.email, v.phone,
       v.gst_vat, v.payment_terms, v.lead_time_avg,
       v.rating::numeric, v.on_time_pct::numeric, v.quality_pct::numeric,
       v.risk_score::numeric, v.status::supplier_status, v.approved
FROM (VALUES
  ('V-INOX',  'Inox Valves Pvt Ltd',    'India',  'Domestic','Mechanical Bought-out', '["Mechanical Bought-out","Pipe Fittings"]',           1,'S. Mehta',    'sales@inoxvalves.in',      '+91 22 4012 8800','27AABCI1234M1Z5','30 days',21,4.6,94.5,97.2,18,'Preferred',   true),
  ('V-GRUND', 'Grundfos Pumps India',   'India',  'Domestic','Mechanical Bought-out', '["Mechanical Bought-out"]',                            1,'R. Iyer',     'orders@grundfos.in',       '+91 44 6677 1200','33AAACG5678P1Z2','45 days',28,4.4,91.0,96.0,22,'Approved',    true),
  ('V-EH',    'Endress+Hauser India',   'India',  'Domestic','Field Instruments',     '["Field Instruments","Panel Instruments"]',            1,'A. Kulkarni', 'info@endress.in',          '+91 22 6694 1234','27AAACE9012Q1Z8','30 days',35,4.7,95.5,98.1,14,'Preferred',   true),
  ('V-JINDAL','Jindal SAW',             'India',  'Domestic','Piping',                '["Piping","Structural Materials"]',                    2,'P. Singh',    'sales@jindalsaw.com',      '+91 11 2618 0800','07AAACJ3456R1Z4','60 days',18,4.1,88.0,93.5,30,'Approved',    true),
  ('V-ALFA',  'Alfa Laval India',       'India',  'Domestic','Process Equipment',     '["Process Equipment"]',                                1,'M. Desai',    'process@alfalaval.in',     '+91 20 4071 7000','27AAACA7890S1Z1','45 days',56,4.5,90.5,97.8,20,'Approved',    true),
  ('V-POLY',  'Polycab Wires',          'India',  'Domestic','Electrical',            '["Electrical"]',                                       2,'K. Shah',     'b2b@polycab.com',          '+91 22 6735 1400','27AAACP2345T1Z7','30 days',12,4.2,92.0,94.0,24,'Approved',    true),
  ('V-MERCK', 'Merck Life Science',     'Germany','Import',  'Reagents',              '["Reagents"]',                                         1,'Dr. H. Klein','lifescience@merck.com',    '+49 6151 720',    'DE811138197',    'Advance',42,4.8,96.0,99.0,12,'Preferred',   true),
  ('V-SWAGE', 'Swagelok India',         'India',  'Domestic','Instrument Accessories','["Instrument Accessories","Pipe Fittings"]',           1,'N. Rao',      'sales@swagelok.in',        '+91 80 4123 5600','29AAACS6789U1Z3','30 days',24,4.5,93.0,97.0,17,'Approved',    true),
  ('V-GARLK', 'Garlock Sealing',        'USA',    'Import',  'Packings & Fillings',   '["Packings & Fillings","Elastomers"]',                 2,'J. Reed',     'intl@garlock.com',         '+1 800 448 6688', 'US-EIN-160747',  'Advance',49,3.9,85.0,95.0,38,'Conditional', true),
  ('V-TATA',  'Tata Structural Steel',  'India',  'Domestic','Structural Materials',  '["Structural Materials"]',                             2,'B. Kumar',    'structurals@tatasteel.com','+91 657 664 5000','20AAACT1234V1Z9','45 days',20,4.0,87.5,92.0,28,'Approved',    true),
  ('V-HIMED', 'HiMedia Labs',           'India',  'Domestic','Reagents',              '["Reagents","Consumables"]',                           3,'S. Joshi',    'sales@himedialabs.com',    '+91 22 6147 1919','27AAACH5678W1Z6','Advance',10,3.6,82.0,90.0,45,'Under Review',false),
  ('V-LKVAL', 'L&T Valves',             'India',  'Domestic','Mechanical Bought-out', '["Mechanical Bought-out","Pipe Fittings"]',           1,'G. Nair',     'valves@lntvalves.com',     '+91 44 2249 2900','33AAACL9012X1Z0','30 days',26,4.3,90.0,95.5,23,'Approved',    true)
) AS v(code,name,country,region,category,categories,tier,contact,email,phone,gst_vat,payment_terms,lead_time_avg,rating,on_time_pct,quality_pct,risk_score,status,approved)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.code = v.code);

-- ── 8. Warehouses / Stock Locations (FRD §14) ───────────────────────────────
INSERT INTO warehouses (id, code, name, type, city, country, capacity_pct)
SELECT gen_random_uuid(), v.code, v.name, v.type::warehouse_type, v.city, v.country, v.capacity::numeric
FROM (VALUES
  ('WH-PUN','Pune Central Store',     'Distribution', 'Pune',  'India',62),
  ('WH-FAB','Fabrication Shop Store',  'Manufacturing','Pune',  'India',48),
  ('WH-MUM','Mumbai Buffer Store',     'Buffer',       'Mumbai','India',35),
  ('WH-TRN','Goods-in Transit',        'Transit',      'Pune',  'India',12)
) AS v(code, name, type, city, country, capacity)
WHERE NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.code = v.code);

COMMIT;

-- ── Quick verification ──────────────────────────────────────────────────────
-- SELECT 'users' t, count(*) FROM users
-- UNION ALL SELECT 'material_categories', count(*) FROM material_categories
-- UNION ALL SELECT 'subtypes',            count(*) FROM subtypes
-- UNION ALL SELECT 'major_specs',         count(*) FROM major_specs
-- UNION ALL SELECT 'grades',              count(*) FROM grades
-- UNION ALL SELECT 'units',               count(*) FROM units
-- UNION ALL SELECT 'suppliers',           count(*) FROM suppliers
-- UNION ALL SELECT 'warehouses',          count(*) FROM warehouses;
