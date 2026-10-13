let escena, camara, renderizador;
let personaje, torsoMesh, volcan;
let objetos = [];
let teclas = {};

let salud = 100;
let puntos = 0;
let juegoActivo = false;

// Audio Context
let audioCtx = null;

function iniciarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function reproducirSonido(tipo) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const ahora = audioCtx.currentTime;

    if (tipo === 'salud') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ahora); 
        osc.frequency.exponentialRampToValueAtTime(880, ahora + 0.2); 
        gain.gain.setValueAtTime(0.3, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.2);
        osc.start(ahora);
        osc.stop(ahora + 0.2);
    } else if (tipo === 'puntos') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ahora);
        osc.frequency.exponentialRampToValueAtTime(1174.66, ahora + 0.15);
        gain.gain.setValueAtTime(0.3, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.15);
        osc.start(ahora);
        osc.stop(ahora + 0.15);
    } else if (tipo === 'malo') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ahora);
        osc.frequency.exponentialRampToValueAtTime(40, ahora + 0.2);
        gain.gain.setValueAtTime(0.4, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.2);
        osc.start(ahora);
        osc.stop(ahora + 0.2);
    } else if (tipo === 'cambioRopa') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, ahora);
        gain.gain.setValueAtTime(0.2, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.08);
        osc.start(ahora);
        osc.stop(ahora + 0.08);
    } else if (tipo === 'gameOver') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ahora);
        osc.frequency.exponentialRampToValueAtTime(60, ahora + 0.6);
        gain.gain.setValueAtTime(0.5, ahora);
        gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.6);
        osc.start(ahora);
        osc.stop(ahora + 0.6);
    }
}

// Generar cenizas flotantes en el fondo
function crearEfectoCenizasFondo() {
    const contenedor = document.getElementById('cenizasFondo');
    if (!contenedor) return;

    for (let i = 0; i < 25; i++) {
        const brasa = document.createElement('div');
        brasa.className = 'brasa';
        const tamano = Math.random() * 6 + 3;
        brasa.style.width = `${tamano}px`;
        brasa.style.height = `${tamano}px`;
        brasa.style.left = `${Math.random() * 100}%`;
        brasa.style.animationDuration = `${Math.random() * 4 + 4}s`;
        brasa.style.animationDelay = `${Math.random() * 5}s`;
        contenedor.appendChild(brasa);
    }
}
crearEfectoCenizasFondo();

// Parallax 3D
const tarjeta = document.getElementById('tarjeta3D');
if (tarjeta) {
    document.addEventListener('mousemove', (e) => {
        if (juegoActivo) return;
        const x = (window.innerWidth / 2 - e.pageX) / 30;
        const y = (window.innerHeight / 2 - e.pageY) / 30;
        tarjeta.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
    });
}

// Colores de ropa
const coloresRopa = [0x2ecc71, 0x3498db, 0xff69b4, 0x9b59b6, 0xf1c40f, 0xe67e22];
const coloresHex = ['#2ecc71', '#3498db', '#ff69b4', '#9b59b6', '#f1c40f', '#e67e22'];
let indiceColorActual = 0;

let configuracionNivel = { velocidadCaida: 0.1, frecuenciaGeneracion: 1200, nombre: "" };

