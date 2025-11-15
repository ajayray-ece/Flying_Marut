# Images Directory

Place your game images here:

## Required Images

1. **player.png** - Your cartoon character image that will be used as the player
   - Recommended size: 120x120px to 200x200px
   - Format: PNG (with transparency) or JPG
   - The image will be automatically resized to fit the game
   - If image is not found, a simple placeholder will be shown

2. **marut.jpg** - Image that will be displayed when the game ends
   - Recommended size: 400-600px width
   - Format: JPG, PNG, or GIF
   - This image appears in the game over screen

## Image Requirements

### Player Image (player.png)
- **Size**: Square images work best (e.g., 120x120, 150x150, 200x200)
- **Format**: PNG with transparency is recommended for best results
- **Background**: Transparent background works best
- **Style**: Cartoon/animated character facing right or forward

### Game Over Image (marut.jpg)
- **Size**: 400-600px width recommended
- **Format**: JPG, PNG, or GIF
- **Aspect Ratio**: Any ratio works, will be auto-scaled

## How to Add Your Images

1. Place your player image in this `images/` folder
2. Name it `player.png` (or update the path in game.js line ~50)
3. Place your game over image here
4. Name it `marut.jpg` (or update the path in index.html)

The images will automatically load when the game starts. If an image doesn't exist, the game will use a fallback placeholder.
