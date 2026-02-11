#!/usr/bin/env tsx
/**
 * V3D Color Extraction Verification Script
 *
 * Verifies that all 61 GLB models in public/models/ contain valid V3D color data
 * that can be extracted using the same logic as Model3DViewer.tsx.
 *
 * This script reads each GLB binary, extracts the GLTF JSON chunk, and verifies
 * that materials have the S8S_v3d_material_data extension with valid color data.
 */

import fs from 'fs';
import path from 'path';

interface V3DColorData {
  r: number;
  g: number;
  b: number;
  opacity: number;
}

interface MaterialReport {
  name: string;
  hasV3DData: boolean;
  hasValidColor: boolean;
  isTransparent: boolean;
  color?: V3DColorData;
  issue?: string;
}

interface ModelReport {
  file: string;
  totalMaterials: number;
  v3dMaterials: number;
  validColors: number;
  transparentMaterials: number;
  status: 'PASS' | 'FAIL';
  materials: MaterialReport[];
}

/**
 * Parse GLB binary format and extract GLTF JSON chunk.
 * GLB format:
 * - 12-byte header: magic (4 bytes), version (4 bytes), length (4 bytes)
 * - Chunks: chunkLength (4 bytes), chunkType (4 bytes), chunkData (chunkLength bytes)
 * - First chunk is JSON (type 0x4E4F534A)
 */
function parseGLB(buffer: Buffer): any {
  // Read header
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) { // "glTF" in little-endian
    throw new Error('Invalid GLB file: magic number mismatch');
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }

  // Read first chunk (JSON)
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);

  if (chunkType !== 0x4E4F534A) { // "JSON" in ASCII
    throw new Error('First chunk is not JSON');
  }

  const jsonData = buffer.slice(20, 20 + chunkLength).toString('utf8');
  return JSON.parse(jsonData);
}

/**
 * Extract V3D color data from GLTF JSON materials.
 * Mirrors the logic in Model3DViewer.tsx extractV3DColors()
 */
function extractV3DColors(gltfJson: any): Map<string, V3DColorData> {
  const colorMap = new Map<string, V3DColorData>();

  const materials = gltfJson?.materials;
  if (!Array.isArray(materials)) {
    return colorMap;
  }

  for (const mat of materials) {
    const name = mat.name;
    if (!name || name === 'Verge3D_Environment') {
      continue;
    }

    const v3dData = mat.extensions?.S8S_v3d_material_data;
    if (!v3dData) {
      continue;
    }

    const nodes = v3dData.nodeGraph?.nodes;
    if (!Array.isArray(nodes)) {
      continue;
    }

    const materialNode = nodes.find((n: any) => n.type === 'MATERIAL_MX');
    if (!materialNode?.inputs || materialNode.inputs.length < 7) {
      continue;
    }

    // MATERIAL_MX inputs[1] = display color [r,g,b,a] (sRGB), inputs[6] = opacity
    const colorInput = materialNode.inputs[1];
    const opacityInput = materialNode.inputs[6];

    if (Array.isArray(colorInput) && colorInput.length >= 3) {
      colorMap.set(name, {
        r: colorInput[0],
        g: colorInput[1],
        b: colorInput[2],
        opacity: typeof opacityInput === 'number' ? opacityInput : 1.0,
      });
    }
  }

  return colorMap;
}

/**
 * Analyze a single GLB file and generate a report.
 */
function analyzeGLB(filePath: string): ModelReport {
  const fileName = path.basename(filePath);

  try {
    const buffer = fs.readFileSync(filePath);
    const gltfJson = parseGLB(buffer);

    const materials = gltfJson?.materials || [];
    const v3dColorMap = extractV3DColors(gltfJson);

    const materialReports: MaterialReport[] = [];
    let validColorCount = 0;
    let transparentCount = 0;

    for (const mat of materials) {
      const name = mat.name;

      // Skip Verge3D environment material
      if (name === 'Verge3D_Environment') {
        continue;
      }

      const hasV3DData = !!mat.extensions?.S8S_v3d_material_data;
      const color = v3dColorMap.get(name);
      const hasValidColor = !!color;
      const isTransparent = color ? color.opacity < 1.0 : false;

      if (hasValidColor) {
        validColorCount++;
      }
      if (isTransparent) {
        transparentCount++;
      }

      let issue: string | undefined;
      if (!hasV3DData) {
        issue = 'No S8S_v3d_material_data extension';
      } else if (!hasValidColor) {
        const v3dData = mat.extensions.S8S_v3d_material_data;
        const nodes = v3dData.nodeGraph?.nodes;
        if (!Array.isArray(nodes)) {
          issue = 'No nodeGraph.nodes array';
        } else {
          const materialNode = nodes.find((n: any) => n.type === 'MATERIAL_MX');
          if (!materialNode) {
            issue = 'No MATERIAL_MX node found';
          } else if (!materialNode.inputs || materialNode.inputs.length < 7) {
            issue = `MATERIAL_MX has ${materialNode.inputs?.length || 0} inputs (expected >= 7)`;
          } else {
            issue = 'Color input format invalid';
          }
        }
      }

      materialReports.push({
        name,
        hasV3DData,
        hasValidColor,
        isTransparent,
        color,
        issue,
      });
    }

    const status = validColorCount > 0 ? 'PASS' : 'FAIL';

    return {
      file: fileName,
      totalMaterials: materialReports.length,
      v3dMaterials: materialReports.filter(m => m.hasV3DData).length,
      validColors: validColorCount,
      transparentMaterials: transparentCount,
      status,
      materials: materialReports,
    };
  } catch (error) {
    return {
      file: fileName,
      totalMaterials: 0,
      v3dMaterials: 0,
      validColors: 0,
      transparentMaterials: 0,
      status: 'FAIL',
      materials: [],
    };
  }
}

