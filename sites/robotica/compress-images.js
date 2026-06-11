const fs = require('fs');
const path = require('path');

// Simple image compression script
// This will create a backup and compress images

const imageDir = process.argv[2] || './lego_auto/ir_sensor_aan_lego';
const quality = parseInt(process.argv[3]) || 70;
const maxWidth = parseInt(process.argv[4]) || 1200;

console.log(`
╔════════════════════════════════════════════════════════╗
║         Afbeeldingen Comprimeren                       ║
╔════════════════════════════════════════════════════════╝

Je hebt twee opties:

OPTIE 1: Gebruik een online tool (makkelijkst!)
----------------------------------------
1. Ga naar https://tinyjpg.com/
2. Sleep deze bestanden erin:
   - lego_auto/ir_sensor_aan_lego/ir_0.jpg (6.9MB)
   - lego_auto/ir_sensor_aan_lego/ir_1.jpg (7.5MB)
   - lego_auto/ir_sensor_aan_lego/ir_2.jpg (2.1MB)
3. Download de gecomprimeerde versies
4. Vervang de originele bestanden

OPTIE 2: Installeer sharp en gebruik dit script
----------------------------------------
1. Installeer sharp: npm install sharp
2. Run dit script opnieuw: node compress-images.js

Let op: Sharp werkt het beste op systemen met build tools.
Als je een foutmelding krijgt, gebruik dan OPTIE 1!

`);

// Check if sharp is available
try {
  const sharp = require('sharp');

  console.log('✓ Sharp gevonden! Bezig met comprimeren...\n');

  const files = fs.readdirSync(imageDir)
    .filter(file => file.match(/\.(jpg|jpeg|png)$/i));

  if (files.length === 0) {
    console.log('Geen afbeeldingen gevonden in', imageDir);
    process.exit(0);
  }

  let processed = 0;

  files.forEach(async (file) => {
    const inputPath = path.join(imageDir, file);
    const backupPath = path.join(imageDir, `${file}.backup`);
    const outputPath = path.join(imageDir, file);

    // Get original size
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);

    // Create backup
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }

    // Compress
    await sharp(inputPath)
      .resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: quality })
      .toFile(outputPath + '.tmp');

    // Replace original
    fs.renameSync(outputPath + '.tmp', outputPath);

    // Get new size
    const newStats = fs.statSync(outputPath);
    const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`✓ ${file}`);
    console.log(`  ${originalSizeMB}MB → ${newSizeMB}MB (${savings}% kleiner)`);

    processed++;

    if (processed === files.length) {
      console.log(`\n✓ Klaar! ${processed} afbeeldingen gecomprimeerd.`);
      console.log('  Backups opgeslagen als .backup bestanden');
    }
  });

} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('Sharp is nog niet geïnstalleerd.');
    console.log('\nInstalleer met: npm install sharp');
    console.log('\nOf gebruik OPTIE 1 (TinyJPG) - dat is vaak makkelijker!\n');
  } else {
    console.error('Fout:', e.message);
  }
}
