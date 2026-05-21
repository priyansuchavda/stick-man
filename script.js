var gameTimerDuration = 30; // Default timer duration in seconds

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
    return this[this.length - 1];
  };
  
  // A sinus function that acceps degrees instead of radians
  Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
  };
  
  // Game data
  let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
  let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle
  
  let heroX; // Changes when moving forward
  let heroY; // Only changes when falling
  let sceneOffset; // Moves the whole game
  
  let platforms = [];
  let sticks = [];
  let trees = [];
  
  // Todo: Save high score to localStorage (?)
  
  let score = 0;
  let gameTimer = 30; // 30 seconds countdown
  let timerStartTime = null;
  let isTimerRunning = false;
  
  // Configuration
  const canvasWidth = 375;
  const canvasHeight = 375;
  const platformHeight = 100;
  const heroDistanceFromEdge = 10; // While waiting
  const paddingX = 100; // The waiting position of the hero in from the original canvas size
  const perfectAreaSize = 10;
  
  // The background moves slower than the hero
  const backgroundSpeedMultiplier = 0.2;
  
  const hill1BaseHeight = 100;
  const hill1Amplitude = 10;
  const hill1Stretch = 1;
  const hill2BaseHeight = 70;
  const hill2Amplitude = 20;
  const hill2Stretch = 0.5;
  
  const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
  const turningSpeed = 4; // Milliseconds it takes to turn a degree
  const walkingSpeed = 4;
  const transitioningSpeed = 2;
  const fallingSpeed = 2;
  
  const heroWidth = 17; // 24
  const heroHeight = 30; // 40
  
  const canvas = document.getElementById("game");
  canvas.width = window.innerWidth; // Make the Canvas full screen
  canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext("2d");
  
  const introductionElement = document.getElementById("introduction");
  const perfectElement = document.getElementById("perfect");
  const restartButton = document.getElementById("restart");
  const scoreElement = document.getElementById("score");
  const timerElement = document.getElementById("timer");
  const startScreen = document.getElementById("startScreen");
  const playButton = document.getElementById("playButton");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScoreElement = document.getElementById("finalScore");
  const backButton = document.getElementById("backButton");
  const gameTitle = document.getElementById("gameTitle");
  
  // Show/hide play button
  function showPlayButton() {
    playButton.style.display = 'block';
    if (gameTitle) {
      gameTitle.textContent = 'STICK MAN';
    }
  }
  
  function hidePlayButton() {
    playButton.style.display = 'none';
  }

  // Show/hide back button
  function showBackButton() {
    if (backButton) {
      backButton.style.display = 'block';
    }
  }
  
  function hideBackButton() {
    if (backButton) {
      backButton.style.display = 'none';
    }
  }
  
  // Initialize layout
  resetGame();
  
  // Keep game drawing continuously in background
  function continuousDraw() {
    draw();
    window.requestAnimationFrame(continuousDraw);
  }
  
  // Start continuous drawing for background
  window.requestAnimationFrame(continuousDraw);
  
  // Handle play button click/touch
  function handlePlay(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Make sure we're not in stretching phase when starting
    if (phase === "stretching") {
      phase = "waiting";
    }
    startScreen.classList.add("hidden");
    setTimeout(() => {
      startScreen.style.display = "none";
    }, 500); // Wait for fade out transition
    
    // Start the timer
    gameTimer = gameTimerDuration;
    timerStartTime = Date.now();
    isTimerRunning = true;
    timerElement.style.display = "block";
    updateTimerDisplay();
  }
  
  // Update timer display
  function updateTimerDisplay() {
    const remainingTime = Math.ceil(gameTimer);
    timerElement.innerText = remainingTime;
    
    // Change color when time is running low
    if (remainingTime <= 5) {
      timerElement.style.color = "#FF0000";
      timerElement.style.animation = "pulse 0.5s infinite";
    } else if (remainingTime <= 10) {
      timerElement.style.color = "#FFA500";
    } else {
      timerElement.style.color = "#FFFFFF";
      timerElement.style.animation = "none";
    }
  }
  
  // End game due to timer
  function endGameByTimer() {
    if (isTimerRunning) {
      isTimerRunning = false;
      showBackButton();
      
      const gameOverTitle = document.getElementById("gameOverTitle");
      if (gameOverTitle) {
        gameOverTitle.textContent = 'GAME OVER';
      }
      
      finalScoreElement.innerText = score;
      gameOverScreen.classList.add("visible");
    }
  }
  
  playButton.addEventListener("click", handlePlay);
  playButton.addEventListener("touchend", handlePlay);
  
  // Resets game variables and layouts but does not start the game (game starts on keypress)
  function resetGame() {
    // Reset game progress
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;
  
    introductionElement.style.opacity = 1;
    perfectElement.style.opacity = 0;
    restartButton.style.display = "none";
    gameOverScreen.classList.remove("visible");
    scoreElement.innerText = score;
    
    // Reset timer
    gameTimer = gameTimerDuration;
    timerStartTime = null;
    isTimerRunning = false;
    timerElement.style.display = "none";
    
    showPlayButton();
  
    // The first platform is always the same
    // x + w has to match paddingX
    platforms = [{ x: 50, w: 50 }];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();
  
    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  
    trees = [];
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
  
    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;
  
    draw();
  }
  
  function generateTree() {
    const minimumGap = 30;
    const maximumGap = 150;
  
    // X coordinate of the right edge of the furthest tree
    const lastTree = trees[trees.length - 1];
    let furthestX = lastTree ? lastTree.x : 0;
  
    const x =
      furthestX +
      minimumGap +
      Math.floor(Math.random() * (maximumGap - minimumGap));
  
    const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    const color = treeColors[Math.floor(Math.random() * 3)];
  
    trees.push({ x, color });
  }
  
  function generatePlatform() {
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 20;
    const maximumWidth = 100;
  
    // X coordinate of the right edge of the furthest platform
    const lastPlatform = platforms[platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;
  
    const x =
      furthestX +
      minimumGap +
      Math.floor(Math.random() * (maximumGap - minimumGap));
    const w =
      minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
  
    platforms.push({ x, w });
  }
  
  resetGame();
  
  // If space was pressed restart the game
  window.addEventListener("keydown", function (event) {
    if (event.key == " ") {
      event.preventDefault();
      resetGame();
      return;
    }
  });
  
  // Mouse events for desktop
  window.addEventListener("mousedown", function (event) {
    // Don't handle if any overlay screen is visible
    if (isOverlayVisible()) {
      return;
    }
    if (phase == "waiting") {
      lastTimestamp = undefined;
      introductionElement.style.opacity = 0;
      phase = "stretching";
      window.requestAnimationFrame(animate);
    }
  });
  
  window.addEventListener("mouseup", function (event) {
    // Don't handle if any overlay screen is visible
    if (isOverlayVisible()) {
      return;
    }
    if (phase == "stretching") {
      phase = "turning";
    }
  });

  // Track if touch is active to prevent multiple touches
  let isTouching = false;
  
  // Helper function to check if start screen is visible
  function isStartScreenVisible() {
    return !startScreen.classList.contains("hidden") && startScreen.style.display !== "none";
  }
  
  // Helper function to check if game over screen is visible
  function isGameOverScreenVisible() {
    return gameOverScreen.classList.contains("visible");
  }
  
  // Helper function to check if any overlay screen is visible
  function isOverlayVisible() {
    return isStartScreenVisible() || isGameOverScreenVisible();
  }
  
  // Touch events for mobile
  window.addEventListener("touchstart", function (event) {
    // Don't handle if any overlay screen is visible
    if (isOverlayVisible()) {
      return;
    }
    event.preventDefault(); // Prevent scrolling and other default behaviors
    if (phase == "waiting" && !isTouching) {
      isTouching = true;
      lastTimestamp = undefined;
      introductionElement.style.opacity = 0;
      phase = "stretching";
      window.requestAnimationFrame(animate);
    }
  }, { passive: false });
  
  window.addEventListener("touchend", function (event) {
    // Don't handle if any overlay screen is visible
    if (isOverlayVisible()) {
      isTouching = false;
      return;
    }
    event.preventDefault(); // Prevent default touch behaviors
    isTouching = false;
    if (phase == "stretching") {
      phase = "turning";
    }
  }, { passive: false });

  window.addEventListener("touchcancel", function (event) {
    // Don't handle if any overlay screen is visible
    if (isOverlayVisible()) {
      isTouching = false;
      return;
    }
    event.preventDefault(); // Handle touch cancellation (e.g., when scrolling starts)
    isTouching = false;
    if (phase == "stretching") {
      phase = "turning";
    }
  }, { passive: false });
  
  window.addEventListener("resize", function (event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  });
  
  window.requestAnimationFrame(animate);
  
  // The main game loop
  function animate(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
      window.requestAnimationFrame(animate);
      return;
    }
    
    // Update timer if running
    if (isTimerRunning && timerStartTime !== null) {
      const elapsed = (Date.now() - timerStartTime) / 1000; // Convert to seconds
      gameTimer = gameTimerDuration - elapsed;
      
      if (gameTimer <= 0) {
        gameTimer = 0;
        endGameByTimer();
        return; // Stop animation
      }
      
      updateTimerDisplay();
    }
  
    switch (phase) {
      case "waiting":
        // Don't update game logic, but keep the loop running
        // draw() is handled by continuousDraw() to keep background visible
        window.requestAnimationFrame(animate);
        return;
      case "stretching": {
        sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
        break;
      }
      case "turning": {
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
  
        if (sticks.last().rotation > 90) {
          sticks.last().rotation = 90;
  
          const [nextPlatform, perfectHit] = thePlatformTheStickHits();
          if (nextPlatform) {
            // Increase score
            score += perfectHit ? 2 : 1;
            scoreElement.innerText = score;
  
            if (perfectHit) {
              perfectElement.style.opacity = 1;
              setTimeout(() => (perfectElement.style.opacity = 0), 1000);
            }
  
            generatePlatform();
            generateTree();
            generateTree();
          }
  
          phase = "walking";
        }
        break;
      }
      case "walking": {
        heroX += (timestamp - lastTimestamp) / walkingSpeed;
  
        const [nextPlatform] = thePlatformTheStickHits();
        if (nextPlatform) {
          // If hero will reach another platform then limit it's position at it's edge
          const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
          if (heroX > maxHeroX) {
            heroX = maxHeroX;
            phase = "transitioning";
          }
        } else {
          // If hero won't reach another platform then limit it's position at the end of the pole
          const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
          if (heroX > maxHeroX) {
            heroX = maxHeroX;
            phase = "falling";
          }
        }
        break;
      }
      case "transitioning": {
        sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
  
        const [nextPlatform] = thePlatformTheStickHits();
        if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
          // Add the next step
          sticks.push({
            x: nextPlatform.x + nextPlatform.w,
            length: 0,
            rotation: 0
          });
          phase = "waiting";
        }
        break;
      }
      case "falling": {
        if (sticks.last().rotation < 180)
          sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
  
        heroY += (timestamp - lastTimestamp) / fallingSpeed;
        const maxHeroY =
          platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
        if (heroY > maxHeroY) {
          // Stop timer and show game over screen
          isTimerRunning = false;
          showBackButton();
          
          const gameOverTitle = document.getElementById("gameOverTitle");
          if (gameOverTitle) {
            gameOverTitle.textContent = 'GAME OVER';
          }
          
          finalScoreElement.innerText = score;
          gameOverScreen.classList.add("visible");
          
          return;
        }
        break;
      }
      default:
        throw Error("Wrong phase");
    }
  
    // draw() is handled by continuousDraw() to keep background visible
    window.requestAnimationFrame(animate);
  
    lastTimestamp = timestamp;
  }
  
  // Returns the platform the stick hit (if it didn't hit any stick then return undefined)
  function thePlatformTheStickHits() {
    if (sticks.last().rotation != 90)
      throw Error(`Stick is ${sticks.last().rotation}°`);
    const stickFarX = sticks.last().x + sticks.last().length;
  
    const platformTheStickHits = platforms.find(
      (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );
  
    // If the stick hits the perfect area
    if (
      platformTheStickHits &&
      platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
        stickFarX &&
      stickFarX <
        platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
    )
      return [platformTheStickHits, true];
  
    return [platformTheStickHits, false];
  }
  
  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
    drawBackground();
  
    // Center main canvas area to the middle of the screen
    ctx.translate(
      (window.innerWidth - canvasWidth) / 2 - sceneOffset,
      (window.innerHeight - canvasHeight) / 2
    );
  
    // Draw scene
    drawPlatforms();
    drawHero();
    drawSticks();
  
    // Restore transformation
    ctx.restore();
  }
  
  function handleRestart(event) {
    event.preventDefault();
    event.stopPropagation();
    resetGame();
    restartButton.style.display = "none";
  }

  restartButton.addEventListener("click", handleRestart);
  restartButton.addEventListener("touchend", handleRestart);
  
  // Handle back button - go back to start screen
  function handleBack(event) {
    event.preventDefault();
    event.stopPropagation();
    gameOverScreen.classList.remove("visible");
    startScreen.classList.remove("hidden");
    startScreen.style.display = "flex";
    resetGame();
    return false;
  }
  
  backButton.addEventListener("click", handleBack);
  backButton.addEventListener("touchend", handleBack);
  
  function drawPlatforms() {
    platforms.forEach(({ x, w }) => {
      // Draw platform
      ctx.fillStyle = "black";
      ctx.fillRect(
        x,
        canvasHeight - platformHeight,
        w,
        platformHeight + (window.innerHeight - canvasHeight) / 2
      );
  
      // Draw perfect area only if hero did not yet reach the platform
      if (sticks.last().x < x) {
        ctx.fillStyle = "red";
        ctx.fillRect(
          x + w / 2 - perfectAreaSize / 2,
          canvasHeight - platformHeight,
          perfectAreaSize,
          perfectAreaSize
        );
      }
    });
  }
  
  function drawHero() {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.translate(
      heroX - heroWidth / 2,
      heroY + canvasHeight - platformHeight - heroHeight / 2
    );
  
    // Body
    drawRoundedRect(
      -heroWidth / 2,
      -heroHeight / 2,
      heroWidth,
      heroHeight - 4,
      5
    );
  
    // Legs
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
  
    // Eye
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    ctx.fill();
  
    // Band
    ctx.fillStyle = "red";
    ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();
  
    ctx.restore();
  }
  
  function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
  }
  
  function drawSticks() {
    sticks.forEach((stick) => {
      ctx.save();
  
      // Move the anchor point to the start of the stick and rotate
      ctx.translate(stick.x, canvasHeight - platformHeight);
      ctx.rotate((Math.PI / 180) * stick.rotation);
  
      // Draw stick
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -stick.length);
      ctx.stroke();
  
      // Restore transformations
      ctx.restore();
    });
  }
  
  function drawBackground() {
    // Draw sky
    var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#BBD691");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
    // Draw hills
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");
  
    // Draw trees
    trees.forEach((tree) => drawTree(tree.x, tree.color));
  }
  
  // A hill is a shape under a stretched out sinus wave
  function drawHill(baseHeight, amplitude, stretch, color) {
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
    for (let i = 0; i < window.innerWidth; i++) {
      ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  function drawTree(x, color) {
    ctx.save();
    ctx.translate(
      (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
      getTreeY(x, hill1BaseHeight, hill1Amplitude)
    );
  
    const treeTrunkHeight = 5;
    const treeTrunkWidth = 2;
    const treeCrownHeight = 25;
    const treeCrownWidth = 10;
  
    // Draw trunk
    ctx.fillStyle = "#7D833C";
    ctx.fillRect(
      -treeTrunkWidth / 2,
      -treeTrunkHeight,
      treeTrunkWidth,
      treeTrunkHeight
    );
  
    // Draw crown
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();
  
    ctx.restore();
  }
  
  function getHillY(windowX, baseHeight, amplitude, stretch) {
    const sineBaseY = window.innerHeight - baseHeight;
    return (
      Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
        amplitude +
      sineBaseY
    );
  }
  
  function getTreeY(x, baseHeight, amplitude) {
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sinus(x) * amplitude + sineBaseY;
  }
  
