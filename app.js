const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let dpr = 1;

let drawing = false;
let running = false;

let shape = [];
let particles = [];


/* =========================
   ELEMENTOS
========================= */

const $ = (id) =>
  document.getElementById(id);


/* =========================
   REDIMENSIONAR CANVAS
========================= */

function resizeCanvas() {

  const rect =
    canvas.getBoundingClientRect();

  dpr =
    window.devicePixelRatio || 1;

  canvas.width =
    rect.width * dpr;

  canvas.height =
    rect.height * dpr;

  W = rect.width;
  H = rect.height;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  initializeParticles();

  draw();
}


window.addEventListener(
  "resize",
  resizeCanvas
);


/* =========================
   POSIÇÃO DO MOUSE
========================= */

function getMousePosition(event) {

  const rect =
    canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}


/* =========================
   DESENHO
========================= */

canvas.addEventListener(
  "pointerdown",
  event => {

    if (running) return;

    drawing = true;

    canvas.setPointerCapture(
      event.pointerId
    );

    shape = [
      getMousePosition(event)
    ];
  }
);


canvas.addEventListener(
  "pointermove",
  event => {

    if (!drawing) return;

    shape.push(
      getMousePosition(event)
    );

    draw();
  }
);


canvas.addEventListener(
  "pointerup",
  () => {

    drawing = false;

    updateMetrics();
  }
);


/* =========================
   BOTÃO DESENHAR
========================= */

$("drawBtn").onclick = () => {

  running = false;

  $("runBtn").textContent =
    "▶ Iniciar túnel";

  $("status").textContent =
    "Modo desenho ativo";
};


/* =========================
   LIMPAR
========================= */

$("clearBtn").onclick = () => {

  shape = [];

  running = false;

  $("runBtn").textContent =
    "▶ Iniciar túnel";

  initializeParticles();

  draw();

  updateMetrics();
};


/* =========================
   TÚNEL
========================= */

$("runBtn").onclick = () => {

  running = !running;


  if (running) {

    $("runBtn").textContent =
      "⏸ Pausar túnel";

    $("status").textContent =
      "Túnel em execução";

    requestAnimationFrame(loop);

  } else {

    $("runBtn").textContent =
      "▶ Iniciar túnel";

    $("status").textContent =
      "Túnel pausado";
  }

};


/* =========================
   VELOCIDADE
========================= */

$("speed").oninput = event => {

  const value =
    event.target.value;

  $("speedValue").textContent =
    value + " km/h";

  $("mSpeed").textContent =
    value + " km/h";

  updateMetrics();
};


/* =========================
   PARTÍCULAS
========================= */

$("particles").oninput = event => {

  $("particleValue").textContent =
    event.target.value;

  initializeParticles();
};


/* =========================
   TURBULÊNCIA
========================= */

$("turb").oninput = event => {

  $("turbValue").textContent =
    event.target.value + "%";

  updateMetrics();
};


/* =========================
   INICIALIZAR PARTÍCULAS
========================= */

function initializeParticles() {

  const amount =
    Number($("particles").value);

  particles = [];


  for (let i = 0; i < amount; i++) {

    particles.push({

      x: Math.random() * W,

      y: Math.random() * H,

      speed:
        1 + Math.random() * 1.5
    });
  }
}


/* =========================
   DISTÂNCIA ATÉ O DESENHO
========================= */

function distanceToShape(x, y) {

  let minimum =
    Infinity;


  for (
    let i = 1;
    i < shape.length;
    i++
  ) {

    const a =
      shape[i - 1];

    const b =
      shape[i];


    const dx =
      b.x - a.x;

    const dy =
      b.y - a.y;


    const lengthSquared =
      dx * dx +
      dy * dy;


    const t =
      Math.max(
        0,
        Math.min(
          1,
          (
            (x - a.x) * dx +
            (y - a.y) * dy
          ) /
          (lengthSquared || 1)
        )
      );


    const closestX =
      a.x + t * dx;

    const closestY =
      a.y + t * dy;


    const distance =
      Math.hypot(
        x - closestX,
        y - closestY
      );


    minimum =
      Math.min(
        minimum,
        distance
      );
  }


  return minimum;
}


/* =========================
   ATUALIZAR PARTÍCULAS
========================= */

