document.addEventListener("DOMContentLoaded", () => {
    const apiBase = "http://192.168.1.3:8080";
    const box1 = document.getElementById("camara-box-1");
    const btnOn1 = document.getElementById("btnOn1");
    const btnOff1 = document.getElementById("btnOff1");

    let cameraId = null;

    // Carga la cámara 1 y guarda el ID real
    async function loadCamera1() {
        box1.textContent = "Cargando cámara…";
        try {
            const res = await fetch(`${apiBase}/api/camaras`);
            if (!res.ok) throw new Error(res.statusText);
            const cams = await res.json();

            const cam1 = cams[0]; // la primera cámara disponible
            if (!cam1) throw new Error("No hay cámaras");

            cameraId = cam1.id;

            if (!cam1.activa) {
                box1.textContent = "No disponible";
            } else {
                box1.innerHTML = `
        <img
          src="${cam1.url}"
          alt="Cámara 1"
          style="width:100%; border-radius:4px;"
        />
      `;
            }
        } catch (err) {
            console.error("Error cargando cámara:", err);
            box1.textContent = "Error al cargar cámara";
        }
    }

    async function toggleCamera1(activa) {
        try {
            if (!cameraId) return;
            await fetch(`${apiBase}/api/camaras/${cameraId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activa })
            });
            await loadCamera1();
        } catch (err) {
            console.error("Error cambiando estado:", err);
        }
    }

    btnOn1.addEventListener("click", () => toggleCamera1(true));
    btnOff1.addEventListener("click", () => toggleCamera1(false));

    loadCamera1();



});



document.getElementById("btnPagos").addEventListener("click", () => {
    window.location.href = "../dashboard/pagos.html";
});

document.getElementById("btnUsuarios").addEventListener("click", () => {
    window.location.href = "../dashboard/usuarios.html";
});

document.getElementById("btnCamaras").addEventListener("click", () => {
    window.location.href = "../dashboard/camaras.html";
});

document.getElementById("btnAcceso-puerta").addEventListener("click", () => {
    window.location.href = "../dashboard/acceso-puerta.html";
});