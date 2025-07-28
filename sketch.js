let song;
let fft, peakDetect;
let beeX, beeY;

let sparks = [];
let flowers = [];
let bubbles = [];


let isPlaying = false;
let tremble = 0;

// Для сглаживания аудиоданных
let prevBass = 0, prevMid = 0, prevTreble = 0;
let smoothBeeX = 0, smoothBeeY = 0;
let prevWingAngle = 0, prevBodyTilt = 0, prevBodyScale = 1, prevHeadSwing = 0;
let brassWaveAlpha = 0; // для духовых

// Для темпа
let lastPeakTime = 0;
let peakIntervals = [];
let tempoBPM = 120; // стартовое значение
let tempoFactor = 1;

// Для визуализации спектра
let spectrumBars = 64;

// Для эффекта всплеска на пик
let peakFlash = 0;

function preload() {
  song = loadSound('./DELTARUNE_THE_WORLD_REVOLVING.mp3'); // локальный файл
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT();
  peakDetect = new p5.PeakDetect();
  beeX = width / 2;
  beeY = height / 2;

  for (let i = 0; i < 40; i++) {
    sparks.push(new ShintoCharm());
    flowers.push(new Flower());
    bubbles.push(new LifeObstacle());
  }

  // Кнопка запуска
  let playButton = createButton('▶️ Play Music');
  playButton.position(20, 20);
  playButton.mousePressed(() => {
    if (!isPlaying) {
      userStartAudio();
      song.loop();
      isPlaying = true;
      playButton.hide();
    }
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  beeX = width / 2;
  beeY = height / 2;
}

function draw() {
  if (!isPlaying) {
    background(20, 25, 40);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text('Click "Play Music" to start', width / 2, height / 2);
    return;
  }

  let spectrum = fft.analyze();
  peakDetect.update(fft);

  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // Сглаживание аудиоданных
  prevBass = lerp(prevBass, bass, 0.2);
  prevMid = lerp(prevMid, mid, 0.2);
  prevTreble = lerp(prevTreble, treble, 0.2);

  // Реакция на пик и расчет темпа
  if (peakDetect.isDetected) {
    background(255, 80, 80, 180); // яркая вспышка
    peakFlash = 1.0;
    // Дополнительный эффект: временно увеличиваем размер всех sparks
    for (let s of sparks) s.size += 2;
    // Можно добавить появление новых препятствий
    for (let i = 0; i < 3; i++) bubbles.push(new LifeObstacle());

    // --- Темп ---
    let now = millis();
    if (lastPeakTime > 0) {
      let interval = now - lastPeakTime;
      if (interval > 200 && interval < 2000) { // фильтр от случайных пиков
        peakIntervals.push(interval);
        if (peakIntervals.length > 8) peakIntervals.shift();
        let avg = peakIntervals.reduce((a, b) => a + b, 0) / peakIntervals.length;
        tempoBPM = 60000 / avg;
        tempoBPM = constrain(tempoBPM, 60, 220);
        tempoFactor = map(tempoBPM, 60, 220, 0.7, 1.5);
      }
    }
    lastPeakTime = now;
  } else {
    background(20, 25, 40, 100);
    peakFlash = max(0, peakFlash - 0.05);
  }

  // Тряска от баса теперь менее выражена
  tremble = map(prevBass, 0, 255, 0, 2.5); // дрожание зависит от сглаженного баса

  // Визуализация спектра
  noStroke();
  let barWidth = width / spectrumBars;
  for (let i = 0; i < spectrumBars; i++) {
    let amp = spectrum[floor(map(i, 0, spectrumBars, 0, spectrum.length))];
    let h = map(amp, 0, 255, 0, height * 0.25) * (0.7 + 0.3 * peakFlash);
    fill(100 + i * 2, 180, 255, 80 + 120 * peakFlash);
    rect(i * barWidth, height - h, barWidth * 0.8, h, 4);
  }

  for (let s of sparks) {
    s.update(prevMid, tempoFactor);
    s.show();
    // Постепенно возвращаем размер sparks к исходному
    s.size = lerp(s.size, s.baseSize || 5, 0.1);
  }
  for (let f of flowers) {
    f.update(prevTreble, tempoFactor);
    f.show(prevTreble);
  }
  for (let b of bubbles) {
    b.update(prevBass, tempoFactor);
    b.show();
  }
  // Ограничиваем количество препятствий
  if (bubbles.length > 60) bubbles.splice(0, bubbles.length - 60);

  // Плавное движение пчелы
  let targetX = beeX + random(-tremble, tremble);
  let targetY = beeY + random(-tremble, tremble);
  smoothBeeX = lerp(smoothBeeX || targetX, targetX, 0.15);
  smoothBeeY = lerp(smoothBeeY || targetY, targetY, 0.15);

  // Если духовые (treble) сильные — волны вокруг пчелы
  if (prevTreble > 180) {
    brassWaveAlpha = lerp(brassWaveAlpha, 1, 0.1);
  } else {
    brassWaveAlpha = lerp(brassWaveAlpha, 0, 0.05);
  }
  if (brassWaveAlpha > 0.01) {
    push();
    translate(smoothBeeX, smoothBeeY);
    noFill();
    stroke(255, 220, 80, 120 * brassWaveAlpha);
    strokeWeight(3 + 2 * brassWaveAlpha);
    let waveR = 38 + 18 * sin(frameCount * 0.12);
    ellipse(0, 0, waveR + prevTreble * 0.5, waveR + prevTreble * 0.5);
    stroke(255, 180, 80, 80 * brassWaveAlpha);
    ellipse(0, 0, waveR * 1.5 + prevTreble * 0.3, waveR * 1.5 + prevTreble * 0.3);
    pop();
  }

  drawBee(smoothBeeX, smoothBeeY, prevBass);
}

// Класс для искр
// Класс для синтоистских иероглифов-талисманов
class ShintoCharm {
  constructor() {
    this.angle = random(TWO_PI);
    this.radius = random(100, 250);
    this.size = random(22, 36);
    this.baseSize = this.size;
    this.alpha = random(120, 200);
    this.speed = random(0.005, 0.02);
    // Список иероглифов-талисманов (значения: гармония, удача, защита, божество, связь, чистота, очищение, дракон, благословение, сердце)
    this.charmList = ['和', '福', '守', '神', '縁', '清', '祓', '龍', '祝', '心'];
    this.char = random(this.charmList);
    this.color = color(random([color(255, 220, 80), color(255, 180, 80), color(200, 220, 255), color(255, 120, 120)]));
    this.twinkle = random(0.5, 1.2);
  }
  update(mid, tempoFactor = 1) {
    this.angle += this.speed * map(mid, 0, 255, 0.5, 2) * tempoFactor;
    // Пульсация размера
    this.size = this.baseSize + 6 * sin(frameCount * 0.08 + this.angle);
  }
  show() {
    let x = beeX + cos(this.angle) * this.radius;
    let y = beeY + sin(this.angle) * this.radius;
    push();
    translate(x, y);
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha + 40 * sin(frameCount * 0.1 + this.angle * 2));
    textAlign(CENTER, CENTER);
    textSize(this.size);
    text(this.char, 0, 0);
    pop();
  }
}

// Класс для цветов
class Flower {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.baseSize = random(8, 15);
    this.offset = random(TWO_PI);
  }
  update(treble, tempoFactor = 1) {
    // Пульсация зависит от темпа
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

// Класс для пузырьков
// Класс для "жизненных препятствий" в виде японских иероглифов
class LifeObstacle {
  constructor() {
    this.x = random(width);
    this.y = random(-100, -20);
    this.baseSize = random(22, 36);
    this.size = this.baseSize;
    this.speed = random(0.5, 2);
    this.alpha = random(120, 200);
    // Список препятствий: болезнь, страх, сомнение, боль, одиночество, неудача, зависть, гнев, усталость, тревога
    this.obstacleList = [
      { char: '病', color: color(180, 60, 60) }, // болезнь
      { char: '恐', color: color(80, 80, 180) }, // страх
      { char: '疑', color: color(120, 120, 120) }, // сомнение
      { char: '痛', color: color(200, 80, 80) }, // боль
      { char: '孤', color: color(80, 120, 200) }, // одиночество
      { char: '敗', color: color(120, 80, 180) }, // неудача
      { char: '嫉', color: color(80, 180, 120) }, // зависть
      { char: '怒', color: color(200, 120, 60) }, // гнев
      { char: '疲', color: color(120, 120, 200) }, // усталость
      { char: '悩', color: color(180, 120, 120) } // тревога
    ];
    let chosen = random(this.obstacleList);
    this.char = chosen.char;
    this.color = chosen.color;
  }
  update(bass, tempoFactor = 1) {
    this.y += this.speed * map(bass, 0, 255, 0.5, 2) * tempoFactor;
    this.size = this.baseSize + map(bass, 0, 255, 0, 8);
    if (this.y > height + this.size) {
      this.y = random(-100, -20);
      this.x = random(width);
      // Новый символ и цвет при "респауне"
      let chosen = random(this.obstacleList);
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

// Пчела
function drawBee(x, y, bass) {
  // Используем сглаженные значения для всех диапазонов
  let mid = prevMid;
  let treble = prevTreble;
  let t = frameCount / 60.0;

  // Темп влияет на скорость анимаций
  let tempo = tempoFactor;


  // --- Новые трансформации от темпа ---
  // Мягкое масштабирование, вращение и пульсация в зависимости от темпа
  // Чем выше tempoBPM, тем заметнее эффекты
  let tempoNorm = map(tempoBPM, 60, 220, 0, 1); // 0..1
  // Мягкое сглаживание для темповых эффектов
  if (typeof drawBee.prevTempoNorm === 'undefined') drawBee.prevTempoNorm = tempoNorm;
  drawBee.prevTempoNorm = lerp(drawBee.prevTempoNorm, tempoNorm, 0.08);

  // Масштаб пчелы
  let tempoScale = 1 + 0.18 * sin(t * 1.2 + tempo * 0.7) * drawBee.prevTempoNorm;
  // Вращение пчелы
  let tempoRot = 0.12 * sin(t * 0.7 + tempo * 1.1) * drawBee.prevTempoNorm;
  // Пульсация тела
  let tempoPulse = 1 + 0.12 * sin(t * 2.5 + tempo * 1.5) * drawBee.prevTempoNorm;

  // --- Движения пчелы ---
  // Подпрыгивания (вертикальные) от баса
  let jump = map(bass, 0, 255, 0, 18) * sin(t * 2.1 + bass * 0.01);
  // Покачивания влево-вправо от mid
  let sway = map(mid, 0, 255, 0, 12) * sin(t * 1.3 + mid * 0.02);
  // Мелкая вибрация от treble
  let vib = map(treble, 0, 255, 0, 4) * sin(t * 8.5 + treble * 0.05);
  // Дополнительное движение от темпа (пульсация вверх-вниз)
  let tempoMove = 10 * drawBee.prevTempoNorm * sin(t * 1.1 + tempo * 0.5);

  // Итоговые смещения
  let moveX = sway + vib;
  let moveY = jump + tempoMove;

  // Плавное сглаживание параметров анимации
  let wingFreq = map(treble, 0, 255, 8, 18) * tempo;
  let wingAmp = map(bass, 0, 255, 8, 22);
  let wingAngle = sin(t * wingFreq) * wingAmp;
  prevWingAngle = lerp(prevWingAngle, wingAngle, 0.18);

  let bodyScale = (1 + map(mid, 0, 255, 0, 0.18) * sin(t * 2 * tempo + mid * 0.01)) * tempoPulse;
  prevBodyScale = lerp(prevBodyScale, bodyScale, 0.12);
  let bodyTilt = map(bass, 0, 255, -0.18, 0.18) * sin(t * 1.5 * tempo + bass * 0.01) + tempoRot;
  prevBodyTilt = lerp(prevBodyTilt, bodyTilt, 0.12);

  let headSwing = map(treble, 0, 255, -0.2, 0.2) * sin(t * 2.5 * tempo + treble * 0.01);
  prevHeadSwing = lerp(prevHeadSwing, headSwing, 0.15);

  let stripePulse = map(mid, 0, 255, 1, 1.25) * (1 + 0.08 * sin(t * 4 * tempo + mid * 0.02)) * tempoPulse;

  // Тень под пчелой (реагирует на бас)
  let shadowSize = 28 + map(bass, 0, 255, 0, 18);
  push();
  // Добавляем движения к позиции пчелы
  translate(x + moveX, y + moveY);
  // Глобальное масштабирование и вращение от темпа
  scale(tempoScale, tempoScale);
  rotate(tempoRot);
  fill(0, 60);
  ellipse(0, 24, shadowSize * prevBodyScale, 10 * prevBodyScale);

  // Тело
  push();
  rotate(prevBodyTilt);
  scale(prevBodyScale, 1);
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
  rotate(-0.18 + prevWingAngle * 0.01);
  ellipse(-18 - abs(prevWingAngle), -15, 30 + abs(prevWingAngle) * 0.5, 15 + abs(prevWingAngle) * 0.2);
  pop();
  push();
  rotate(0.18 - prevWingAngle * 0.01);
  ellipse(18 + abs(prevWingAngle), -15, 30 + abs(prevWingAngle) * 0.5, 15 + abs(prevWingAngle) * 0.2);
  pop();

  // Голова
  push();
  rotate(prevHeadSwing);
  fill(0);
  ellipse(0, -25, 18, 18);
  // Глаза (реагируют на treble)
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
