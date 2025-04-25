
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1.2;

const fruits = [];
const RADIUS = 30;

let waitingFruitX = 270;
let gameOver = false;
let dropping = false;
let moveLeft = false;
let moveRight = false;
let leftPressed = false;
let rightPressed = false;
let score = 0;

const FRUIT_TYPES = [
  "stella",
  "dana",
  "erwin",
  "jin",
  "lily",
  "chii",
  "haru",
  "ephnel",
  "iris",
  "leenabi",
  "grouton"
];





const FRUIT_IMAGES = {}; // ✅ 반드시 전역에 있어야 함






const FRUIT_COLORS = {
  stella: "#ffb6c1",
  dana: "#ffc0cb",
  erwin: "#ffa07a",
  jin: "#f4a460",
  lily: "#f5deb3",
  chii: "#dda0dd",
  haru: "#87cefa",
  ephnel: "#98fb98",
  iris: "#ff69b4",
  leenabi: "#cd5c5c",
  grouton: "#d2b48c"
};



// 왼쪽 벽
const wallLeft = Bodies.rectangle(0, 360, 10, 720, { isStatic: true });

// 오른쪽 벽
const wallRight = Bodies.rectangle(540, 360, 10, 720, { isStatic: true });

// 월드에 추가
World.add(world, [wallLeft, wallRight]);










const ground = Bodies.rectangle(270, 710, 540, 40, {  // 두께 20 → 40
  isStatic: true,
  friction: 10
  
});
World.add(world, ground);



let currentFruitType = getRandomFruitType();  // 지금 드랍할 과일



function getNextType(type) {
  const index = FRUIT_TYPES.indexOf(type);
  return index >= 0 && index < FRUIT_TYPES.length - 1 ? FRUIT_TYPES[index + 1] : null;
}



window.addEventListener("keydown", (e) => {
  if (gameOver) return;

  if (e.code === "KeyA" && !leftPressed) {
    moveLeft = true;
    leftPressed = true; // 👉 중복 방지용
  }

  if (e.code === "KeyD" && !rightPressed) {
    moveRight = true;
    rightPressed = true;
  }

  if (e.code === "Space" && !dropping && !gameOver) {
    createFruit(currentFruitType, waitingFruitX);  // ✅ 현재 과일 드랍
    currentFruitType = nextFruitType;              // ✅ 다음을 현재로
    nextFruitType = getRandomFruitType();          // ✅ 새로운 미리보기 설정
    dropping = true;
  
    setTimeout(() => {
      dropping = false;
    }, 500);
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyA") {
    moveLeft = false;
    leftPressed = false;
  }

  if (e.code === "KeyD") {
    moveRight = false;
    rightPressed = false;
  }
});


const MAX_SPEED = 8;           // 이동 속도 제한
const MAX_ANGULAR = 0.3;       // 회전 속도 제한


Events.on(engine, "collisionStart", (event) => {
  const pairs = event.pairs;
  for (let pair of pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;

    if (!a.fruitType || !b.fruitType) continue;
    if (a === b) continue;
    if (!fruits.includes(a) || !fruits.includes(b)) continue;

    // ✅ 속도 절반으로 줄인 뒤 상한선 적용
    for (const body of [a, b]) {
      let vx = body.velocity.x * 0.5;
      let vy = body.velocity.y * 0.5;
      let angular = body.angularVelocity * 0.5;

      // 속도 제한
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > MAX_SPEED) {
        const ratio = MAX_SPEED / speed;
        vx *= ratio;
        vy *= ratio;
      }

      // 회전 제한
      if (Math.abs(angular) > MAX_ANGULAR) {
        angular = Math.sign(angular) * MAX_ANGULAR;
      }

      Body.setVelocity(body, { x: vx, y: vy });
      Body.setAngularVelocity(body, angular);
    }

    // ✅ 진화 로직 유지
    if (a.fruitType !== b.fruitType) continue;

    const fruitType = a.fruitType;
    const nextType = getNextType(fruitType);
    if (!nextType) continue;

    const newX = (a.position.x + b.position.x) / 2;
    const newY = (a.position.y + b.position.y) / 2 - RADIUS;

    World.remove(world, a);
    World.remove(world, b);
    fruits.splice(fruits.indexOf(a), 1);
    fruits.splice(fruits.indexOf(b), 1);

    score += FRUIT_SCORES[nextType] || 0;
    createFruit(nextType, newX, newY, 1.5);
  }
});



