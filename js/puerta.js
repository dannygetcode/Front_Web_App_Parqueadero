
document.getElementById("btnUsuarios").addEventListener("click", () => {
    window.location.href = "../dashboard/usuarios.html";
});

document.getElementById("btnPagos").addEventListener("click", () => {
    window.location.href = "../dashboard/pagos.html";
});

document.getElementById("btnCamaras").addEventListener("click", () => {
    window.location.href = "../dashboard/camaras.html";
});

document.getElementById("btnAcceso-puerta").addEventListener("click", () => {
    window.location.href = "../dashboard/acceso-puerta.html";
});

const botonPuerta = document.getElementById("botonPuerta");


async function cargarEstadoInicial() {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:8080/api/puerta", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Error al obtener estado");

        const data = await res.json();
        actualizarBotonVisual(data.abierta);

    } catch (err) {
        console.error("Error al obtener estado inicial:", err);
    }
}


function actualizarBotonVisual(abierta) {
    botonPuerta.classList.toggle("abierto", abierta);
    botonPuerta.classList.toggle("cerrado", !abierta);
    botonPuerta.textContent = abierta ? "Abierto" : "Cerrado";
}


botonPuerta.addEventListener("click", async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const nuevaApertura = !botonPuerta.classList.contains("abierto");

    try {
        const res = await fetch("http://localhost:8080/api/puerta", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ abierta: nuevaApertura })
        });

        if (!res.ok) throw new Error("Error en PUT");

        actualizarBotonVisual(nuevaApertura);

    } catch (err) {
        console.error("Error al cambiar estado:", err);
        alert("No se pudo cambiar el estado de la puerta.");
    }
});


cargarEstadoInicial();

document.addEventListener("DOMContentLoaded", () => {
    const apiBase = "http://192.168.1.3:8080";
    const box1 = document.getElementById("camara-box-1");

    async function loadCamera1() {
        if (!box1) return;
        box1.textContent = "Cargando cámara…";
        try {
            const res = await fetch(`${apiBase}/api/camaras`);
            if (!res.ok) throw new Error(res.statusText);
            const cams = await res.json();

            const cam1 = cams[0];
            if (!cam1 || !cam1.activa) {
                box1.textContent = "No disponible";
                return;
            }

            box1.innerHTML = `
        <img
          src="${cam1.url}"
          alt="Cámara 1"
          style="width:100%; border-radius:4px; max-height:300px; object-fit:cover;"
        />
      `;
        } catch (err) {
            console.error("Error cargando cámara:", err);
            box1.textContent = "Error al cargar cámara";
        }
    }

    loadCamera1();
});
