import os
import math
from PIL import Image, ImageDraw, ImageFont

def generate_og_image():
    width, height = 1200, 630
    os.makedirs('assets/images', exist_ok=True)
    out_path = 'assets/images/og-share.png'

    # Create background with subtle dark radial gradient
    img = Image.new('RGBA', (width, height), (14, 15, 18, 255))
    draw = ImageDraw.Draw(img)

    # Draw ambient golden aura in center-left
    cx, cy = 600, 240
    for r in range(450, 0, -5):
        alpha = int(24 * (1.0 - (r / 450.0)) ** 1.8)
        color = (212, 175, 55, alpha)
        draw.ellipse([cx - r, cy - r * 0.7, cx + r, cy + r * 0.7], fill=color)

    # Outer decorative luxury border
    border_gold = (212, 175, 55, 60)
    draw.rectangle([24, 24, width - 24, height - 24], outline=border_gold, width=1)
    draw.rectangle([32, 32, width - 32, height - 32], outline=(212, 175, 55, 120), width=1)

    # Corner accents
    for x in [32, width - 32]:
        for y in [32, height - 32]:
            dx = 16 if x == 32 else -16
            dy = 16 if y == 32 else -16
            draw.line([(x, y), (x + dx, y)], fill=(212, 175, 55, 200), width=2)
            draw.line([(x, y), (x, y + dy)], fill=(212, 175, 55, 200), width=2)

    # Paste emblem
    try:
        icon = Image.open('icons/icon-512x512.png').convert('RGBA')
        icon_size = 180
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        # Position icon centered above title
        icon_x = (width - icon_size) // 2
        icon_y = 75
        img.paste(icon, (icon_x, icon_y), icon)
    except Exception as e:
        print(f"Icon loading note: {e}")

    # Fonts
    # System fonts on macOS
    font_sans = None
    font_bold = None
    font_sub = None
    font_devanagari = None

    sans_paths = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf"
    ]
    for p in sans_paths:
        if os.path.exists(p):
            try:
                font_bold = ImageFont.truetype(p, 54)
                font_sub = ImageFont.truetype(p, 24)
                font_small = ImageFont.truetype(p, 20)
                font_devanagari = ImageFont.truetype(p, 36)
                break
            except Exception:
                pass

    if not font_bold:
        font_bold = ImageFont.load_default()
        font_sub = font_bold
        font_small = font_bold
        font_devanagari = font_bold

    # Draw Title: ShlokPath (श्लोकपथ)
    title_text = "ShlokPath • श्लोकपथ"
    draw.text((width // 2, 290), title_text, fill=(245, 240, 225, 255), font=font_bold, anchor="mm")

    # Draw Sanskrit invocation
    mantra = "॥ ॐ श्रीपरमात्मने नमः ॥"
    draw.text((width // 2, 360), mantra, fill=(212, 175, 55, 240), font=font_devanagari, anchor="mm")

    # Draw Subtitle
    subtitle = "Shrimad Bhagavad Gita — The Path of the Divine Verse"
    draw.text((width // 2, 420), subtitle, fill=(210, 205, 195, 230), font=font_sub, anchor="mm")

    # Feature badges pill container
    pills = "All 18 Canonical Chapters  •  701 Verses  •  432Hz Dhyana Tanpura  •  Parthasarathi AI"
    draw.text((width // 2, 490), pills, fill=(212, 175, 55, 220), font=font_small, anchor="mm")

    # URL Footer
    url_text = "shlokpath.vercel.app"
    draw.text((width // 2, 560), url_text, fill=(160, 155, 140, 180), font=font_small, anchor="mm")

    img.save(out_path, "PNG", optimize=True)
    print(f"Generated {out_path} ({width}x{height}) successfully.")

if __name__ == '__main__':
    generate_og_image()
