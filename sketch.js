
// Константы
const MAX_BUBBLES = 60;
const INIT_OBJECTS = 40;
const SPECTRUM_BARS = 64;
const TREMBLE_MAX = 2.5;
const PEAK_FLASH_DECAY = 0.05;
const TEMPO_MIN = 60;
const TEMPO_MAX = 220;
const PEAK_INTERVAL_MIN = 200;
const PEAK_INTERVAL_MAX = 2000;

// Глобальное состояние
const state = {
  song: null,
  fft: null,
  peakDetect: null,
  beeX: 0,
  beeY: 0,
  sparks: [],
  flowers: [],
  bubbles: [],
  isPlaying: false,
  tremble: 0,
  prevBass: 0,
  prevMid: 0,
  prevTreble: 0,
  smoothBeeX: 0,
  smoothBeeY: 0,
  prevWingAngle: 0,
  prevBodyTilt: 0,
  prevBodyScale: 1,
  prevHeadSwing: 0,
  brassWaveAlpha: 0,
  lastPeakTime: 0,
  peakIntervals: [],
  tempoBPM: 120,
  tempoFactor: 1,
  peakFlash: 0,
  barWidth: 0
};

// --- Классы объявлены до setup ---
class ShintoCharm {
  constructor() {
    this.angle = random(TWO_PI);
    this.radius = random(100, 250);
    this.size = random(22, 36);
    this.baseSize = this.size;
    this.alpha = random(120, 200);
    this.speed = random(0.005, 0.02);
    this.char = random(ShintoCharm.charmList);
    this.baseColor = random(ShintoCharm.baseColors);
    this.color = this.baseColor;
    this.twinkle = random(0.5, 1.2);
  }
  update(mid, tempoFactor = 1) {
    this.angle += this.speed * map(mid, 0, 255, 0.5, 2) * tempoFactor;
    this.size = this.baseSize + 6 * sin(frameCount * 0.08 + this.angle);
  }
  show() {
    let x = state.beeX + cos(this.angle) * this.radius;
    let y = state.beeY + sin(this.angle) * this.radius;
    push();
    translate(x, y);
    noStroke();
    let glowAlpha = this.alpha + 80 * abs(sin(frameCount * 0.12 + this.angle * 2));
    let glowSize = this.size * 1.25 + 4 * abs(sin(frameCount * 0.1 + this.angle));
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = color(255, 255, 180, 180);
    fill(this.baseColor.levels[0], this.baseColor.levels[1], this.baseColor.levels[2], glowAlpha);
    text(this.char, 0, 0);
    drawingContext.shadowBlur = 0;
    fill(this.baseColor.levels[0], this.baseColor.levels[1], this.baseColor.levels[2], this.alpha + 40 * sin(frameCount * 0.1 + this.angle * 2));
    textAlign(CENTER, CENTER);
    textSize(this.size);
    text(this.char, 0, 0);
    pop();
  }
}
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...

class Flower {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.baseSize = random(8, 15);
    this.offset = random(TWO_PI);
  }
  update(treble, tempoFactor = 1) {
    this.currentSize = this.baseSize + map(treble, 0, 255, 0, 10) * sin(frameCount * 0.1 * tempoFactor + this.offset);
  }
  show(treble) {
    push();
    translate(this.x, this.y);
    noStroke();
    let flicker = map(treble, 0, 255, 100, 255);
    fill(255, 200, 50, flicker);
    ellipse(0, 0, this.currentSize, this.currentSize * 1.5);
    fill(255, 150, 0, flicker - 50);
    ellipse(0, 0, this.currentSize * 0.6, this.currentSize);
    pop();
  }
}
// ...existing code...