const MOVE_SPEED = 9;
const FRUIT_STATS = {
  stella:  { radius: 20, density: 0.001 },
  dana:    { radius: 30, density: 0.001 },
  erwin:   { radius: 40, density: 0.001 },
  jin:     { radius: 50, density: 0.001 },
  lily:    { radius: 60, density: 0.001 },
  chii:    { radius: 75, density: 0.001 },
  haru:    { radius: 95, density: 0.001 },
  ephnel:  { radius: 115, density: 0.001 },
  iris:    { radius: 130, density: 0.001 },
  leenabi: { radius: 150, density: 0.001 },
  grouton: { radius: 170, density: 0.001 }
};




function createFruit(type = "stella", x = 270, y = 50, scale = 1) {
  const { radius, density } = FRUIT_STATS[type] || { radius: 30, density: 0.001 };

  const fruit = Bodies.circle(x, y, radius, {
    restitution: 0.3,
    friction: 0.05,
    frictionAir: 0.01,
    density: density,
    label: type,
  });

  // ✅ 생성 이후에 할당해야 정상 작동함
  fruit.createdAt = Date.now(); // 생성 시각 설정
  fruit.fruitType = type;
  fruit.radius = radius;
  fruit.scale = scale;
  fruit.growTimer = scale > 1 ? 10 : 0;
  fruit.visualAngle = 0;
  fruit.spinDir = Math.random() < 0.5 ? -1 : 1;

  fruits.push(fruit);
  World.add(world, fruit);

  return fruit;
}





function update() {
  
  const lastFruit = fruits[fruits.length - 1];
  const GAME_OVER_HEIGHT = 80;

  // 시각용 회전값 누적
for (const fruit of fruits) {
  const vx = fruit.velocity.x;
  const vy = fruit.velocity.y;
  const speed = Math.sqrt(vx * vx + vy * vy);

  // 회전 방향 초기화 (안 되어 있으면)
  if (fruit.spinDir === undefined) {
    fruit.spinDir = Math.random() < 0.5 ? -1 : 1;
  }

  // 시각 회전 각도 누적
  fruit.visualAngle += fruit.spinDir * speed * 0.03;
}

  Engine.update(engine);


  // ✅ 게임 오버 감지
// ✅ 중복 루프 제거!
const now = Date.now();
const IMMUNE_TIME = 1000; // 1초 무적

for (const fruit of fruits) {
  if (!fruit.createdAt || now - fruit.createdAt < IMMUNE_TIME) continue; // 💥 1초 동안 제외

  const vy = fruit.velocity.y;
  const vx = fruit.velocity.x;
  const speed = Math.sqrt(vx * vx + vy * vy);
  const yTop = fruit.position.y - (fruit.radius || RADIUS);

  if (yTop < 10 && speed < 0.05) {
    gameOver = true;
    console.log("☠️ Game Over: 천장 부근 과일 감지됨");
    break;
  }
}


  


  if (!dropping && !gameOver) {
    if (moveLeft) {
      waitingFruitX = Math.max(RADIUS, waitingFruitX - MOVE_SPEED);
    }
    if (moveRight) {
      waitingFruitX = Math.min(canvas.width - RADIUS, waitingFruitX + MOVE_SPEED);
    }
  }

  if (lastFruit && dropping && !gameOver) {
    const bottom = lastFruit.position.y + RADIUS;
    const velocity = lastFruit.velocity;

    const isLanded =
      (bottom >= canvas.height - 10 || velocity.y === 0) &&
      Math.abs(velocity.y) < 0.5 &&
      Math.abs(velocity.x) < 0.5;

    if (isLanded) {
      // 필요시 처리
    }
  }
}





function draw() {
  // ✅ 제일 먼저 화면 전체 클리어
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!dropping && !gameOver) {
    const previewRadius = FRUIT_STATS[currentFruitType]?.radius || RADIUS;
    const fruitY = 50;
    const fruitBottom = fruitY + previewRadius;
    const fruitCenterX = waitingFruitX;
  
    let minY = canvas.height;
    let touching = false;
  
    for (const fruit of fruits) {
      const dx = Math.abs(fruit.position.x - fruitCenterX);
      const dy = fruit.position.y - fruitY;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      // ✅ 닿았는지 여부 - 중심 간 거리 + 여유
      if (distance <= fruit.radius + 4) {
        touching = true;
        break;
      }
  
      // ✅ 판정 여유: 과일이 충분히 근접한 경우에만 대상 포함
      const X_TOLERANCE = fruit.radius * 1; // ★ 현실적인 허용 오차
      if (dx < X_TOLERANCE && fruit.position.y > fruitBottom) {
        minY = Math.min(minY, fruit.position.y);
      }
    }
  
    if (!touching) {
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(fruitCenterX, fruitBottom);
      ctx.lineTo(fruitCenterX, minY);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  
  
  
  
  
  
  
  
  



  // ✅ 게임오버 경고 가이드라인
  const dangerLineY = 30;
  const lineNear = fruits.some(fruit => (fruit.position.y - fruit.radius) < dangerLineY + 20);
  ctx.beginPath();
  ctx.moveTo(0, dangerLineY);
  ctx.lineTo(canvas.width, dangerLineY);
  ctx.lineWidth = lineNear ? 4 : 1;
  ctx.strokeStyle = lineNear ? "#ff0000" : "#ff8888";
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]); // 원래대로 복원

  // ✅ 게임 오버 텍스트
