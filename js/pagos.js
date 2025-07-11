document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return window.location.href = "../index.html";

    document.getElementById("btnPagos").addEventListener("click", () => {
        window.location.href = "../dashboard/pagos.html";
    });

    document.getElementById("btnUsuarios").addEventListener("click", () => {
        window.location.href = "../dashboard/usuarios.html";
    });

    document.getElementById("btnCamaras").addEventListener("click", () => {
        window.location.href = "../dashboard/camaras.html";
    });

    let currentPage = 1;
    const pageSize = 10;
    let pagos = [];

    const tabla = document.getElementById("tablaPagos");

    function renderTablaPagos(editing = false) {
        tabla.innerHTML = "";

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const visibles = pagos.slice(start, end);

        visibles.forEach(p => {
            const fila = document.createElement("tr");

            const inputOrText = (campo, valor) => {
                return editing
                    ? `<input type="text" class="form-control form-control-sm" data-id="${p.id}" data-field="${campo}" value="${valor || ""}">`
                    : valor || "-";
            };


            fila.innerHTML = `
            <td>${p.id}</td>
            <td>${inputOrText("placa", p.placa)}</td>
            <td>${inputOrText("paymentDate", p.paymentDate)}</td>
            <td>${inputOrText("serviceStart", p.serviceStart)}</td>
            <td>${inputOrText("serviceEnd", p.serviceEnd)}</td>
            <td>
                ${editing
                    // en edición, input numérico puro
                    ? `<input 
                        type="number" 
                        class="form-control form-control-sm" 
                        data-id="${p.id}" 
                        data-field="amount" 
                        value="${p.amount || ""}">`
                    // fuera de edición, formato COP
                    : `$${Number(p.amount || 0).toLocaleString("es-CO")}`
                }
            </td>
            <td>
                <button class="btn btn-outline-info btn-sm" onclick="abrirDetallePago(${p.id})">Ver detalle</button>
            </td>
            <td>
                ${!editing
                    ? `<button
                    class="btn btn-outline-warning btn-sm"
                    onclick="activarEdicionPagos()">
                    Editar
                    </button>`
                    : ""
                }
                <button class="btn btn-outline-danger btn-sm"
                        onclick="eliminarPago(${p.id})">
                Eliminar
                </button>
            </td>

        `;
            tabla.appendChild(fila);
        });

        const totalPages = Math.ceil(pagos.length / pageSize);
        document.getElementById("pageInfo").textContent = `${currentPage} de ${totalPages}`;
    }

    try {
        const res = await fetch("http://localhost:8080/api/pagos", {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("Error al obtener pagos");

        pagos = await res.json();
        pagos.sort((a, b) => b.id - a.id);
        renderTablaPagos();
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los pagos", "error");
    }


    window.activarEdicionPagos = function () {
        document.getElementById("btnGuardarEdicion").style.display = "inline-block";
        document.getElementById("btnCancelarEdicion").style.display = "inline-block";
        renderTablaPagos(true);
    };

    document.getElementById("btnCancelarEdicion").addEventListener("click", () => {
        document.getElementById("btnGuardarEdicion").style.display = "none";
        document.getElementById("btnCancelarEdicion").style.display = "none";
        renderTablaPagos(false);
    });

    document.getElementById("btnGuardarEdicion").addEventListener("click", async () => {
        const inputs = document.querySelectorAll("input[data-id]");
        const cambiosPorPago = {};

        inputs.forEach(input => {
            const id = input.dataset.id;
            const campo = input.dataset.field;
            const valor = input.value;

            if (!cambiosPorPago[id]) cambiosPorPago[id] = {};
            cambiosPorPago[id][campo] = valor;
        });

        try {
            await Promise.all(Object.entries(cambiosPorPago).map(async ([id, datos]) => {
                const res = await fetch(`http://localhost:8080/api/pagos/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem("adminToken")
                    },
                    body: JSON.stringify(datos)
                });

                if (!res.ok) throw new Error("Fallo al actualizar pago ID: " + id);
            }));

            Swal.fire("Éxito", "Cambios guardados correctamente", "success");

            document.getElementById("btnGuardarEdicion").style.display = "none";
            document.getElementById("btnCancelarEdicion").style.display = "none";

            const res = await fetch("http://localhost:8080/api/pagos", {
                headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }
            });

            pagos = await res.json();
            pagos.sort((a, b) => b.id - a.id);
            renderTablaPagos(false);

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudieron guardar los cambios", "error");
        }
    });

    window.eliminarPago = async function (id) {
        const confirmar = await Swal.fire({
            title: "¿Eliminar pago?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!confirmar.isConfirmed) return;

        try {
            const res = await fetch(`http://localhost:8080/api/pagos/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("adminToken")
                }
            });

            if (!res.ok) throw new Error("Error al eliminar");

            Swal.fire("Eliminado", "Pago eliminado correctamente", "success");
            pagos = pagos.filter(p => p.id !== id);
            renderTablaPagos();

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo eliminar el pago", "error");
        }
    };



    // 1) Mostrar el modal al pulsar "Crear +"
    document.getElementById("btnCrearPago").addEventListener("click", () => {
        const modal = new bootstrap.Modal(document.getElementById("modalCrearPago"));
        // reset del formulario
        document.getElementById("formCrearPago").reset();
        modal.show();
    });

    // 2) Guardar el pago al pulsar "Guardar"
    document.getElementById("btnGuardarPago").addEventListener("click", async () => {
        const userId = document.getElementById("inputUserId").value.trim();
        const placa = document.getElementById("inputPlacaPago").value.trim();
        const start = document.getElementById("inputServiceStart").value;
        const end = document.getElementById("inputServiceEnd").value;
        const fileInp = document.getElementById("inputPagoImage");
        const sinTransferencia = document.getElementById("checkSinTransferencia").checked;

        if (!userId || !placa || !start || !end) {
            return Swal.fire("Error", "Todos los campos son obligatorios.", "warning");
        }

        // Imagen solo obligatoria si NO está marcado "sin transferencia"
        if (!sinTransferencia && fileInp.files.length === 0) {
            return Swal.fire("Advertencia", "Debe subir el comprobante o marcar 'Sin transferencia'.", "info");
        }

        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("placa", placa);
            formData.append("start", start);
            formData.append("end", end);
            if (!sinTransferencia && fileInp.files.length > 0) {
                formData.append("image", fileInp.files[0]);
            }

            const resp = await fetch("http://localhost:8080/api/pagos", {
                method: "POST",
                body: formData
            });

            if (!resp.ok) {
                const err = await resp.text();
                throw new Error(err || "Error al crear el pago");
            }

            Swal.fire("¡Éxito!", "Pago registrado correctamente.", "success")
                .then(() => location.reload());

        } catch (e) {
            console.error(e);
            Swal.fire("Error", e.message || "No se pudo registrar el pago", "error");
        }
    });




    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablaPagos();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(pagos.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderTablaPagos();
        }
    });

    window.abrirDetallePago = function (id) {
        const pago = pagos.find(p => p.id === id);
        if (!pago) return;

        document.getElementById("imagenRecibo").src = "http://localhost:8080" + pago.imageUrl;

        const modal = new bootstrap.Modal(document.getElementById("detallePagoModal"));
        modal.show();
    };

    document.getElementById("btnAcceso-puerta").addEventListener("click", () => {
        window.location.href = "../dashboard/acceso-puerta.html";
    });




});
