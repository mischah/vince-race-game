/**
 * This script helps the race game maintain its aspect ratio when embedded in iframes with fixed height.
 * It should be included in the parent page that embeds the game.
 */

// Function to adjust iframe contents to maintain aspect ratio
function adjustRaceGameScale() {
  // Find all iframes that might contain our game
  const iframes = globalThis.document.querySelectorAll('iframe');
  
  iframes.forEach(iframe => {
    try {
      // Check if this iframe contains our game component
      const gameElement = iframe.contentDocument?.querySelector('race-game');
      
      if (gameElement) {
        const gameArea = gameElement.shadowRoot?.querySelector('#game-area');
        const gameContainer = gameElement.shadowRoot?.querySelector('#game-container');
        
        if (gameArea && gameContainer) {
          // Get iframe dimensions
          const iframeWidth = iframe.clientWidth;
          const iframeHeight = iframe.clientHeight;
          
          // Original game dimensions
          const originalWidth = 600;
          const originalHeight = 800;
          
          // Calculate scale
          let scale;
          if (iframeWidth / iframeHeight > originalWidth / originalHeight) {
            // Iframe is wider than game aspect ratio - scale based on height
            scale = iframeHeight / originalHeight;
          } else {
            // Iframe is taller than game aspect ratio - scale based on width
            scale = iframeWidth / originalWidth;
          }
          
          // Apply scale
          gameArea.style.transform = `scale(${scale})`;
          gameArea.style.transformOrigin = 'top left';
          
          // Fix container size to match scaled content
          gameContainer.style.width = `${originalWidth * scale}px`;
          gameContainer.style.height = `${originalHeight * scale}px`;
        }
      }
    } catch {
      // Ignore cross-origin iframe errors
      globalThis.console.log('Could not access iframe content, might be cross-origin');
    }
  });
}

// Run on load and resize
globalThis.addEventListener('load', adjustRaceGameScale);
globalThis.addEventListener('resize', adjustRaceGameScale);

// Try to run periodically in case iframe loads later
globalThis.setInterval(adjustRaceGameScale, 2000);
