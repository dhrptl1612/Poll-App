from PIL import Image, ImageDraw, ImageFont
import textwrap, os, hashlib, tempfile

def generate_og_image(poll) -> str:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (245, 245, 245))
    d = ImageDraw.Draw(img)

    # Title bar
    d.rectangle([0, 0, W, 120], fill=(33, 150, 243))
    title = "QuickPoll"
    d.text((40, 35), title, fill=(255,255,255), font=_font(64))

    # Question text
    q = f"Q: {poll.question}"
    wrapped = textwrap.fill(q, width=40)
    d.text((60, 180), wrapped, fill=(20, 20, 20), font=_font(48))

    # Footer
    d.text((60, H-80), "Vote now →", fill=(33,150,243), font=_font(40))

    # Save to temp
    tmpdir = tempfile.gettempdir()
    fname = os.path.join(tmpdir, f"og_{poll.id}.png")
    img.save(fname, "PNG")
    return fname

def _font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except:
        return ImageFont.load_default()
