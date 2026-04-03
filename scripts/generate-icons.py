#!/usr/bin/env python3
"""
Slot Machine Icon Generator - ComfyUI Qwen-Image Version
Uses Qwen-Image model for text-in-image capability
"""

import os
import json
import time
import argparse
import uuid
import random
import urllib.request
import urllib.parse
from pathlib import Path

# Configuration
COMFY_URL = os.getenv("COMFY_URL", "http://10.10.10.12:8188")
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "images" / "generated-icons"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Qwen-Image settings
WIDTH = 512
HEIGHT = 512
STEPS = 8
CFG = 1

# Base style - 3D low poly on plain white background, NO shadows, NO borders
BASE_STYLE = "3d low poly style, low polygon art, faceted geometric, game icon, centered, plain white background, pure white background #FFFFFF, clean render, isolated single object, no shadows, no border, no outline, no reflection, no floor, floating object"
NEGATIVE = "shadows, border, outline, frame, reflection, floor, ground, dark background, gradient background"

# Icon definitions - can now include text!
ICONS = [
    {"id": 1, "name": "10", "prompt": "large golden 3d text showing '10', metallic gold number, single centered number"},
    {"id": 2, "name": "J", "prompt": "large golden 3d text showing letter 'J', metallic gold letter, single centered letter"},
    {"id": 3, "name": "Q", "prompt": "large golden 3d text showing letter 'Q', metallic gold letter, single centered letter"},
    {"id": 4, "name": "K", "prompt": "large golden 3d text showing letter 'K', metallic gold letter, single centered letter"},
    {"id": 5, "name": "A", "prompt": "large golden 3d text showing letter 'A', metallic gold letter, single centered letter"},
    {"id": 6, "name": "opal_gem", "prompt": "single opal gemstone, iridescent rainbow opal, polished faceted gem"},
    {"id": 7, "name": "sapphire_gem", "prompt": "single blue sapphire gem, deep blue faceted crystal, brilliant cut"},
    {"id": 8, "name": "emerald_gem", "prompt": "single green emerald gem, vivid green faceted crystal, brilliant cut"},
    {"id": 9, "name": "diamond_gem", "prompt": "single brilliant diamond, clear sparkling faceted crystal gem"},
    {"id": 10, "name": "ruby_gem", "prompt": "single red ruby gem, deep crimson faceted crystal, brilliant cut"},
    {"id": 11, "name": "money_bag", "prompt": "single money bag icon, brown burlap sack with '$' dollar sign on it"},
    {"id": 12, "name": "cash_symbol", "prompt": "large golden 3d '$' dollar sign, metallic gold symbol"},
    {"id": 13, "name": "golden_coin", "prompt": "single golden coin, shiny gold treasure coin with star emblem"},
    {"id": 14, "name": "silver_coin", "prompt": "single silver coin, shiny platinum coin with diamond emblem"},
    {"id": 15, "name": "bank", "prompt": "miniature bank building icon, classical facade with columns and dome"},
    {"id": 16, "name": "fireball", "prompt": "single fireball, blazing orange fire sphere, magical flame orb"},
    {"id": 17, "name": "lightning_bolt", "prompt": "single lightning bolt icon, bright yellow electric bolt"},
    {"id": 18, "name": "water_droplet", "prompt": "single water droplet, blue crystal clear water drop"},
    {"id": 19, "name": "mining_pick", "prompt": "single mining pickaxe icon, crossed golden pickaxes"},
    {"id": 20, "name": "gold_nugget", "prompt": "single gold nugget, raw shiny gold ore chunk"},
    {"id": 21, "name": "moon", "prompt": "single crescent moon icon, silver glowing moon"},
    {"id": 22, "name": "sun", "prompt": "single golden sun icon, radiant sun with rays"},
]