function seleccionarColor(indice, elementoBtn) {
    iniciarAudio();
    reproducirSonido('cambioRopa');

    indiceColorActual = indice;
    const botones = document.querySelectorAll('.btn-color-3d');
    botones.forEach(btn => btn.classList.remove('activo'));
    elementoBtn.classList.add('activo');

    const tarjetaEst = document.getElementById('tarjetaEstudiante');
    if (tarjetaEst) {
        tarjetaEst.style.borderColor = coloresHex[indice];
        tarjetaEst.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.4), 0 0 20px ${coloresHex[indice]}88`;
    }
}

// === MINIJUEGO DE TRIVIA ===
const bancoPreguntas = [
    {
        pregunta: "¿Qué indica el Nivel de Alerta Naranja en el Volcán Puracé?",
        opciones: [
            "A) El volcán está totalmente apagado.",
            "B) Cambios significativos en la actividad con posible erupción en días o semanas.",
            "C) Situación normal sin ningún tipo de riesgo.",
            "D) Fin de la emergencia volcánica."
        ],
        correcta: 1,
        explicacion: "¡Correcto! La Alerta Naranja señala cambios importantes en gases y sismicidad."
    },
    {
        pregunta: "¿Cuál es el elemento principal para proteger la respiración ante la caída de ceniza?",
        opciones: [
            "A) Gafas de sol de plástico.",
            "B) Mascarilla o tapabocas N95 / paño húmedo.",
            "C) Casco de seguridad industrial.",
            "D) Guantes de cuero."
        ],
        correcta: 1,
        explicacion: "¡Muy bien! El tapabocas N95 o paño húmedo evita la inhalación de micropartículas y azufre."
    },
    {
        pregunta: "¿Qué debes hacer con las fuentes y tanques de agua potable en tu hogar?",
        opciones: [
            "A) Dejarlos abiertos para recolectar agua de lluvia.",
            "B) Taparlos y cubrirlos para evitar la contaminación con ceniza.",
            "C) Mezclarlos con ceniza volcánica.",
            "D) Vaciarlos por completo a la intemperie."
        ],
        correcta: 1,
        explicacion: "¡Excelente! Cubrir el agua evita afecciones digestivas por ceniza acumulada."
    },
    {
        pregunta: "¿Qué río principal de la región podría verse afectado por lahares o flujos de lodo?",
        opciones: [
            "A) Río Amazonas.",
            "B) Río Cauca.",
            "C) Río Magdalena.",
            "D) Río Atrato."
        ],
        correcta: 1,
        explicacion: "¡Correcto! El río Cauca nace cerca del macizo colombiano y requiere constante monitoreo."
    }
];

let indicePreguntaActual = 0;
let puntosTrivia = 0;

function abrirTrivia() {
    iniciarAudio();
    document.getElementById("tarjeta3D").style.display = "none";
    document.getElementById("contenedorTrivia").style.display = "block";
    indicePreguntaActual = 0;
    puntosTrivia = 0;
    document.getElementById("puntosTrivia").innerText = puntosTrivia;
    cargarPreguntaTrivia();
}

function cargarPreguntaTrivia() {
    const retro = document.getElementById("retroalimentacionTrivia");
    retro.innerText = "";
    
    if (indicePreguntaActual >= bancoPreguntas.length) {
        document.getElementById("txtPregunta").innerText = `🎉 ¡Completaste el Desafío! Lograste ${puntosTrivia} de ${bancoPreguntas.length * 20} puntos.`;
        document.getElementById("opcionesTrivia").innerHTML = "";
        return;
    }

    const q = bancoPreguntas[indicePreguntaActual];
    document.getElementById("txtPregunta").innerText = q.pregunta;

    const contOpciones = document.getElementById("opcionesTrivia");
    contOpciones.innerHTML = "";

    q.opciones.forEach((op, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-opcion-trivia";
        btn.innerText = op;
        btn.onclick = () => verificarRespuestaTrivia(index);
        contOpciones.appendChild(btn);
    });
}

function verificarRespuestaTrivia(indiceSeleccionado) {
    const q = bancoPreguntas[indicePreguntaActual];
    const retro = document.getElementById("retroalimentacionTrivia");

    if (indiceSeleccionado === q.correcta) {
        puntosTrivia += 20;
        document.getElementById("puntosTrivia").innerText = puntosTrivia;
        retro.style.color = "#1dd1a1";
        retro.innerText = q.explicacion;
        reproducirSonido('salud');
    } else {
        retro.style.color = "#ff6b6b";
        retro.innerText = "❌ Respuesta incorrecta. " + q.explicacion;
        reproducirSonido('malo');
    }

    const btns = document.querySelectorAll(".btn-opcion-trivia");
    btns.forEach(b => b.disabled = true);

    setTimeout(() => {
        indicePreguntaActual++;
        cargarPreguntaTrivia();
    }, 2200);
}

function volverMenu() {
    document.getElementById("contenedorTrivia").style.display = "none";
    document.getElementById("tarjeta3D").style.display = "block";
}

// === INICIO DEL JUEGO 3D ===
function iniciarJuego(dificultad) {
    iniciarAudio();

    if (dificultad === 'facil') {
        configuracionNivel = { velocidadCaida: 0.08, frecuenciaGeneracion: 1500, nombre: "Fácil" };
    } else if (dificultad === 'medio') {
        configuracionNivel = { velocidadCaida: 0.15, frecuenciaGeneracion: 1000, nombre: "Medio" };
    } else if (dificultad === 'dificil') {
        configuracionNivel = { velocidadCaida: 0.25, frecuenciaGeneracion: 600, nombre: "Difícil" };
    }

    document.getElementById("tarjeta3D").style.display = "none";
    document.getElementById("contenedorJuego").style.display = "block";
    document.getElementById("txtNivel").innerText = `Nivel: ${configuracionNivel.nombre}`;

    inicializarEscena3D();
    setInterval(crearObjeto3D, configuracionNivel.frecuenciaGeneracion);
    juegoActivo = true;
    animar();
}

function inicializarEscena3D() {
    const contenedor = document.getElementById("canvas3d");

    escena = new THREE.Scene();
    escena.background = new THREE.Color(0x1a252f);
    escena.fog = new THREE.FogExp2(0x1a252f, 0.03);

    camara = new THREE.PerspectiveCamera(60, 800 / 450, 0.1, 1000);
    camara.position.set(0, 3, 10);
    camara.lookAt(0, 1, 0);

    renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(800, 450);
    contenedor.appendChild(renderizador.domElement);

    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.85);
    escena.add(luzAmbiente);

    const luzVolcan = new THREE.DirectionalLight(0xff7f50, 1.0);
    luzVolcan.position.set(0, 10, -10);
    escena.add(luzVolcan);

    const geoSuelo = new THREE.PlaneGeometry(30, 30);
    const matSuelo = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const suelo = new THREE.Mesh(geoSuelo, matSuelo);
    suelo.rotation.x = -Math.PI / 2;
    escena.add(suelo);

    const geoVolcan = new THREE.ConeGeometry(8, 10, 16);
    const matVolcan = new THREE.MeshLambertMaterial({ color: 0x11161d });
    volcan = new THREE.Mesh(geoVolcan, matVolcan);
    volcan.position.set(0, 4, -15);
    escena.add(volcan);

    personaje = crearPersonajeHumano3D();
    personaje.position.set(0, 0, 0);
    escena.add(personaje);

    window.addEventListener("keydown", (e) => {
        teclas[e.key] = true;
        if (e.key === 'c' || e.key === 'C') {
            cambiarColorRopa();
        }
    });
    window.addEventListener("keyup", (e) => teclas[e.key] = false);
}

function crearPersonajeHumano3D() {
    const grupoPersona = new THREE.Group();

    const geoTorso = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const matTorso = new THREE.MeshLambertMaterial({ color: coloresRopa[indiceColorActual] });
    torsoMesh = new THREE.Mesh(geoTorso, matTorso);
    torsoMesh.position.y = 1.1;
    grupoPersona.add(torsoMesh);

    const geoCabeza = new THREE.SphereGeometry(0.35, 16, 16);
    const matCabeza = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const cabeza = new THREE.Mesh(geoCabeza, matCabeza);
    cabeza.position.y = 2.0;
    grupoPersona.add(cabeza);

    const geoPierna = new THREE.CylinderGeometry(0.12, 0.12, 1);
    const matPierna = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

    const piernaIzq = new THREE.Mesh(geoPierna, matPierna);
    piernaIzq.position.set(-0.25, 0.5, 0);
    grupoPersona.add(piernaIzq);

    const piernaDer = new THREE.Mesh(geoPierna, matPierna);
    piernaDer.position.set(0.25, 0.5, 0);
    grupoPersona.add(piernaDer);

    return grupoPersona;
}

function cambiarColorRopa() {
    reproducirSonido('cambioRopa');
    indiceColorActual = (indiceColorActual + 1) % coloresRopa.length;
    torsoMesh.material.color.setHex(coloresRopa[indiceColorActual]);
}

// Modelos 3D de Coleccionables
function crearModeloTapabocasN95() {
    const grupo = new THREE.Group();
    const geo = new THREE.ConeGeometry(0.4, 0.4, 4);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mascarilla = new THREE.Mesh(geo, mat);
    mascarilla.rotation.x = Math.PI / 2;
    grupo.add(mascarilla);

    const geoFiltro = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
    const matFiltro = new THREE.MeshLambertMaterial({ color: 0x3498db });
    const filtro = new THREE.Mesh(geoFiltro, matFiltro);
    filtro.position.z = 0.2;
    filtro.rotation.x = Math.PI / 2;
    grupo.add(filtro);

    return grupo;
}

function crearModeloBotiquin() {
    const grupo = new THREE.Group();
    const geoCaja = new THREE.BoxGeometry(0.6, 0.5, 0.2);
    const matCaja = new THREE.MeshLambertMaterial({ color: 0xf5f6fa });
    const caja = new THREE.Mesh(geoCaja, matCaja);
    grupo.add(caja);

    const geoCruz1 = new THREE.BoxGeometry(0.1, 0.3, 0.22);
    const matCruz = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const cruz1 = new THREE.Mesh(geoCruz1, matCruz);
    grupo.add(cruz1);

    const geoCruz2 = new THREE.BoxGeometry(0.3, 0.1, 0.22);
    const cruz2 = new THREE.Mesh(geoCruz2, matCruz);
    grupo.add(cruz2);

    return grupo;
}

function crearModeloMochila() {
    const grupo = new THREE.Group();
    const geoMochila = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const matMochila = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    const mochila = new THREE.Mesh(geoMochila, matMochila);
    grupo.add(mochila);

    const geoBolsillo = new THREE.BoxGeometry(0.4, 0.3, 0.15);
    const matBolsillo = new THREE.MeshLambertMaterial({ color: 0xd35400 });
    const bolsillo = new THREE.Mesh(geoBolsillo, matBolsillo);
    bolsillo.position.set(0, -0.1, 0.18);
    grupo.add(bolsillo);

    return grupo;
}

function crearModeloBotellaAgua() {
    const grupo = new THREE.Group();
    const geoCuerpo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 12);
    const matCuerpo = new THREE.MeshLambertMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.85 });
    const cuerpo = new THREE.Mesh(geoCuerpo, matCuerpo);
    grupo.add(cuerpo);

    const geoTapa = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
    const matTapa = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const tapa = new THREE.Mesh(geoTapa, matTapa);
    tapa.position.y = 0.35;
    grupo.add(tapa);

    return grupo;
}

function crearModeloRocaVolcanica() {
    const geo = new THREE.DodecahedronGeometry(0.45);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4b4b4b });
    return new THREE.Mesh(geo, mat);
}

function crearObjeto3D() {
    if (!juegoActivo) return;

    const categorias = ['salud', 'puntos', 'malo'];
    const categoria = categorias[Math.floor(Math.random() * categorias.length)];
    let mesh;

    if (categoria === 'salud') {
        mesh = (Math.random() > 0.5) ? crearModeloTapabocasN95() : crearModeloBotiquin();
        mesh.userData = { tipo: 'salud' };
    } else if (categoria === 'puntos') {
        mesh = (Math.random() > 0.5) ? crearModeloMochila() : crearModeloBotellaAgua();
        mesh.userData = { tipo: 'puntos' };
    } else {
        mesh = crearModeloRocaVolcanica();
        mesh.userData = { tipo: 'malo' };
    }

    mesh.position.set((Math.random() - 0.5) * 10, 8, 0);
    escena.add(mesh);
    objetos.push(mesh);
}

function animar() {
    if (!juegoActivo) return;

    requestAnimationFrame(animar);

    if ((teclas["ArrowLeft"] || teclas["a"] || teclas["A"]) && personaje.position.x > -5) {
        personaje.position.x -= 0.15;
    }
    if ((teclas["ArrowRight"] || teclas["d"] || teclas["D"]) && personaje.position.x < 5) {
        personaje.position.x += 0.15;
    }

    for (let i = objetos.length - 1; i >= 0; i--) {
        let obj = objetos[i];
        obj.position.y -= configuracionNivel.velocidadCaida;
        obj.rotation.y += 0.03;
        obj.rotation.x += 0.01;

        const distancia = personaje.position.distanceTo(obj.position);
        if (distancia < 1.0) {
            if (obj.userData.tipo === 'salud') {
                salud = Math.min(100, salud + 15);
                reproducirSonido('salud');
            } else if (obj.userData.tipo === 'puntos') {
                puntos += 15;
                reproducirSonido('puntos');
            } else if (obj.userData.tipo === 'malo') {
                salud -= 20;
                reproducirSonido('malo');
            }

            actualizarMarcadores();
            escena.remove(obj);
            objetos.splice(i, 1);
            continue;
        }

        if (obj.position.y < 0) {
            escena.remove(obj);
            objetos.splice(i, 1);
        }
    }

    if (salud <= 0) {
        juegoActivo = false;
        reproducirSonido('gameOver');
        setTimeout(() => {
            alert(`¡Juego Terminado!\nPuntuación final: ${puntos}\nRecuerda llevar siempre tu kit de emergencia durante la Alerta Naranja del volcán Puracé.`);
            window.location.reload();
        }, 300);
    }

    renderizador.render(escena, camara);
}

function actualizarMarcadores() {
    document.getElementById("txtSalud").innerText = `Salud: ${salud}%`;
    document.getElementById("txtPuntos").innerText = `Puntos: ${puntos}`;
}