/**
 * Main execution
 */
function main() {
  const modelsDir = path.join(process.cwd(), 'public', 'models');

  if (!fs.existsSync(modelsDir)) {
    console.error(`Error: Models directory not found: ${modelsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(modelsDir)
    .filter(f => f.endsWith('.glb'))
    .sort();

  console.log('V3D Color Extraction Verification');
  console.log('='.repeat(80));
  console.log(`\nScanning ${files.length} GLB models in public/models/\n`);

  const reports: ModelReport[] = [];

  for (const file of files) {
    const filePath = path.join(modelsDir, file);
    const report = analyzeGLB(filePath);
    reports.push(report);
  }

  // Generate summary table
  console.log('Model File'.padEnd(18) +
              'Materials'.padEnd(12) +
              'V3D Colors'.padEnd(12) +
              'Missing'.padEnd(10) +
              'Transparent'.padEnd(13) +
              'Status');
  console.log('-'.repeat(80));

  for (const report of reports) {
    const materialsStr = report.totalMaterials.toString();
    const v3dStr = report.validColors.toString();
    const missingStr = (report.totalMaterials - report.validColors).toString();
    const transpStr = report.transparentMaterials.toString();
    const statusIcon = report.status === 'PASS' ? '✓' : '✗';

    console.log(
      report.file.padEnd(18) +
      materialsStr.padEnd(12) +
      v3dStr.padEnd(12) +
      missingStr.padEnd(10) +
      transpStr.padEnd(13) +
      `${statusIcon} ${report.status}`
    );
  }

  // Overall summary
  const passCount = reports.filter(r => r.status === 'PASS').length;
  const failCount = reports.filter(r => r.status === 'FAIL').length;
  const totalMaterials = reports.reduce((sum, r) => sum + r.totalMaterials, 0);
  const totalValidColors = reports.reduce((sum, r) => sum + r.validColors, 0);
  const totalTransparent = reports.reduce((sum, r) => sum + r.transparentMaterials, 0);

  console.log('-'.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   Models scanned:      ${reports.length}`);
  console.log(`   Passed:              ${passCount} (${((passCount/reports.length)*100).toFixed(1)}%)`);
  console.log(`   Failed:              ${failCount}`);
  console.log(`   Total materials:     ${totalMaterials}`);
  console.log(`   Valid V3D colors:    ${totalValidColors}`);
  console.log(`   Transparent mats:    ${totalTransparent}`);

  // Show failures detail
  if (failCount > 0) {
    console.log('\n⚠️  Failed Models:');
    for (const report of reports) {
      if (report.status === 'FAIL') {
        console.log(`\n   ${report.file}:`);
        if (report.materials.length === 0) {
          console.log('      Error reading file or no materials found');
        } else {
          for (const mat of report.materials) {
            if (!mat.hasValidColor) {
              console.log(`      - ${mat.name}: ${mat.issue || 'Unknown issue'}`);
            }
          }
        }
      }
    }
  }

  // Show transparent materials summary
  if (totalTransparent > 0) {
    console.log('\n🔍 Transparent Materials Found:');
    console.log('   These materials have opacity < 1.0 and will interact with ghost effect:');

    const transparentModels = reports.filter(r => r.transparentMaterials > 0);
    for (const report of transparentModels) {
      const transpMats = report.materials.filter(m => m.isTransparent);
      if (transpMats.length > 0) {
        console.log(`\n   ${report.file}:`);
        for (const mat of transpMats) {
          console.log(`      - ${mat.name}: opacity=${mat.color?.opacity.toFixed(2)}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  if (failCount === 0) {
    console.log('✓ All models passed V3D color extraction verification!\n');
    process.exit(0);
  } else {
    console.log(`✗ ${failCount} model(s) failed verification. See details above.\n`);
    process.exit(1);
  }
}

main();