def get_qwen_workflow(prompt: str, negative: str, seed: int) -> dict:
    """Generate ComfyUI workflow for Qwen-Image txt2img."""
    return {
        "60": {
            "inputs": {
                "filename_prefix": "slot_icon",
                "images": ["76:8", 0]
            },
            "class_type": "SaveImage"
        },
        "76:39": {
            "inputs": {
                "vae_name": "qwen_image_vae.safetensors"
            },
            "class_type": "VAELoader"
        },
        "76:38": {
            "inputs": {
                "clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
                "type": "qwen_image",
                "device": "default"
            },
            "class_type": "CLIPLoader"
        },
        "76:58": {
            "inputs": {
                "width": WIDTH,
                "height": HEIGHT,
                "batch_size": 1
            },
            "class_type": "EmptySD3LatentImage"
        },
        "76:66": {
            "inputs": {
                "shift": 3.1,
                "model": ["76:73", 0]
            },
            "class_type": "ModelSamplingAuraFlow"
        },
        "76:37": {
            "inputs": {
                "unet_name": "qwen_image_fp8_e4m3fn.safetensors",
                "weight_dtype": "default"
            },
            "class_type": "UNETLoader"
        },
        "76:6": {
            "inputs": {
                "text": prompt,
                "clip": ["76:38", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "76:7": {
            "inputs": {
                "text": negative,
                "clip": ["76:38", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "76:8": {
            "inputs": {
                "samples": ["76:3", 0],
                "vae": ["76:39", 0]
            },
            "class_type": "VAEDecode"
        },
        "76:73": {
            "inputs": {
                "lora_name": "Qwen-Image-Lightning-8steps-V1.0.safetensors",
                "strength_model": 1,
                "model": ["76:37", 0]
            },
            "class_type": "LoraLoaderModelOnly"
        },
        "76:3": {
            "inputs": {
                "seed": seed,
                "steps": STEPS,
                "cfg": CFG,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["76:66", 0],
                "positive": ["76:6", 0],
                "negative": ["76:7", 0],
                "latent_image": ["76:58", 0]
            },
            "class_type": "KSampler"
        }
    }


def queue_prompt(workflow: dict) -> str:
    """Queue a prompt and return the prompt_id."""
    p = {"prompt": workflow, "client_id": str(uuid.uuid4())}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())['prompt_id']


def wait_for_completion(prompt_id: str, timeout: int = 180) -> dict:
    """Wait for prompt to complete and return history."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = urllib.request.urlopen(f"{COMFY_URL}/history/{prompt_id}")
            history = json.loads(resp.read())
            if prompt_id in history:
                return history[prompt_id]
        except:
            pass
        time.sleep(1)
    raise TimeoutError(f"Prompt {prompt_id} timed out after {timeout}s")


def get_image(filename: str, subfolder: str, folder_type: str) -> bytes:
    """Download generated image from ComfyUI."""
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
    resp = urllib.request.urlopen(f"{COMFY_URL}/view?{params}")
    return resp.read()


def check_api() -> bool:
    """Check if ComfyUI API is available."""
    try:
        resp = urllib.request.urlopen(f"{COMFY_URL}/system_stats", timeout=5)
        return resp.status == 200
    except:
        return False


def generate_icon(icon: dict) -> dict:
    """Generate a single icon using ComfyUI Qwen-Image API."""
    full_prompt = f"{icon['prompt']}, {BASE_STYLE}"
    seed = random.randint(0, 2**32 - 1)
    
    print(f"\n🎨 Generating icon {icon['id']}: {icon['name']}")
    print(f"   Prompt: {icon['prompt'][:50]}...")
    
    try:
        workflow = get_qwen_workflow(full_prompt, NEGATIVE, seed)
        prompt_id = queue_prompt(workflow)
        print(f"   Queued: {prompt_id[:8]}...")
        
        history = wait_for_completion(prompt_id)
        
        # Get output image
        outputs = history.get('outputs', {})
        if '60' in outputs and 'images' in outputs['60']:
            img_info = outputs['60']['images'][0]
            image_data = get_image(img_info['filename'], img_info.get('subfolder', ''), img_info['type'])
            
            output_filename = f"icon_{icon['id']}.png"
            output_path = OUTPUT_DIR / output_filename
            output_path.write_bytes(image_data)
            
            print(f"   ✅ Saved: {output_filename} ({len(image_data)//1024}KB)")
            return {"success": True, "icon": icon, "path": str(output_path)}
        else:
            raise Exception("No output image found")
            
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return {"success": False, "icon": icon, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Generate slot machine icons with ComfyUI Qwen-Image")
    parser.add_argument("--test", action="store_true", help="Test mode: generate only 1 icon")
    parser.add_argument("--icon", type=int, help="Generate specific icon by ID")
    parser.add_argument("--list", action="store_true", help="List all icons")
    parser.add_argument("--text-only", action="store_true", help="Generate only text icons (10, J, Q, K, A)")
    args = parser.parse_args()
    
    print("🎰 Slot Machine Icon Generator (Qwen-Image)")
    print("=" * 50)
    
    if args.list:
        print("\nAvailable icons:")
        for icon in ICONS:
            print(f"  {icon['id']:2d}. {icon['name']}")
        return
    
    # Check API
    print(f"\n🔌 Checking ComfyUI API at {COMFY_URL}...")
    if not check_api():
        print("\n❌ ComfyUI API not available!")
        return
    print("   ✅ API connected")
    
    # Determine which icons to generate
    icons_to_generate = ICONS
    
    if args.test:
        icons_to_generate = [ICONS[0]]  # Test with "10" to check text rendering
        print("\n🧪 TEST MODE: Generating only 1 icon (10)")
    elif args.text_only:
        icons_to_generate = ICONS[:5]  # 10, J, Q, K, A
        print("\n📝 TEXT-ONLY MODE: Generating 5 text icons")
    elif args.icon:
        icon = next((i for i in ICONS if i["id"] == args.icon), None)
        if not icon:
            print(f"❌ Icon ID {args.icon} not found")
            return
        icons_to_generate = [icon]
        print(f"\n🎯 Generating single icon: {icon['name']}")
    else:
        print(f"\n📦 Generating {len(ICONS)} icons...")
    
    # Generate icons
    results = []
    for icon in icons_to_generate:
        result = generate_icon(icon)
        results.append(result)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 GENERATION SUMMARY")
    print("=" * 50)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    print(f"✅ Successful: {len(successful)}")
    print(f"❌ Failed: {len(failed)}")
    
    if failed:
        print("\nFailed icons:")
        for f in failed:
            print(f"   - {f['icon']['name']}: {f['error']}")
    
    print(f"\n📁 Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
