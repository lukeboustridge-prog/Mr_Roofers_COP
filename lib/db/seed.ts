import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { substrates, categories, details, detailSteps, warningConditions, failureCases, detailFailureLinks } from './schema';

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await db.delete(detailFailureLinks);
  await db.delete(detailSteps);
  await db.delete(warningConditions);
  await db.delete(failureCases);
  await db.delete(details);
  await db.delete(categories);
  await db.delete(substrates);
  console.log('✅ Existing data cleared\n');

  // Seed Substrates
  console.log('📦 Seeding substrates...');
  const substrateData = [
    { id: 'long-run-metal', name: 'Long-Run Metal', description: 'Corrugated, trapezoidal, and standing seam metal roofing systems', iconUrl: '/icons/substrates/metal.svg', sortOrder: 1 },
    { id: 'membrane', name: 'Membrane', description: 'TPO, PVC, EPDM, and other membrane roofing applications', iconUrl: '/icons/substrates/membrane.svg', sortOrder: 2 },
    { id: 'asphalt-shingle', name: 'Asphalt Shingle', description: 'Asphalt shingle installation and detailing', iconUrl: '/icons/substrates/shingle.svg', sortOrder: 3 },
    { id: 'concrete-tile', name: 'Concrete Tile', description: 'Concrete tile roofing systems and accessories', iconUrl: '/icons/substrates/concrete.svg', sortOrder: 4 },
    { id: 'clay-tile', name: 'Clay Tile', description: 'Traditional and modern clay tile installations', iconUrl: '/icons/substrates/clay.svg', sortOrder: 5 },
    { id: 'pressed-metal-tile', name: 'Pressed Metal Tile', description: 'Pressed metal tile systems including shake profiles', iconUrl: '/icons/substrates/pressed.svg', sortOrder: 6 },
  ];
  await db.insert(substrates).values(substrateData);
  console.log(`✅ Seeded ${substrateData.length} substrates\n`);

  // Seed Categories
  console.log('📁 Seeding categories...');
  const categoryData = [
    // Long-Run Metal
    { id: 'lrm-flashings', substrateId: 'long-run-metal', name: 'Flashings', description: 'Wall, barge, apron, and step flashings', iconUrl: '/icons/categories/flashings.svg', sortOrder: 1 },
    { id: 'lrm-ridges', substrateId: 'long-run-metal', name: 'Ridges & Hips', description: 'Ridge capping and hip details', iconUrl: '/icons/categories/ridges.svg', sortOrder: 2 },
    { id: 'lrm-valleys', substrateId: 'long-run-metal', name: 'Valleys', description: 'Valley gutter and intersection details', iconUrl: '/icons/categories/valleys.svg', sortOrder: 3 },
    { id: 'lrm-penetrations', substrateId: 'long-run-metal', name: 'Penetrations', description: 'Pipe, vent, and skylight penetrations', iconUrl: '/icons/categories/penetrations.svg', sortOrder: 4 },
    { id: 'lrm-gutters', substrateId: 'long-run-metal', name: 'Gutters & Downpipes', description: 'Gutter connections and accessories', iconUrl: '/icons/categories/gutters.svg', sortOrder: 5 },
    { id: 'lrm-ventilation', substrateId: 'long-run-metal', name: 'Ventilation', description: 'Roof space ventilation requirements', iconUrl: '/icons/categories/ventilation.svg', sortOrder: 6 },
    // Membrane
    { id: 'mem-flashings', substrateId: 'membrane', name: 'Flashings', description: 'Membrane terminations and upstands', iconUrl: '/icons/categories/flashings.svg', sortOrder: 1 },
    { id: 'mem-penetrations', substrateId: 'membrane', name: 'Penetrations', description: 'Membrane penetration boots and seals', iconUrl: '/icons/categories/penetrations.svg', sortOrder: 2 },
    { id: 'mem-drains', substrateId: 'membrane', name: 'Drains & Outlets', description: 'Internal and external drainage', iconUrl: '/icons/categories/drainage.svg', sortOrder: 3 },
    { id: 'mem-edges', substrateId: 'membrane', name: 'Edges & Parapets', description: 'Edge trims and parapet details', iconUrl: '/icons/categories/edges.svg', sortOrder: 4 },
    // Asphalt Shingle
    { id: 'ash-starter', substrateId: 'asphalt-shingle', name: 'Starter & Eaves', description: 'Starter strips and eave details', iconUrl: '/icons/categories/eaves.svg', sortOrder: 1 },
    { id: 'ash-ridges', substrateId: 'asphalt-shingle', name: 'Ridges & Hips', description: 'Cap shingles and hip treatments', iconUrl: '/icons/categories/ridges.svg', sortOrder: 2 },
    { id: 'ash-valleys', substrateId: 'asphalt-shingle', name: 'Valleys', description: 'Open and closed valley methods', iconUrl: '/icons/categories/valleys.svg', sortOrder: 3 },
    { id: 'ash-flashings', substrateId: 'asphalt-shingle', name: 'Flashings', description: 'Step and counter flashings', iconUrl: '/icons/categories/flashings.svg', sortOrder: 4 },
    // Concrete Tile
    { id: 'ct-flashings', substrateId: 'concrete-tile', name: 'Flashings', description: 'Wall and penetration flashings', iconUrl: '/icons/categories/flashings.svg', sortOrder: 1 },
    { id: 'ct-ridges', substrateId: 'concrete-tile', name: 'Ridges & Hips', description: 'Ridge and hip tile installation', iconUrl: '/icons/categories/ridges.svg', sortOrder: 2 },
    { id: 'ct-valleys', substrateId: 'concrete-tile', name: 'Valleys', description: 'Valley tile arrangements', iconUrl: '/icons/categories/valleys.svg', sortOrder: 3 },
    { id: 'ct-ventilation', substrateId: 'concrete-tile', name: 'Ventilation', description: 'Tile ventilation products', iconUrl: '/icons/categories/ventilation.svg', sortOrder: 4 },
    // Clay Tile
    { id: 'clt-flashings', substrateId: 'clay-tile', name: 'Flashings', description: 'Traditional clay tile flashings', iconUrl: '/icons/categories/flashings.svg', sortOrder: 1 },
    { id: 'clt-ridges', substrateId: 'clay-tile', name: 'Ridges & Hips', description: 'Ridge and hip treatments', iconUrl: '/icons/categories/ridges.svg', sortOrder: 2 },
    { id: 'clt-valleys', substrateId: 'clay-tile', name: 'Valleys', description: 'Valley construction methods', iconUrl: '/icons/categories/valleys.svg', sortOrder: 3 },
    // Pressed Metal Tile
    { id: 'pmt-flashings', substrateId: 'pressed-metal-tile', name: 'Flashings', description: 'Pressed metal tile flashings', iconUrl: '/icons/categories/flashings.svg', sortOrder: 1 },
    { id: 'pmt-ridges', substrateId: 'pressed-metal-tile', name: 'Ridges & Hips', description: 'Ridge cap installation', iconUrl: '/icons/categories/ridges.svg', sortOrder: 2 },
    { id: 'pmt-valleys', substrateId: 'pressed-metal-tile', name: 'Valleys', description: 'Valley pan details', iconUrl: '/icons/categories/valleys.svg', sortOrder: 3 },
  ];
  await db.insert(categories).values(categoryData);
  console.log(`✅ Seeded ${categoryData.length} categories\n`);

  // Seed Details (Complete F01-F16 for Long-Run Metal flashings)
  console.log('📋 Seeding details...');
  const detailData = [
    // Long-Run Metal - Flashings (F01-F16)
    {
      id: 'lrm-f01',
      code: 'F01',
      name: 'Wall Flashing - Standard',
      description: 'Standard wall flashing detail for profiled metal roofing against masonry or timber-framed walls. Suitable for most residential applications.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', thickness: '0.55mm BMT', upturn: '35mm minimum', cover: '150mm minimum' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7', title: 'Wall cladding junctions' }],
      ventilationReqs: [{ check: 'Ensure flashing does not block eave ventilation path', required: true }],
    },
    {
      id: 'lrm-f02',
      code: 'F02',
      name: 'Wall Flashing - High Wind Zone',
      description: 'Enhanced wall flashing for Very High and Extra High wind zones. Features additional fixings and increased overlap requirements.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', thickness: '0.55mm BMT', upturn: '50mm minimum', cover: '200mm minimum', fixings: '150mm centres' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7', title: 'Wall cladding junctions' }, { code: 'NZS 3604', clause: '7.2', title: 'Wind zone requirements' }],
      ventilationReqs: [{ check: 'Ensure flashing does not block eave ventilation path', required: true }],
    },
    {
      id: 'lrm-f03',
      code: 'F03',
      name: 'Barge Flashing',
      description: 'Barge (rake) flashing for profiled metal roofing at gable ends. Provides weather protection at roof edge.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Matching roof material', thickness: '0.55mm BMT', cover: '100mm minimum', drip: '25mm' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.5', title: 'Roof edge details' }],
      ventilationReqs: [{ check: 'Barge must not obstruct eave ventilation', required: true }],
    },
    {
      id: 'lrm-f04',
      code: 'F04',
      name: 'Apron Flashing',
      description: 'Apron flashing where roof meets vertical surface at lower edge. Critical for preventing water ingress behind cladding.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', thickness: '0.55mm BMT', upturn: '75mm minimum', overlap: '150mm' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7.3', title: 'Apron flashing requirements' }],
      ventilationReqs: [{ check: 'Allow for drainage path at flashing base', required: true }],
    },
    {
      id: 'lrm-f05',
      code: 'F05',
      name: 'Step Flashing',
      description: 'Stepped flashing for roof-to-wall junctions on sloped sections. Each piece overlaps the one below.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 8,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', thickness: '0.55mm BMT', upturn: '75mm minimum', stepLength: '250mm', overlap: '75mm' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7.2', title: 'Step flashing requirements' }],
      ventilationReqs: [{ check: 'Step flashing must not block wall cavity drainage', required: true }],
    },
    {
      id: 'lrm-f06',
      code: 'F06',
      name: 'Counter Flashing',
      description: 'Counter flashing installed over base flashing to provide secondary weather barrier. Essential for long-term performance.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Matching wall cladding or aluminium', cover: '50mm minimum over base flashing', seal: 'Silicone at top edge' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7.1', title: 'Two-piece flashing systems' }],
      ventilationReqs: [],
    },
    {
      id: 'lrm-f07',
      code: 'F07',
      name: 'Head Flashing to Joinery',
      description: 'Head flashing above window and door openings. Critical detail for preventing water ingress - common failure point.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', thickness: '0.55mm BMT', upturn: '35mm minimum', cover: '50mm over joinery', endDams: 'Required' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7', title: 'Flashing requirements' }, { code: 'NZS 4211', clause: '5.3', title: 'Window installation' }],
      ventilationReqs: [],
    },
    {
      id: 'lrm-f08',
      code: 'F08',
      name: 'Parapet Capping',
      description: 'Capping for parapet walls with profiled metal roofing. Requires careful detailing for water management.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 0,
      maxPitch: 10,
      specifications: { material: 'Aluminium or colour-coated steel', thickness: '0.55mm BMT', overhang: '25mm each side', joints: 'Welted or sealed' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.9', title: 'Parapet construction' }],
      ventilationReqs: [{ check: 'Ensure parapet cavity is ventilated', required: true }],
    },
    {
      id: 'lrm-f09',
      code: 'F09',
      name: 'Eave Gutter Flashing',
      description: 'Flashing detail at eave where roofing meets gutter. Ensures proper water discharge and prevents back-flow.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { overhang: '50mm into gutter', drip: 'Formed drip edge', material: 'Matching roof material' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.9', title: 'Eave gutter detail' }, { code: 'E1/AS1', clause: '6.2', title: 'Roof drainage' }],
      ventilationReqs: [{ check: 'Eave ventilation path maintained above gutter', required: true }, { check: 'Soffit vents not obstructed by gutter back', required: true }],
    },
    {
      id: 'lrm-f10',
      code: 'F10',
      name: 'Internal Box Gutter',
      description: 'Internal (concealed) box gutter between roof sections or at parapet junction.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 0,
      maxPitch: 10,
      specifications: { width: '450mm minimum', depth: '100mm minimum', freeboard: '40mm minimum', material: '0.55mm BMT or membrane' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.9.2', title: 'Internal gutter requirements' }, { code: 'E1/AS1', clause: '6.2.3', title: 'Internal gutter sizing' }],
      ventilationReqs: [{ check: 'Box gutter does not block roof ventilation', required: true }, { check: 'Overflow provision required', required: true }],
    },
    {
      id: 'lrm-f11',
      code: 'F11',
      name: 'Expansion Joint Detail',
      description: 'Expansion joint for long-run metal roofing exceeding maximum recommended lengths. Allows thermal movement.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { interval: 'Every 12-16m depending on profile', movement: '±10mm minimum', detail: 'Standing seam or cover flashing' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.4', title: 'Thermal movement allowance' }],
      ventilationReqs: [{ check: 'Expansion joints must not block drainage', required: true }],
    },
    {
      id: 'lrm-f12',
      code: 'F12',
      name: 'Translucent Panel Junction',
      description: 'Junction detail between metal roofing and translucent panels (polycarbonate or fibreglass).',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 5,
      maxPitch: 60,
      specifications: { sidelap: '1.5 corrugations minimum', endlap: '200mm minimum', sealant: 'Profile filler + neutral cure silicone' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.4.4', title: 'Mixed roof materials' }],
      ventilationReqs: [{ check: 'Consider solar gain from translucent panels', required: false }],
    },
    {
      id: 'lrm-f13',
      code: 'F13',
      name: 'Sill Flashing',
      description: 'Flashing below window sills to direct water away from wall framing.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 0,
      maxPitch: 90,
      specifications: { material: 'Aluminium or galvanised steel', drip: '25mm minimum', upturn: '15mm at back', endDams: 'Required' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7', title: 'Sill flashing requirements' }, { code: 'NZS 4211', clause: '5.4', title: 'Window sill detail' }],
      ventilationReqs: [],
    },
    {
      id: 'lrm-f14',
      code: 'F14',
      name: 'Soaker Flashing',
      description: 'Secret gutter (soaker) detail for roof-to-wall junctions where visible flashings are not desired.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 8,
      maxPitch: 90,
      specifications: { material: 'Lead or aluminium', width: '200mm minimum', upturn: '100mm', depth: '25mm minimum' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7.4', title: 'Soaker flashing requirements' }],
      ventilationReqs: [{ check: 'Soaker must drain to exterior', required: true }],
    },
    {
      id: 'lrm-f15',
      code: 'F15',
      name: 'Chimney Flashing Set',
      description: 'Complete flashing set for chimney penetrations including apron, step, and back flashings.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 8,
      maxPitch: 60,
      specifications: { apron: '100mm upturn', steps: 'Individual pieces 250mm', back: 'Saddle or cricket if width >750mm', material: '0.55mm BMT' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.8', title: 'Chimney flashing requirements' }],
      ventilationReqs: [{ check: 'Clearance to combustible materials per manufacturer', required: true }, { check: 'Flue clearances must comply with AS/NZS 2918', required: true }],
    },
    {
      id: 'lrm-f16',
      code: 'F16',
      name: 'Change of Pitch Flashing',
      description: 'Flashing detail where roof pitch changes (e.g., mansard roof or dormer intersection).',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-flashings',
      minPitch: 3,
      maxPitch: 90,
      specifications: { overlap: '200mm minimum onto lower pitch', upturn: '75mm onto steeper pitch', sealant: 'Butyl tape at overlap' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.5', title: 'Change of pitch details' }],
      ventilationReqs: [{ check: 'Ventilation path maintained at pitch change', required: true }],
    },
    // Long-Run Metal - Ridges
    {
      id: 'lrm-r01',
      code: 'R01',
      name: 'Ridge Capping - Standard',
      description: 'Standard ridge capping for profiled metal roofing. Provides weather seal at roof apex.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-ridges',
      minPitch: 8,
      maxPitch: 45,
      specifications: { material: 'Matching roof profile', overlap: '150mm minimum', fixings: 'Through ridge into purlins' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.4', title: 'Ridge and hip details' }],
      ventilationReqs: [{ check: 'Consider ventilated ridge if roof space ventilation required', required: false }],
    },
    {
      id: 'lrm-r02',
      code: 'R02',
      name: 'Ridge Capping - Ventilated',
      description: 'Ventilated ridge capping allowing airflow through roof space. Essential for condensation control.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-ridges',
      minPitch: 10,
      maxPitch: 45,
      specifications: { material: 'Purpose-made ventilated ridge', freeArea: '10000mm² per linear metre minimum', mesh: 'Insect mesh required' },
      standardsRefs: [{ code: 'E3/AS1', clause: '2.1', title: 'Roof space ventilation' }],
      ventilationReqs: [{ check: 'Pair with eave ventilation for cross-flow', required: true }, { check: 'Minimum 10,000mm² free area per 100m² ceiling', required: true }],
    },
    {
      id: 'lrm-r03',
      code: 'R03',
      name: 'Hip Capping',
      description: 'Hip flashing for external intersection of two roof planes.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-ridges',
      minPitch: 8,
      maxPitch: 45,
      specifications: { width: '150mm each side minimum', fixings: 'Type 17 through pan', joints: 'Lapped 150mm in direction of fall' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.7.3', title: 'Hip flashing requirements' }],
      ventilationReqs: [{ check: 'Hip does not block ventilation path from eave', required: true }],
    },
    // Long-Run Metal - Valleys
    {
      id: 'lrm-v01',
      code: 'V01',
      name: 'Valley Gutter - Standard',
      description: 'Standard valley gutter for profiled metal roofing. Width varies based on roof pitch and catchment area.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-valleys',
      minPitch: 8,
      maxPitch: 60,
      specifications: { material: 'Galvanised steel or aluminium', thickness: '0.55mm BMT', width: '400mm minimum', upturn: '25mm each side' },
      standardsRefs: [{ code: 'E2/AS1', clause: 'Table 20', title: 'Valley gutter dimensions' }],
      ventilationReqs: [{ check: 'Valley does not obstruct cross-ventilation path', required: true }],
    },
    {
      id: 'lrm-v02',
      code: 'V02',
      name: 'Valley Gutter - Low Pitch',
      description: 'Valley gutter for low pitch applications (under 10°). Requires wider gutter and enhanced sealing.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-valleys',
      minPitch: 3,
      maxPitch: 10,
      specifications: { material: 'Galvanised steel or aluminium', thickness: '0.55mm BMT', width: '600mm minimum', sealant: 'Butyl tape under sheeting', turnups: '40mm minimum' },
      standardsRefs: [{ code: 'E2/AS1', clause: 'Table 20', title: 'Valley gutter dimensions' }],
      ventilationReqs: [],
    },
    // Long-Run Metal - Penetrations
    {
      id: 'lrm-p01',
      code: 'P01',
      name: 'Pipe Penetration - Standard',
      description: 'Standard pipe penetration detail using proprietary flashing boot. Suitable for pipes up to 150mm diameter.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-penetrations',
      minPitch: 3,
      maxPitch: 45,
      specifications: { boot: 'EPDM or silicone dektite', size: 'Match pipe diameter with 15% stretch', position: 'High side of pan' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.8', title: 'Penetration details' }],
      ventilationReqs: [{ check: 'Hot flue requires clearance and heat shield', required: false }],
    },
    {
      id: 'lrm-p02',
      code: 'P02',
      name: 'Pipe Penetration - Large',
      description: 'Penetration detail for large pipes and ducts over 150mm. Requires fabricated metal flashing.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-penetrations',
      minPitch: 3,
      maxPitch: 90,
      specifications: { material: 'Matching roof material', upturn: '100mm minimum', apron: 'Required on high side' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.8', title: 'Penetration details' }],
      ventilationReqs: [{ check: 'Penetration does not compromise air barrier', required: true }],
    },
    {
      id: 'lrm-p03',
      code: 'P03',
      name: 'Skylight Installation',
      description: 'Skylight installation in profiled metal roofing. Requires careful flashing integration.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-penetrations',
      minPitch: 5,
      maxPitch: 60,
      specifications: { flashing: 'Manufacturer-supplied or fabricated', upturn: '100mm all sides', sealant: 'Per manufacturer specification' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.1.8', title: 'Penetration details' }],
      ventilationReqs: [{ check: 'Skylight does not obstruct ventilation path', required: true }],
    },
    // Long-Run Metal - Ventilation
    {
      id: 'lrm-vent01',
      code: 'VENT01',
      name: 'Whirlybird Ventilator',
      description: 'Turbine (whirlybird) roof ventilator installation for active roof space ventilation.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-ventilation',
      minPitch: 5,
      maxPitch: 35,
      specifications: { freeArea: 'Calculate per E3/AS1', base: 'Factory or site-formed to match profile', fixings: 'Type 17 through pan' },
      standardsRefs: [{ code: 'E3/AS1', clause: '3.0.1', title: 'Roof space ventilation' }],
      ventilationReqs: [{ check: 'Position for optimal airflow (high point)', required: true }, { check: 'Balance with low-level intake vents', required: true }],
    },
    {
      id: 'lrm-vent02',
      code: 'VENT02',
      name: 'Soffit Ventilation',
      description: 'Eave soffit ventilation detail for roof space air intake.',
      substrateId: 'long-run-metal',
      categoryId: 'lrm-ventilation',
      minPitch: 3,
      maxPitch: 90,
      specifications: { freeArea: '5000mm² per 100m² ceiling minimum', mesh: '2mm insect mesh', spacing: 'Continuous or 1200mm max centres' },
      standardsRefs: [{ code: 'E3/AS1', clause: '3.0.1', title: 'Roof ventilation requirements' }],
      ventilationReqs: [{ check: 'Low-level intake for cross-ventilation', required: true }, { check: 'Clear path to roof apex ventilation', required: true }],
    },
    // Membrane details
    {
      id: 'mem-f01',
      code: 'MF01',
      name: 'Membrane Upstand to Wall',
      description: 'Standard membrane upstand termination at wall junction. Minimum height and fixing requirements.',
      substrateId: 'membrane',
      categoryId: 'mem-flashings',
      minPitch: 0,
      maxPitch: 10,
      specifications: { upturn: '150mm minimum', termination: 'Mechanical bar or adhesive', protection: 'Counter flashing required' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.2', title: 'Membrane roof requirements' }],
      ventilationReqs: [],
    },
    {
      id: 'mem-p01',
      code: 'MP01',
      name: 'Membrane Pipe Boot',
      description: 'Pipe penetration through membrane roofing. Uses welded or bonded boot detail.',
      substrateId: 'membrane',
      categoryId: 'mem-penetrations',
      minPitch: 0,
      maxPitch: 10,
      specifications: { boot: 'TPO/PVC compatible', weld: 'Hot air welded', clamp: 'Stainless steel band at top' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.2.4', title: 'Membrane penetrations' }],
      ventilationReqs: [],
    },
    // Concrete Tile details
    {
      id: 'ct-r01',
      code: 'CR01',
      name: 'Ridge Tile - Bedded',
      description: 'Mortar-bedded ridge tiles for concrete tile roofing. Traditional method with pointing.',
      substrateId: 'concrete-tile',
      categoryId: 'ct-ridges',
      minPitch: 15,
      maxPitch: 45,
      specifications: { mortar: '1:4 cement:sand', bedding: '25mm minimum', pointing: 'Weathered profile' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.3.4', title: 'Tile ridge details' }],
      ventilationReqs: [{ check: 'Consider dry ridge system for improved ventilation', required: false }],
    },
    {
      id: 'ct-r02',
      code: 'CR02',
      name: 'Ridge Tile - Dry Fix',
      description: 'Mechanically fixed ridge system for concrete tiles. Provides improved ventilation and longevity.',
      substrateId: 'concrete-tile',
      categoryId: 'ct-ridges',
      minPitch: 15,
      maxPitch: 45,
      specifications: { system: 'Proprietary dry ridge kit', fixings: 'Stainless steel screws', gasket: 'EPDM or silicone' },
      standardsRefs: [{ code: 'E2/AS1', clause: '9.3.4', title: 'Tile ridge details' }],
      ventilationReqs: [{ check: 'Dry ridge provides ventilation - pair with eave vents', required: true }],
    },
  ];
  await db.insert(details).values(detailData);
  console.log(`✅ Seeded ${detailData.length} details\n`);

  // Seed Detail Steps for key details
  console.log('📝 Seeding detail steps...');
  const stepsData = [
    // F07 - Head Flashing steps
    { id: 'lrm-f07-s1', detailId: 'lrm-f07', stepNumber: 1, instruction: 'Ensure framing is plumb and level. Install building wrap with correct laps over the head of opening.', cautionNote: null },
    { id: 'lrm-f07-s2', detailId: 'lrm-f07', stepNumber: 2, instruction: 'Form end dams by folding flashing material at each end of the flashing. End dams must be a minimum of 10mm high.', cautionNote: 'Missing end dams is a common failure point - always install' },
    { id: 'lrm-f07-s3', detailId: 'lrm-f07', stepNumber: 3, instruction: 'Position head flashing with minimum 50mm cover over joinery head and 35mm upturn against wall.', cautionNote: 'Inadequate upturn is the most common cause of failure' },
    { id: 'lrm-f07-s4', detailId: 'lrm-f07', stepNumber: 4, instruction: 'Seal upturn to building wrap using compatible flashing tape. Ensure no gaps or fish-mouths.', cautionNote: null },
    { id: 'lrm-f07-s5', detailId: 'lrm-f07', stepNumber: 5, instruction: 'Install cladding over flashing with appropriate clearances per cladding manufacturer requirements.', cautionNote: null },
    // V01 - Valley Gutter steps
    { id: 'lrm-v01-s1', detailId: 'lrm-v01', stepNumber: 1, instruction: 'Install valley board (tilting fillet) to support valley gutter at correct angle.', cautionNote: null },
    { id: 'lrm-v01-s2', detailId: 'lrm-v01', stepNumber: 2, instruction: 'Lay building underlay into valley with 150mm overlap each side.', cautionNote: null },
    { id: 'lrm-v01-s3', detailId: 'lrm-v01', stepNumber: 3, instruction: 'Install valley gutter with 25mm minimum upturn on each side. Overlap sections minimum 150mm in direction of flow.', cautionNote: 'Check width against E2/AS1 Table 20 for your pitch' },
    { id: 'lrm-v01-s4', detailId: 'lrm-v01', stepNumber: 4, instruction: 'Install roofing sheets with minimum 100mm clearance from valley centreline.', cautionNote: 'Increase to 150mm for pitches below 8°' },
    { id: 'lrm-v01-s5', detailId: 'lrm-v01', stepNumber: 5, instruction: 'Do not fix through valley flashing - fix through roof pan only.', cautionNote: 'Critical - valley must remain watertight' },
    // F03 - Barge Flashing steps
    { id: 'lrm-f03-s1', detailId: 'lrm-f03', stepNumber: 1, instruction: 'Verify barge board is level and securely fixed to framing.', cautionNote: null },
    { id: 'lrm-f03-s2', detailId: 'lrm-f03', stepNumber: 2, instruction: 'Position barge flashing with minimum 25mm overhang beyond barge face.', cautionNote: null },
    { id: 'lrm-f03-s3', detailId: 'lrm-f03', stepNumber: 3, instruction: 'Apply continuous butyl sealant tape along underside where flashing contacts roof.', cautionNote: 'Sealant required in all wind zones above Low' },
    { id: 'lrm-f03-s4', detailId: 'lrm-f03', stepNumber: 4, instruction: 'Fix through pan of roofing at maximum 450mm centres using Type 17 fasteners.', cautionNote: null },
    { id: 'lrm-f03-s5', detailId: 'lrm-f03', stepNumber: 5, instruction: 'Check eave ventilation path remains clear along full length of barge.', cautionNote: 'Critical for E3 compliance' },
    // P01 - Pipe Boot steps
    { id: 'lrm-p01-s1', detailId: 'lrm-p01', stepNumber: 1, instruction: 'Cut roofing sheet to provide minimum 10mm clearance around pipe.', cautionNote: null },
    { id: 'lrm-p01-s2', detailId: 'lrm-p01', stepNumber: 2, instruction: 'Select boot size with 15% stretch fit onto pipe outer diameter.', cautionNote: null },
    { id: 'lrm-p01-s3', detailId: 'lrm-p01', stepNumber: 3, instruction: 'Apply silicone sealant around pipe at boot contact point.', cautionNote: null },
    { id: 'lrm-p01-s4', detailId: 'lrm-p01', stepNumber: 4, instruction: 'Stretch boot over pipe and position aluminium base onto roof profile.', cautionNote: null },
    { id: 'lrm-p01-s5', detailId: 'lrm-p01', stepNumber: 5, instruction: 'Fix base through pans of roofing with Type 17 fasteners and butyl washers.', cautionNote: 'Never fix through ribs' },
    { id: 'lrm-p01-s6', detailId: 'lrm-p01', stepNumber: 6, instruction: 'Apply silicone fillet around entire base perimeter.', cautionNote: null },
    // R02 - Ventilated Ridge steps
    { id: 'lrm-r02-s1', detailId: 'lrm-r02', stepNumber: 1, instruction: 'Install ridge purlin to manufacturer specifications.', cautionNote: null },
    { id: 'lrm-r02-s2', detailId: 'lrm-r02', stepNumber: 2, instruction: 'Cut back roofing sheets to provide ventilation gap at apex.', cautionNote: 'Gap typically 25-40mm each side of ridge line' },
    { id: 'lrm-r02-s3', detailId: 'lrm-r02', stepNumber: 3, instruction: 'Install insect mesh over ventilation opening full length of ridge.', cautionNote: 'Required by E3/AS1' },
    { id: 'lrm-r02-s4', detailId: 'lrm-r02', stepNumber: 4, instruction: 'Position ventilated ridge cap ensuring mesh is not compressed or blocked.', cautionNote: null },
    { id: 'lrm-r02-s5', detailId: 'lrm-r02', stepNumber: 5, instruction: 'Fix ridge cap through pans at 300mm centres each side.', cautionNote: null },
    { id: 'lrm-r02-s6', detailId: 'lrm-r02', stepNumber: 6, instruction: 'Verify ventilation free area meets E3/AS1 requirements for ceiling area.', cautionNote: 'Minimum 10,000mm² per 100m² ceiling' },
  ];
  await db.insert(detailSteps).values(stepsData);
  console.log(`✅ Seeded ${stepsData.length} detail steps\n`);

  // Seed Warning Conditions
  console.log('⚠️  Seeding warning conditions...');
  const warningsData = [
    // Wind zone warnings
    { id: 'w-f01-1', detailId: 'lrm-f01', conditionType: 'wind_zone', conditionValue: 'high', warningText: 'High wind zone: Increase fixing frequency to 200mm centres', severity: 'info', nzbcRef: 'E2/AS1 9.1.7' },
    { id: 'w-f02-1', detailId: 'lrm-f02', conditionType: 'wind_zone', conditionValue: 'very-high', warningText: 'Very High wind zone: Use 150mm fixing centres and ensure all laps are sealed', severity: 'warning', nzbcRef: 'NZS 3604 7.2' },
    { id: 'w-f02-2', detailId: 'lrm-f02', conditionType: 'wind_zone', conditionValue: 'extra-high', warningText: 'Extra High wind zone: Engineering design required. This detail may need modification.', severity: 'critical', nzbcRef: 'NZS 3604 7.2' },
    { id: 'w-f03-1', detailId: 'lrm-f03', conditionType: 'wind_zone', conditionValue: 'very-high', warningText: 'Very High wind zone: Increase barge flashing fixings to 100mm centres', severity: 'warning', nzbcRef: 'E2/AS1 9.1.5' },
    { id: 'w-r01-1', detailId: 'lrm-r01', conditionType: 'wind_zone', conditionValue: 'high', warningText: 'High wind zone: Use additional ridge fixings at 300mm centres', severity: 'info', nzbcRef: 'E2/AS1 9.1.4' },
    { id: 'w-r02-1', detailId: 'lrm-r02', conditionType: 'wind_zone', conditionValue: 'high', warningText: 'High wind zone: Ensure ventilated ridge is rated for wind zone', severity: 'info', nzbcRef: 'E3/AS1 2.1' },
    { id: 'w-r02-2', detailId: 'lrm-r02', conditionType: 'wind_zone', conditionValue: 'extra-high', warningText: 'Extra High wind zone: Ventilated ridge may not be suitable - consult manufacturer', severity: 'critical', nzbcRef: 'E3/AS1 2.1' },
    { id: 'w-f10-1', detailId: 'lrm-f10', conditionType: 'wind_zone', conditionValue: 'very-high', warningText: 'Very High wind zones require overflow provision for box gutters', severity: 'warning', nzbcRef: 'E1/AS1' },

    // Corrosion zone warnings
    { id: 'w-f01-2', detailId: 'lrm-f01', conditionType: 'corrosion_zone', conditionValue: 'c', warningText: 'Zone C (marine): Use stainless steel or hot-dip galvanised fixings', severity: 'warning', nzbcRef: 'NZS 3604 4.3' },
    { id: 'w-f07-1', detailId: 'lrm-f07', conditionType: 'corrosion_zone', conditionValue: 'c', warningText: 'Zone C (marine): Use stainless steel fixings and ensure material compatibility', severity: 'warning', nzbcRef: 'NZS 3604 4.3' },
    { id: 'w-f07-2', detailId: 'lrm-f07', conditionType: 'corrosion_zone', conditionValue: 'd', warningText: 'Zone D (severe marine): Stainless steel fixings required. Consider enhanced material specifications.', severity: 'critical', nzbcRef: 'NZS 3604 4.3' },
    { id: 'w-p01-1', detailId: 'lrm-p01', conditionType: 'corrosion_zone', conditionValue: 'd', warningText: 'Zone D (severe marine): EPDM boot may degrade faster - consider silicone alternative', severity: 'warning', nzbcRef: 'E2/AS1 9.1.8' },
    { id: 'w-f08-1', detailId: 'lrm-f08', conditionType: 'corrosion_zone', conditionValue: 'c', warningText: 'Zone C (marine): Parapet capping requires marine-grade material selection', severity: 'warning', nzbcRef: 'E2/AS1 9.1.9' },
    { id: 'w-f08-2', detailId: 'lrm-f08', conditionType: 'corrosion_zone', conditionValue: 'e', warningText: 'Zone E (geothermal): Special material selection required - consult manufacturer', severity: 'critical', nzbcRef: 'NZS 3604 4.3' },
    { id: 'w-r02-3', detailId: 'lrm-r02', conditionType: 'corrosion_zone', conditionValue: 'd', warningText: 'Zone D: Marine-grade mesh required for ventilation strips', severity: 'warning', nzbcRef: 'NZS 3604' },

    // Pitch warnings
    { id: 'w-v01-1', detailId: 'lrm-v01', conditionType: 'pitch', conditionValue: '< 10', warningText: 'Pitch under 10°: Valley gutter must be minimum 500mm wide', severity: 'warning', nzbcRef: 'E2/AS1 Table 20' },
    { id: 'w-v02-1', detailId: 'lrm-v02', conditionType: 'pitch', conditionValue: '< 8', warningText: 'Pitch under 8°: Additional sealing required. Consider upgrading to membrane system.', severity: 'critical', nzbcRef: 'E2/AS1 Table 20' },
    { id: 'w-f04-1', detailId: 'lrm-f04', conditionType: 'pitch', conditionValue: '< 12', warningText: 'Low pitch: Increase apron flashing upturn to 100mm minimum', severity: 'warning', nzbcRef: 'E2/AS1 9.1.7.3' },
    { id: 'w-r01-2', detailId: 'lrm-r01', conditionType: 'pitch', conditionValue: '< 15', warningText: 'Low pitch: Use foam or rubber seal under ridge capping', severity: 'info', nzbcRef: 'E2/AS1 9.1.4' },
    { id: 'w-mem-1', detailId: 'mem-f01', conditionType: 'pitch', conditionValue: '< 3', warningText: 'Near-flat roof: Ensure positive drainage to outlets - check for ponding', severity: 'warning', nzbcRef: 'E2/AS1 9.2' },
    { id: 'w-f10-2', detailId: 'lrm-f10', conditionType: 'pitch', conditionValue: '< 1', warningText: 'Flat box gutters require membrane lining - metal alone insufficient', severity: 'critical', nzbcRef: 'E2/AS1' },
    { id: 'w-p01-2', detailId: 'lrm-p01', conditionType: 'pitch', conditionValue: '> 45', warningText: 'Pitches above 45° may require mechanical restraint for pipe boots', severity: 'warning', nzbcRef: null },

    // General exposure warnings
    { id: 'w-f05-1', detailId: 'lrm-f05', conditionType: 'exposure', conditionValue: 'all', warningText: 'Step flashings must be individually fitted to each course - do not skip steps', severity: 'info', nzbcRef: 'E2/AS1 9.1.7.2' },
    { id: 'w-f06-1', detailId: 'lrm-f06', conditionType: 'exposure', conditionValue: 'all', warningText: 'Counter flashing top edge must be sealed with compatible sealant', severity: 'info', nzbcRef: 'E2/AS1 9.1.7.1' },
    { id: 'w-p03-1', detailId: 'lrm-p03', conditionType: 'exposure', conditionValue: 'all', warningText: 'Skylight installation must follow manufacturer specifications exactly', severity: 'warning', nzbcRef: 'E2/AS1 9.1.8' },
    { id: 'w-f15-1', detailId: 'lrm-f15', conditionType: 'exposure', conditionValue: 'all', warningText: 'Chimney saddle/cricket required if chimney width exceeds 750mm', severity: 'warning', nzbcRef: 'E2/AS1 9.1.8' },
  ];
  await db.insert(warningConditions).values(warningsData);
  console.log(`✅ Seeded ${warningsData.length} warning conditions\n`);

  // Seed Failure Cases
  console.log('🚨 Seeding failure cases...');
  const failuresData = [
    {
      id: 'fc-1',
      caseId: 'MBIE-2023/042',
      substrateTags: ['long-run-metal'],
      detailTags: ['F07', 'flashings'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1'],
      outcome: 'upheld',
      summary: 'Head flashing installed with only 15mm upturn instead of required 35mm minimum. Water tracked behind cladding during heavy rain events, causing damage to wall framing.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-08-15'),
    },
    {
      id: 'fc-2',
      caseId: 'LBP-2022/156',
      substrateTags: ['long-run-metal'],
      detailTags: ['F07', 'flashings'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1', 'B2.3.1'],
      outcome: 'upheld',
      summary: 'Missing end dams on head flashings above windows. Water bypassed flashings at ends, entering wall cavity and causing moisture damage discovered during routine maintenance.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2022-11-22'),
    },
    {
      id: 'fc-3',
      caseId: 'MBIE-2023/089',
      substrateTags: ['long-run-metal'],
      detailTags: ['V01', 'valleys'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.2'],
      outcome: 'partially-upheld',
      summary: 'Valley gutter width insufficient for catchment area and pitch. Overflow during heavy rain caused water damage to ceiling. Gutter was 300mm wide on 8° pitch requiring 500mm minimum.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-06-10'),
    },
    {
      id: 'fc-4',
      caseId: 'LBP-2023/023',
      substrateTags: ['membrane'],
      detailTags: ['MP01', 'penetrations'],
      failureType: 'workmanship',
      nzbcClauses: ['E2.3.1'],
      outcome: 'upheld',
      summary: 'Membrane penetration boot not welded correctly. Cold weld allowed water ingress around pipe, causing damage to structure below flat roof.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-02-28'),
    },
    {
      id: 'fc-5',
      caseId: 'MBIE-2022/201',
      substrateTags: ['long-run-metal'],
      detailTags: ['F02', 'flashings'],
      failureType: 'structural',
      nzbcClauses: ['B1.3.1', 'E2.3.1'],
      outcome: 'upheld',
      summary: 'Incorrect fixings used in Extra High wind zone. Flashings lifted during storm event, allowing water entry and subsequent damage. Standard fixings used instead of specified stainless steel.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2022-09-14'),
    },
    {
      id: 'fc-6',
      caseId: 'LBP-2024/011',
      substrateTags: ['long-run-metal'],
      detailTags: ['R01', 'ridges'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1'],
      outcome: 'upheld',
      summary: 'Ridge capping laps facing into prevailing weather. Wind-driven rain entered at unsealed laps, causing water staining and mould growth in ceiling space.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2024-01-18'),
    },
    {
      id: 'fc-7',
      caseId: 'MBIE-2024/033',
      substrateTags: ['long-run-metal'],
      detailTags: ['F04', 'flashings'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1', 'E2.3.2'],
      outcome: 'upheld',
      summary: 'Apron flashing upturn only 40mm instead of required 75mm minimum. Capillary action drew water behind wall cladding during wind-driven rain, causing rot in bottom plate.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2024-03-22'),
    },
    {
      id: 'fc-8',
      caseId: 'LBP-2023/098',
      substrateTags: ['long-run-metal'],
      detailTags: ['P01', 'penetrations'],
      failureType: 'durability',
      nzbcClauses: ['B2.3.1', 'E2.3.1'],
      outcome: 'partially-upheld',
      summary: 'EPDM pipe boot failed after 8 years in Zone D marine environment. UV degradation and salt exposure caused cracking, allowing water ingress around flue pipe.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-09-05'),
    },
    {
      id: 'fc-9',
      caseId: 'MBIE-2023/156',
      substrateTags: ['concrete-tile'],
      detailTags: ['CR01', 'ridges'],
      failureType: 'workmanship',
      nzbcClauses: ['E2.3.1'],
      outcome: 'dismissed',
      summary: 'Mortar bedded ridge tiles showed minor cracking after 5 years. Investigation found cracking was within acceptable tolerance for mortar-bedded systems and not causing water ingress.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-11-14'),
    },
    {
      id: 'fc-10',
      caseId: 'LBP-2024/045',
      substrateTags: ['long-run-metal'],
      detailTags: ['F05', 'flashings'],
      failureType: 'design-error',
      nzbcClauses: ['E2.3.1', 'E2.3.2'],
      outcome: 'upheld',
      summary: 'Step flashings installed as continuous strip rather than individual stepped pieces. Water bypassed flashing at each course change, causing extensive wall damage over 3 year period.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2024-04-10'),
    },
    {
      id: 'fc-11',
      caseId: 'MBIE-2022/178',
      substrateTags: ['membrane'],
      detailTags: ['MF01', 'flashings'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1'],
      outcome: 'upheld',
      summary: 'Membrane upstand terminated at only 75mm instead of 150mm minimum. Water entered at termination during heavy rain events, damaging interior finishes below.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2022-12-01'),
    },
    {
      id: 'fc-12',
      caseId: 'LBP-2023/167',
      substrateTags: ['long-run-metal'],
      detailTags: ['F08', 'flashings'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.1', 'E2.3.2'],
      outcome: 'partially-upheld',
      summary: 'Parapet capping joints not sealed. Water entered at joint locations, causing corrosion of parapet framing. Issue compounded by lack of parapet cavity ventilation.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-10-25'),
    },
    {
      id: 'fc-13',
      caseId: 'MBIE-2024/067',
      substrateTags: ['long-run-metal'],
      detailTags: ['V02', 'valleys'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2.3.2'],
      outcome: 'upheld',
      summary: 'Low pitch valley (6°) installed without butyl tape seal under roofing sheets. Capillary action caused persistent leaks at valley edges during light rain events.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2024-05-03'),
    },
    {
      id: 'fc-14',
      caseId: 'LBP-2024/089',
      substrateTags: ['long-run-metal'],
      detailTags: ['F10', 'box-gutter'],
      failureType: 'water-ingress',
      nzbcClauses: ['E2', 'E1'],
      outcome: 'upheld',
      summary: 'Internal box gutter installed with inadequate fall and no overflow provision. Gutter overflowed during heavy rain causing significant internal damage. Multiple Code violations found.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2024-06-12'),
    },
    {
      id: 'fc-15',
      caseId: 'MBIE-2023/201',
      substrateTags: ['long-run-metal'],
      detailTags: ['R02', 'ventilation'],
      failureType: 'durability',
      nzbcClauses: ['E3', 'B2'],
      outcome: 'upheld',
      summary: 'Unventilated roof space led to condensation damage to ceiling insulation and framing. Ridge ventilation was not installed despite being specified in building consent documents.',
      sourceUrl: 'https://www.building.govt.nz/resolving-problems/resolution-options/determinations/',
      decisionDate: new Date('2023-12-18'),
    },
  ];
  await db.insert(failureCases).values(failuresData);
  console.log(`✅ Seeded ${failuresData.length} failure cases\n`);

  // Link failures to details
  console.log('🔗 Linking failures to details...');
  const linksData = [
    { detailId: 'lrm-f07', failureCaseId: 'fc-1' },
    { detailId: 'lrm-f07', failureCaseId: 'fc-2' },
    { detailId: 'lrm-v01', failureCaseId: 'fc-3' },
    { detailId: 'mem-p01', failureCaseId: 'fc-4' },
    { detailId: 'lrm-f02', failureCaseId: 'fc-5' },
    { detailId: 'lrm-r01', failureCaseId: 'fc-6' },
    { detailId: 'lrm-f04', failureCaseId: 'fc-7' },
    { detailId: 'lrm-p01', failureCaseId: 'fc-8' },
    { detailId: 'ct-r01', failureCaseId: 'fc-9' },
    { detailId: 'lrm-f05', failureCaseId: 'fc-10' },
    { detailId: 'mem-f01', failureCaseId: 'fc-11' },
    { detailId: 'lrm-f08', failureCaseId: 'fc-12' },
    { detailId: 'lrm-v02', failureCaseId: 'fc-13' },
    { detailId: 'lrm-f10', failureCaseId: 'fc-14' },
    { detailId: 'lrm-r02', failureCaseId: 'fc-15' },
  ];
  await db.insert(detailFailureLinks).values(linksData);
  console.log(`✅ Seeded ${linksData.length} detail-failure links\n`);

  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Substrates: ${substrateData.length}`);
  console.log(`   Categories: ${categoryData.length}`);
  console.log(`   Details: ${detailData.length}`);
  console.log(`   Detail Steps: ${stepsData.length}`);
  console.log(`   Warning Conditions: ${warningsData.length}`);
  console.log(`   Failure Cases: ${failuresData.length}`);
  console.log(`   Detail-Failure Links: ${linksData.length}`);
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