class LifeObstacle {
  constructor() {
    this.x = random(width);
    this.y = random(-100, -20);
    this.baseSize = random(22, 36);
    this.size = this.baseSize;
    this.speed = random(0.5, 2);
    this.alpha = random(120, 200);
    let chosen = random(LifeObstacle.obstacleList);
    this.char = chosen.char;
    this.color = chosen.color;
  }
  update(bass, tempoFactor = 1) {
    this.y += this.speed * map(bass, 0, 255, 0.5, 2) * tempoFactor;
    this.size = this.baseSize + map(bass, 0, 255, 0, 8);
    if (this.y > height + this.size) {
      this.y = random(-100, -20);
      this.x = random(width);
      let chosen = random(LifeObstacle.obstacleList);
      this.char = chosen.char;
      this.color = chosen.color;
    }
  }
  show() {
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    textAlign(CENTER, CENTER);
    textSize(this.size);
    text(this.char, this.x, this.y);
  }
}
// ...existing code...

function preload() {
  state.song = loadSound('./DELTARUNE_THE_WORLD_REVOLVING.mp3'); // локальный файл
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  state.fft = new p5.FFT();
  state.peakDetect = new p5.PeakDetect();
  state.beeX = width / 2;
  state.beeY = height / 2;
  state.barWidth = width / SPECTRUM_BARS;

  // Инициализация статических списков после старта p5
  ShintoCharm.charmList = ['和', '福', '守', '神', '縁', '清', '祓', '龍', '祝', '心'];
  ShintoCharm.baseColors = [
    color(255, 255, 120),
    color(255, 220, 80),
    color(255, 180, 80),
    color(200, 240, 255),
    color(255, 120, 120),
    color(255, 255, 255)
  ];
  LifeObstacle.obstacleList = [
    { char: '病', color: color(60, 30, 30) },
    { char: '恐', color: color(30, 30, 60) },
    { char: '疑', color: color(50, 50, 50) },
    { char: '痛', color: color(80, 30, 30) },
    { char: '孤', color: color(40, 60, 80) },
    { char: '敗', color: color(50, 30, 60) },
    { char: '嫉', color: color(30, 60, 40) },
    { char: '怒', color: color(80, 50, 20) },
    { char: '疲', color: color(60, 60, 80) },
    { char: '悩', color: color(70, 50, 50) }
  ];

  for (let i = 0; i < INIT_OBJECTS; i++) {
    state.sparks.push(new ShintoCharm());
    state.flowers.push(new Flower());
    state.bubbles.push(new LifeObstacle());
  }

  // --- Экран загрузки ---
  state.loadingScreen = true;
  state.loadingAlpha = 1.0;
  state.shrinePulse = 0;
  state.shrinePulseDir = 1;
  state.shrineAnimT = 0;
  state.shrineButton = createButton('⛩️ 神社に入る');
  state.shrineButton.style('font-size', '1.5rem');
  state.shrineButton.style('padding', '0.7em 2.2em');
  state.shrineButton.style('background', 'rgba(255,255,255,0.92)');
  state.shrineButton.style('border', 'none');
  state.shrineButton.style('border-radius', '1.5em');
  state.shrineButton.style('box-shadow', '0 4px 24px 0 rgba(80,80,80,0.13)');
  state.shrineButton.style('color', '#222');
  state.shrineButton.style('transition', 'transform 0.22s cubic-bezier(.4,1.4,.6,1), background 0.18s, box-shadow 0.18s');
  state.shrineButton.style('cursor', 'pointer');
  // Добавляем анимацию при наведении через JS (для совместимости)
  state.shrineButton.mouseOver(() => {
    state.shrineButton.style('transform', 'scale(1.12)');
    state.shrineButton.style('background', 'rgba(255,255,255,1)');
    state.shrineButton.style('box-shadow', '0 8px 32px 0 rgba(255,80,80,0.18)');
    state.shrineButton.style('color', '#b00');
  });
  state.shrineButton.mouseOut(() => {
    state.shrineButton.style('transform', 'scale(1)');
    state.shrineButton.style('background', 'rgba(255,255,255,0.92)');
    state.shrineButton.style('box-shadow', '0 4px 24px 0 rgba(80,80,80,0.13)');
    state.shrineButton.style('color', '#222');
  });
  // Центрируем кнопку по центру экрана
  state.shrineButton.position(
    width/2 - state.shrineButton.size().width/2,
    height/2 + 70
  );
  state.shrineButton.mousePressed(() => {
    if (!state.isPlaying && state.loadingScreen) {
      userStartAudio();
      state.song.loop();
      state.isPlaying = true;
      state.loadingScreen = false;
      // Кнопка исчезает сразу
      state.loadingAlpha = 1.0;
      state.shrineButton.hide();
    }
  });
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  state.beeX = width / 2;
  state.beeY = height / 2;
  state.barWidth = width / SPECTRUM_BARS;
  if (state.shrineButton) {
    state.shrineButton.position(
      width/2 - state.shrineButton.size().width/2,
      height/2 + 70
    );
  }
}

