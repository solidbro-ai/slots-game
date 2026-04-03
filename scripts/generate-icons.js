#!/usr/bin/env node
/**
 * Slot Machine Icon Generator
 * Uses Stable Diffusion WebUI API to generate all game icons
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const SD_API_URL = 'http://127.0.0.1:7860';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'generated-icons');
const FINAL_DIR = path.join(__dirname, '..', 'public', 'images');

// Generation settings
const SETTINGS = {
  width: 512,
  height: 512,
  steps: 30,
  cfg_scale: 7.5,
  sampler_name: 'DPM++ 2M Karras',
  seed: -1, // Random
};

// Base style prompt (SD keyword style)
const BASE_STYLE = [
  'slot machine game icon',
  'casino game asset',
  'glossy 3d render',
  'vibrant colors',
  'high contrast',
  'polished premium look',
  'soft highlights',
  'rim lighting',
  'smooth gradients',
  'centered composition',
  'simple clean background',
  'radial glow background',
  'crisp edges',
  'dramatic lighting',
  'game ui asset',
  'mobile game style',
  'digital art',
  'highly detailed',
  'professional quality',
  '4k',
  'sharp focus',
].join(', ');

// Negative prompt
const NEGATIVE_PROMPT = [
  'text',
  'watermark',
  'signature',
  'blurry',
  'low quality',
  'pixelated',
  'noisy',
  'grainy',
  'cluttered',
  'busy background',
  'multiple objects',
  'deformed',
  'ugly',
  'amateur',
  'poorly lit',
  'flat lighting',
  'dull colors',
].join(', ');

// Icon definitions with specific prompts
const ICONS = [
  { id: 1, name: '10', prompt: 'golden number 10, metallic gold text, ornate casino style number, shiny gold material' },
  { id: 2, name: 'J', prompt: 'golden letter J, metallic gold text, ornate casino style letter, royal jack symbol, shiny gold material' },
  { id: 3, name: 'Q', prompt: 'golden letter Q, metallic gold text, ornate casino style letter, royal queen symbol, shiny gold material' },
  { id: 4, name: 'K', prompt: 'golden letter K, metallic gold text, ornate casino style letter, royal king symbol, shiny gold material' },
  { id: 5, name: 'A', prompt: 'golden letter A, metallic gold text, ornate casino style letter, ace symbol, shiny gold material' },
  { id: 6, name: 'opal_gem', prompt: 'opal gemstone, iridescent opal, rainbow colors, polished gem, faceted crystal, precious stone, sparkling' },
  { id: 7, name: 'sapphire_gem', prompt: 'blue sapphire gemstone, deep blue crystal, faceted gem, precious stone, brilliant cut, sparkling blue' },
  { id: 8, name: 'emerald_gem', prompt: 'green emerald gemstone, vivid green crystal, faceted gem, precious stone, brilliant cut, sparkling green' },
  { id: 9, name: 'diamond_gem', prompt: 'brilliant diamond, clear crystal, faceted diamond, sparkling white gem, precious stone, rainbow reflections' },
  { id: 10, name: 'ruby_gem', prompt: 'red ruby gemstone, deep red crystal, faceted gem, precious stone, brilliant cut, sparkling red' },
  { id: 11, name: 'money_bag', prompt: 'money bag, burlap sack with dollar sign, overflowing with gold coins, treasure bag, rich wealthy symbol' },
  { id: 12, name: 'cash_symbol', prompt: 'golden dollar sign, 3d metallic dollar symbol, shiny gold money symbol, wealth icon, $ sign' },
  { id: 13, name: 'golden_coin', prompt: 'golden coin, shiny gold coin, treasure coin, pirate gold, stacked coins, wealth symbol, metallic gold' },
  { id: 14, name: 'silver_coin', prompt: 'silver coin, shiny silver coin, metallic platinum, treasure coin, wealth symbol, chrome finish' },
  { id: 15, name: 'bank', prompt: 'bank building, classical bank facade, columns, golden bank, financial institution, treasure vault, grand architecture' },
  { id: 16, name: 'fireball', prompt: 'fireball, blazing fire sphere, orange flames, magical fire orb, burning energy, glowing hot, fire element' },
  { id: 17, name: 'lightning_bolt', prompt: 'lightning bolt, electric yellow bolt, thunder strike, energy symbol, glowing electricity, power symbol, storm' },
  { id: 18, name: 'water_droplet', prompt: 'water droplet, blue water drop, crystal clear water, liquid splash, aqua element, refreshing drop, translucent' },
  { id: 19, name: 'mining_pick', prompt: 'mining pickaxe, golden pickaxe, mining tool, miner equipment, gold mining pick, treasure hunting tool' },
  { id: 20, name: 'gold_nugget', prompt: 'gold nugget, raw gold chunk, shiny gold ore, treasure nugget, natural gold, mining treasure, pure gold' },
  { id: 21, name: 'moon', prompt: 'crescent moon, silver moon, glowing moonlight, mystical lunar, night sky moon, celestial moon, magical' },
  { id: 22, name: 'sun', prompt: 'golden sun, radiant sunburst, glowing sun rays, warm sunshine, celestial sun, solar symbol, bright rays' },
];

// Ensure output directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Make API request
async function apiRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SD_API_URL);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 7860,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body.slice(0, 200)}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(300000); // 5 minute timeout
    req.write(postData);
    req.end();
  });
}

// Generate a single icon
async function generateIcon(icon) {
  const fullPrompt = `${icon.prompt}, ${BASE_STYLE}`;
  
  console.log(`\n🎨 Generating icon ${icon.id}: ${icon.name}`);
  console.log(`   Prompt: ${icon.prompt.slice(0, 60)}...`);
  
  const payload = {
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    width: SETTINGS.width,
    height: SETTINGS.height,
    steps: SETTINGS.steps,
    cfg_scale: SETTINGS.cfg_scale,
    sampler_name: SETTINGS.sampler_name,
    seed: SETTINGS.seed,
    batch_size: 1,
    n_iter: 1,
  };
  
  try {
    const result = await apiRequest('/sdapi/v1/txt2img', payload);
    
    if (!result.images || result.images.length === 0) {
      throw new Error('No images in response');
    }
    
    // Save the image
    const imageData = Buffer.from(result.images[0], 'base64');
    const filename = `icon_${icon.id}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(outputPath, imageData);
    console.log(`   ✅ Saved: ${filename}`);
    
    return { success: true, icon, path: outputPath };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, icon, error: error.message };
  }
}

// Check if SD WebUI is running
async function checkAPI() {
  return new Promise((resolve) => {
    const req = http.get(`${SD_API_URL}/sdapi/v1/sd-models`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000);
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const iconId = args.find(a => a.startsWith('--icon='))?.split('=')[1];
  
  console.log('🎰 Slot Machine Icon Generator');
  console.log('═'.repeat(50));
  
  // Check API
  console.log('\n🔌 Checking SD WebUI API...');
  const apiReady = await checkAPI();
  
  if (!apiReady) {
    console.error('\n❌ SD WebUI API not available!');
    console.error('   Please start SD WebUI with API enabled:');
    console.error('   cd ~/sd-webui && ./webui.sh --api\n');
    process.exit(1);
  }
  
  console.log('   ✅ API connected');
  
  // Ensure output directory
  ensureDir(OUTPUT_DIR);
  
  // Determine which icons to generate
  let iconsToGenerate = ICONS;
  
  if (testMode) {
    iconsToGenerate = [ICONS[0]]; // Just generate first icon
    console.log('\n🧪 TEST MODE: Generating only 1 icon');
  } else if (iconId) {
    const icon = ICONS.find(i => i.id === parseInt(iconId));
    if (!icon) {
      console.error(`❌ Icon ID ${iconId} not found`);
      process.exit(1);
    }
    iconsToGenerate = [icon];
    console.log(`\n🎯 Generating single icon: ${icon.name}`);
  } else {
    console.log(`\n📦 Generating ${ICONS.length} icons...`);
  }
  
  // Generate icons
  const results = [];
  for (const icon of iconsToGenerate) {
    const result = await generateIcon(icon);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 GENERATION SUMMARY');
  console.log('═'.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed icons:');
    failed.forEach(f => console.log(`   - ${f.icon.name}: ${f.error}`));
  }
  
  console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
  
  if (testMode && successful.length > 0) {
    console.log('\n✅ Test successful! Run without --test to generate all icons:');
    console.log('   node scripts/generate-icons.js');
  }
}

main().catch(console.error);