function updateParticles() {

  const speed =
    Number($("speed").value);

  const turbulence =
    Number($("turb").value) / 100;


  for (const particle of particles) {

    particle.x +=
      particle.speed *
      (1 + speed / 35);


    /*
     * Desvio do fluxo
     */

    if (shape.length > 2) {

      const distance =
        distanceToShape(
          particle.x,
          particle.y
        );


      if (distance < 35) {

        const averageY =
          shape.reduce(
            (sum, point) =>
              sum + point.y,
            0
          ) /
          shape.length;


        const direction =
          particle.y < averageY
            ? -1
            : 1;


        particle.y +=
          direction *
          (36 - distance) *
          0.07 *
          (1 + turbulence * 2);
      }
    }


    /*
     * Turbulência
     */

    particle.y +=
      (Math.random() - 0.5) *
      turbulence *
      2;


    /*
     * Reiniciar partícula
     */

    if (particle.x > W + 5) {

      particle.x = -5;

      particle.y =
        Math.random() * H;
    }
  }
}


/* =========================
   DESENHAR TÚNEL
========================= */

function drawTunnel() {

  ctx.strokeStyle =
    "#183653";

  ctx.lineWidth = 1;


  for (
    let y = 35;
    y < H;
    y += 35
  ) {

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(W, y);

    ctx.stroke();
  }
}


/* =========================
   DESENHAR FLUXO
========================= */

function drawFlow() {

  for (const particle of particles) {

    ctx.fillStyle =
      "rgba(61,210,255,.8)";

    ctx.fillRect(
      particle.x,
      particle.y,
      7,
      1.3
    );
  }
}


/* =========================
   DESENHAR OBJETO
========================= */

function drawShape() {

  if (shape.length === 0) {
    return;
  }


  ctx.beginPath();


  shape.forEach(
    (point, index) => {

      if (index === 0) {

        ctx.moveTo(
          point.x,
          point.y
        );

      } else {

        ctx.lineTo(
          point.x,
          point.y
        );
      }
    }
  );


  /*
   * Brilho
   */

  ctx.shadowColor =
    "#00d9ff";

  ctx.shadowBlur = 12;

  ctx.strokeStyle =
    "#00cfff";

  ctx.lineWidth = 3;

  ctx.stroke();


  /*
   * Linha branca
   */

  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    "#ffffff";

  ctx.lineWidth = 1;

  ctx.stroke();
}


/* =========================
   DESENHAR TUDO
========================= */

function draw() {

  ctx.fillStyle =
    "#081525";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  drawTunnel();

  drawFlow();

  drawShape();
}


/* =========================
   LOOP DA SIMULAÇÃO
========================= */

function loop() {

  if (!running) {
    return;
  }


  updateParticles();

  draw();


  requestAnimationFrame(
    loop
  );
}


/* =========================
   EXEMPLO DE AEROFÓLIO
========================= */

$("exampleBtn").onclick = () => {

  shape = [];


  const centerX =
    W * 0.52;

  const centerY =
    H * 0.52;


  const width =
    W * 0.36;

  const height =
    H * 0.11;


  /*
   * Parte superior
   */

  for (
    let i = 0;
    i <= 100;
    i++
  ) {

    const t =
      i / 100;

    const x =
      centerX -
      width / 2 +
      t * width;


    const y =
      centerY -
      Math.sin(t * Math.PI) *
      height / 2;


    shape.push({
      x,
      y
    });
  }


  /*
   * Parte inferior
   */

  for (
    let i = 100;
    i >= 0;
    i--
  ) {

    const t =
      i / 100;

    const x =
      centerX -
      width / 2 +
      t * width;


    const y =
      centerY +
      Math.sin(t * Math.PI) *
      height / 2;


    shape.push({
      x,
      y
    });
  }


  draw();

  updateMetrics();
};


/* =========================
   EXPORTAR PNG
========================= */

$("saveBtn").onclick = () => {

  const link =
    document.createElement("a");


  link.download =
    "wind-tunnel.png";


  link.href =
    canvas.toDataURL(
      "image/png"
    );


  link.click();
};


/* =========================
   MÉTRICAS
========================= */

function updateMetrics() {

  const speed =
    Number($("speed").value);

  const turbulence =
    Number($("turb").value);


  /*
   * Este valor é apenas
   * uma estimativa visual.
   */

  const complexity =
    Math.min(
      1,
      shape.length / 500
    );


  const drag =
    0.12 +
    complexity * 0.55 +
    turbulence / 500;


  $("drag").textContent =
    drag.toFixed(2);


  /*
   * Classificação do fluxo
   */

  if (turbulence > 60) {

    $("flow").textContent =
      "Turbulento";

  } else if (turbulence > 30) {

    $("flow").textContent =
      "Transicional";

  } else {

    $("flow").textContent =
      "Laminar";
  }
}


/* =========================
   INICIALIZAÇÃO
========================= */

resizeCanvas();

updateMetrics();

$("exampleBtn").click();

running = false;

draw();