function draw() {
  // --- Экран загрузки с анимацией ---
  if (state.loadingScreen) {
    let t = millis() * 0.001;
    let pulse = 1 + 0.08 * sin(t * 2.2);
    let alpha = state.loadingAlpha;
    background(20, 25, 40, 255 * alpha);
    push();
    translate(width/2, height/2-30);
    scale(3.2 * pulse);
    // Анимированная тень
    noStroke();
    fill(0, 60 * alpha);
    ellipse(0, 18, 32, 10 + 8 * pulse);
    // Храм (⛩️) с пульсацией
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(255, 80, 80, 255 * alpha);
    text('⛩️', 0, 0);
    pop();
    // Надпись (японский)
    push();
    textAlign(CENTER, CENTER);
    textSize(22);
    fill(255, 255, 255, 220 * alpha);
    text('音楽の神社へようこそ', width/2, height/2+38); // "Добро пожаловать в храм музыки" на японском
    pop();
    // Кнопка уже создана в setup
    // Плавное исчезновение
    if (!state.loadingScreen && state.loadingAlpha > 0) {
      state.loadingAlpha -= 0.045;
      if (state.loadingAlpha < 0) state.loadingAlpha = 0;
    }
    return;
  }


  let spectrum = state.fft.analyze();
  state.peakDetect.update(state.fft);

  let bass = state.fft.getEnergy("bass");
  let mid = state.fft.getEnergy("mid");
  let treble = state.fft.getEnergy("treble");

  // Сглаживание аудиоданных
  state.prevBass = lerp(state.prevBass, bass, 0.2);
  state.prevMid = lerp(state.prevMid, mid, 0.2);
  state.prevTreble = lerp(state.prevTreble, treble, 0.2);

  // Реакция на пик и расчет темпа
  if (state.peakDetect.isDetected) {
    background(255, 80, 80, 180); // яркая вспышка
    state.peakFlash = 1.0;
    // Дополнительный эффект: временно увеличиваем размер всех sparks
    for (let s of state.sparks) s.size += 2;
    // Добавляем новые препятствия только если не превышен лимит
    if (state.bubbles.length < MAX_BUBBLES) {
      let toAdd = min(3, MAX_BUBBLES - state.bubbles.length);
      for (let i = 0; i < toAdd; i++) state.bubbles.push(new LifeObstacle());
    }

    // --- Темп ---
    let now = millis();
    if (state.lastPeakTime > 0) {
      let interval = now - state.lastPeakTime;
      if (interval > PEAK_INTERVAL_MIN && interval < PEAK_INTERVAL_MAX) { // фильтр от случайных пиков
        state.peakIntervals.push(interval);
        if (state.peakIntervals.length > 8) state.peakIntervals.shift();
        let avg = state.peakIntervals.reduce((a, b) => a + b, 0) / state.peakIntervals.length;
        state.tempoBPM = 60000 / avg;
        state.tempoBPM = constrain(state.tempoBPM, TEMPO_MIN, TEMPO_MAX);
        state.tempoFactor = map(state.tempoBPM, TEMPO_MIN, TEMPO_MAX, 0.7, 1.5);
      }
    }
    state.lastPeakTime = now;
  } else {
    background(20, 25, 40, 100);
    state.peakFlash = max(0, state.peakFlash - PEAK_FLASH_DECAY);
  }

  // Тряска от баса теперь менее выражена
  state.tremble = map(state.prevBass, 0, 255, 0, TREMBLE_MAX); // дрожание зависит от сглаженного баса

  // Визуализация спектра
  noStroke();
  for (let i = 0; i < SPECTRUM_BARS; i++) {
    let amplitude = spectrum[floor(map(i, 0, SPECTRUM_BARS, 0, spectrum.length))];
    let h = map(amplitude, 0, 255, 0, height * 0.25) * (0.7 + 0.3 * state.peakFlash);
    fill(100 + i * 2, 180, 255, 80 + 120 * state.peakFlash);
    rect(i * state.barWidth, height - h, state.barWidth * 0.8, h, 4);
  }

  // Оптимизация: используем обычный for для минимизации аллокаций и ускорения
  for (let i = 0, n = state.sparks.length; i < n; i++) {
    let s = state.sparks[i];
    s.update(state.prevMid, state.tempoFactor);
    s.show();
    s.size = lerp(s.size, s.baseSize || 5, 0.1);
  }
  for (let i = 0, n = state.flowers.length; i < n; i++) {
    let f = state.flowers[i];
    f.update(state.prevTreble, state.tempoFactor);
    f.show(state.prevTreble);
  }
  for (let i = 0, n = state.bubbles.length; i < n; i++) {
    let b = state.bubbles[i];
    b.update(state.prevBass, state.tempoFactor);
    b.show();
  }
  // Ограничиваем количество препятствий
  if (state.bubbles.length > MAX_BUBBLES) state.bubbles.splice(0, state.bubbles.length - MAX_BUBBLES);

  // Плавное движение пчелы
  let targetX = state.beeX + random(-state.tremble, state.tremble);
  let targetY = state.beeY + random(-state.tremble, state.tremble);
  state.smoothBeeX = lerp(state.smoothBeeX || targetX, targetX, 0.15);
  state.smoothBeeY = lerp(state.smoothBeeY || targetY, targetY, 0.15);

  // Если духовые (treble) сильные — волны вокруг пчелы
  if (state.prevTreble > 180) {
    state.brassWaveAlpha = lerp(state.brassWaveAlpha, 1, 0.1);
  } else {
    state.brassWaveAlpha = lerp(state.brassWaveAlpha, 0, 0.05);
  }
  if (state.brassWaveAlpha > 0.01) {
    push();
    translate(state.smoothBeeX, state.smoothBeeY);
    noFill();
    stroke(255, 220, 80, 120 * state.brassWaveAlpha);
    strokeWeight(3 + 2 * state.brassWaveAlpha);
    let waveR = 38 + 18 * sin(frameCount * 0.12);
    ellipse(0, 0, waveR + state.prevTreble * 0.5, waveR + state.prevTreble * 0.5);
    stroke(255, 180, 80, 80 * state.brassWaveAlpha);
    ellipse(0, 0, waveR * 1.5 + state.prevTreble * 0.3, waveR * 1.5 + state.prevTreble * 0.3);
    pop();
  }

  drawBee(state.smoothBeeX, state.smoothBeeY, state.prevBass);



// Пчела
function drawBee(x, y, bass) {
  // Используем сглаженные значения для всех диапазонов
  let mid = state.prevMid;
  let treble = state.prevTreble;
  let t = frameCount / 60.0;

  // Темп влияет на скорость анимаций
  let tempo = state.tempoFactor;

  // --- Новые трансформации от темпа ---
  let tempoNorm = map(state.tempoBPM, TEMPO_MIN, TEMPO_MAX, 0, 1); // 0..1
  if (typeof drawBee.prevTempoNorm === 'undefined') drawBee.prevTempoNorm = tempoNorm;
  drawBee.prevTempoNorm = lerp(drawBee.prevTempoNorm, tempoNorm, 0.08);

  let tempoScale = 1 + 0.18 * sin(t * 1.2 + tempo * 0.7) * drawBee.prevTempoNorm;
  let tempoRot = 0.12 * sin(t * 0.7 + tempo * 1.1) * drawBee.prevTempoNorm;
  let tempoPulse = 1 + 0.12 * sin(t * 2.5 + tempo * 1.5) * drawBee.prevTempoNorm;

  // --- Движения пчелы ---
  let jump = map(bass, 0, 255, 0, 18) * sin(t * 2.1 + bass * 0.01);
  let sway = map(mid, 0, 255, 0, 12) * sin(t * 1.3 + mid * 0.02);
  let vib = map(treble, 0, 255, 0, 4) * sin(t * 8.5 + treble * 0.05);
  let tempoMove = 10 * drawBee.prevTempoNorm * sin(t * 1.1 + tempo * 0.5);

  let moveX = sway + vib;
  let moveY = jump + tempoMove;

  let wingFreq = map(treble, 0, 255, 8, 18) * tempo;
  let wingAmp = map(bass, 0, 255, 8, 22);
  let wingAngle = sin(t * wingFreq) * wingAmp;
  state.prevWingAngle = lerp(state.prevWingAngle, wingAngle, 0.18);

  let bodyScale = (1 + map(mid, 0, 255, 0, 0.18) * sin(t * 2 * tempo + mid * 0.01)) * tempoPulse;
  state.prevBodyScale = lerp(state.prevBodyScale, bodyScale, 0.12);
  let bodyTilt = map(bass, 0, 255, -0.18, 0.18) * sin(t * 1.5 * tempo + bass * 0.01) + tempoRot;
  state.prevBodyTilt = lerp(state.prevBodyTilt, bodyTilt, 0.12);

  let headSwing = map(treble, 0, 255, -0.2, 0.2) * sin(t * 2.5 * tempo + treble * 0.01);
  state.prevHeadSwing = lerp(state.prevHeadSwing, headSwing, 0.15);

  let stripePulse = map(mid, 0, 255, 1, 1.25) * (1 + 0.08 * sin(t * 4 * tempo + mid * 0.02)) * tempoPulse;

  // Тень под пчелой (реагирует на бас)
  let shadowSize = 28 + map(bass, 0, 255, 0, 18);
  push();
  translate(x + moveX, y + moveY);
  scale(tempoScale, tempoScale);
  rotate(tempoRot);
  fill(0, 60);
  ellipse(0, 24, shadowSize * state.prevBodyScale, 10 * state.prevBodyScale);

  // Тело
  push();
  rotate(state.prevBodyTilt);
  scale(state.prevBodyScale, 1);
  fill(255, 204, 0);
  rect(-12, -20, 24, 40, 6);

  // Полосы
  fill(0);
  rect(-12, -5 * stripePulse, 24, 7 * stripePulse, 3);
  rect(-12, 8 * stripePulse, 24, 7 * stripePulse, 3);
  pop();

  // Крылья
  fill(180, 210, 255, 180 + 40 * abs(sin(t * wingFreq)));
  push();
  rotate(-0.18 + state.prevWingAngle * 0.01);
  ellipse(-18 - abs(state.prevWingAngle), -15, 30 + abs(state.prevWingAngle) * 0.5, 15 + abs(state.prevWingAngle) * 0.2);
  pop();
  push();
  rotate(0.18 - state.prevWingAngle * 0.01);
  ellipse(18 + abs(state.prevWingAngle), -15, 30 + abs(state.prevWingAngle) * 0.5, 15 + abs(state.prevWingAngle) * 0.2);
  pop();

  // Голова
  push();
  rotate(state.prevHeadSwing);
  fill(0);
  ellipse(0, -25, 18, 18);
  fill(255);
  let eyeOffset = map(treble, 0, 255, 2, 5);
  ellipse(-4, -27, eyeOffset, eyeOffset);
  ellipse(4, -27, eyeOffset, eyeOffset);
  pop();

  // Усики (реагируют на mid)
  stroke(0);
  strokeWeight(2);
  let antAngle = map(mid, 0, 255, 0.6, 1.2);
  line(-5, -33, -12 - 6 * sin(t * 2 * tempo), -33 - 10 * antAngle);
  line(5, -33, 12 + 6 * sin(t * 2 * tempo + 1), -33 - 10 * antAngle);
  noStroke();

  pop();
}
// Закрывающая скобка для завершения всех блоков
}