// ✅ 오른쪽 상단 미리보기 ... 그 아래에 추가
const nextImg = FRUIT_IMAGES[nextFruitType];
if (nextImg && nextImg.complete) {
  ctx.drawImage(nextImg, canvas.width - 60 - 20, 60 - 20, 40, 40);
} else {
  ctx.fillStyle = FRUIT_COLORS[nextFruitType] || "#999";
  ctx.beginPath();
  ctx.arc(canvas.width - 60, 60, 20, 0, Math.PI * 2);
  ctx.fill();
}





  // ✅ 과일 그리기
  for (const fruit of fruits) {
    if (fruit.growTimer > 0) {
      fruit.growTimer--;
      fruit.scale = 1 + (fruit.growTimer / 10) * 0.5;
    } else {
      fruit.scale = 1;
    }

    const scale = fruit.scale || 1;
    const radius = (fruit.radius || RADIUS) * scale;
    const img = FRUIT_IMAGES[fruit.fruitType];

    if (img && img.complete) {
      ctx.save();
      ctx.translate(fruit.position.x, fruit.position.y);
      ctx.rotate(fruit.visualAngle);
      ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = FRUIT_COLORS[fruit.fruitType] || "#ccc";
      ctx.beginPath();
      ctx.arc(fruit.position.x, fruit.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ✅ 점수 표시
  ctx.fillStyle = "#333";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 30);

  // ✅ 현재 대기 중 과일
  if (!dropping && !gameOver) {
    const previewRadius = FRUIT_STATS[currentFruitType]?.radius || RADIUS;
    const img = FRUIT_IMAGES[currentFruitType];
    if (img && img.complete) {
      ctx.drawImage(img, waitingFruitX - previewRadius, 50 - previewRadius, previewRadius * 2, previewRadius * 2);
    }
  }

  // ✅ 오른쪽 상단 미리보기
  ctx.fillStyle = "#666";
  ctx.font = "16px Arial";
  ctx.fillText("Next:", canvas.width - 100, 30);

  
  if (nextImg && nextImg.complete) {
    ctx.drawImage(nextImg, canvas.width - 60 - 20, 60 - 20, 40, 40);
  } else {
    ctx.fillStyle = FRUIT_COLORS[nextFruitType] || "#999";
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // ✅ 🟥 맨 마지막에 게임 오버 텍스트
if (gameOver) {
  // 반투명 어두운 배경
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);

  // 눈에 잘 띄는 흰색 텍스트
  ctx.fillStyle = "#fff";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 + 15);
}


}




let nextFruitType = getRandomFruitType(); // 최초 미리보기 과일

function getRandomFruitType() {
  const minIndex = 0;
  const maxIndex = 4; // 0~4 = 1단계~5단계
  const index = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
  return FRUIT_TYPES[index];
}


window.addEventListener("keydown", (e) => {

  console.log("[KEYDOWN]", e.code);
  console.log("🔍 dropping:", dropping, "gameOver:", gameOver);

  if (gameOver) return;

  if (e.code === "KeyA" && !moveLeft) {
    moveLeft = true;
  }
  if (e.code === "KeyD" && !moveRight) {
    moveRight = true;
  }

  if (e.code === "Space" && !dropping && !gameOver) {
    createFruit(currentFruitType, waitingFruitX);   // 🔽 현재 타입 드랍
    currentFruitType = nextFruitType;               // ▶️ 미리보기를 현재로
    nextFruitType = getRandomFruitType();           // ▶️ 새 미리보기 설정
    dropping = true;
    setTimeout(() => {
      dropping = false;
    }, 500);
  }
  
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyA") moveLeft = false;
  if (e.code === "KeyD") moveRight = false;
});


for (const type of FRUIT_TYPES) {
  const img = new Image();
  img.src = `images/${type}.png`; // ex: images/stella.png
  FRUIT_IMAGES[type] = img;
}

const FRUIT_SCORES = {
  stella: 1,
  dana: 3,
  erwin: 6,
  jin: 10,
  lily: 15,
  chii: 21,
  haru: 28,
  ephnel: 36,
  iris: 45,
  leenabi: 55,
  grouton: 66
};




function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
