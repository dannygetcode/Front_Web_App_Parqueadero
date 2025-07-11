document.addEventListener("DOMContentLoaded", async () => {



    const token = localStorage.getItem("adminToken");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    let currentPage = 1;
    const pageSize = 10;
    let usuarios = [];

    const tabla = document.getElementById("tablaUsuarios");

    function renderTablaUsuarios(editing = false) {
        tabla.innerHTML = "";

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedUsuarios = usuarios.slice(start, end);

        paginatedUsuarios.forEach(u => {
            const fila = document.createElement("tr");

            const inputOrText = (campo, value) => {
                return editing
                    ? `<input type="text" class="form-control form-control-sm" data-id="${u.id}" data-field="${campo}" value="${value || ""}">`
                    : value || "-";
            };

            fila.innerHTML = `
              <td>${u.id}</td>
              <td>${inputOrText("placa", u.placa)}</td>
              <td>${inputOrText("telefono", u.telefono)}</td>
              <td>${u.codigoValidacion || "-"}</td>
              <td>${inputOrText("pin", u.pin)}</td>
              <td><button class="btn btn-outline-info btn-sm" onclick="abrirDetalle(${u.id})">Ver detalle</button></td>
              <td><button class="btn btn-outline-secondary btn-sm" onclick="abrirPagosUsuario(${u.id})">Ver registros</button></td>
                <td>
                    <button 
                        class="btn btn-sm btn-${u.estado === 'ACTIVO' ? 'success' : u.estado === 'VENCIDO' ? 'warning' : 'secondary'}"
                        onclick="abrirModalCambioEstado(${u.id}, '${u.estado}')">
                        ${u.estado}
                    </button>
                </td>
                <td>
                    <button class="btn btn-outline-warning btn-sm" onclick="activarEdicion()">Editar</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                </td>

            `;
            tabla.appendChild(fila);
        });

        // Actualizar paginador
        const totalPages = Math.ceil(usuarios.length / pageSize);
        document.getElementById("pageInfo").textContent = `${currentPage} de ${totalPages}`;
    }


    window.activarEdicion = function () {
        document.getElementById("btnGuardarEdicion").style.display = "inline-block";
        document.getElementById("btnCancelarEdicion").style.display = "inline-block";
        renderTablaUsuarios(true);
    };

    document.getElementById("btnCancelarEdicion").addEventListener("click", () => {
        document.getElementById("btnGuardarEdicion").style.display = "none";
        document.getElementById("btnCancelarEdicion").style.display = "none";
        renderTablaUsuarios(false);
    });

    document.getElementById("btnGuardarEdicion").addEventListener("click", async () => {
        const inputs = document.querySelectorAll("input[data-id]");
        const cambiosPorUsuario = {};

        inputs.forEach(input => {
            const id = input.dataset.id;
            const campo = input.dataset.field;
            const valor = input.value;

            if (!cambiosPorUsuario[id]) cambiosPorUsuario[id] = {};
            cambiosPorUsuario[id][campo] = valor;
        });

        try {
            await Promise.all(Object.entries(cambiosPorUsuario).map(async ([id, datos]) => {
                const res = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem("adminToken")
                    },
                    body: JSON.stringify(datos)
                });

                if (!res.ok) throw new Error("Fallo al actualizar ID: " + id);
            }));

            Swal.fire("Éxito", "Todos los cambios se guardaron correctamente", "success");

            document.getElementById("btnGuardarEdicion").style.display = "none";
            document.getElementById("btnCancelarEdicion").style.display = "none";

            const res = await fetch("http://localhost:8080/api/usuarios", {
                headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }
            });
            if (!res.ok) throw new Error("Error al recargar usuarios");

            usuarios = await res.json();
            usuarios.sort((a, b) => b.id - a.id); // si estás ordenando
            renderTablaUsuarios(false);


        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Ocurrió un problema al guardar los cambios", "error");
        }
    });


    window.abrirModalCambioEstado = function (id, estadoActual) {
        document.getElementById("estadoUsuarioId").value = id;
        document.getElementById("selectNuevoEstado").value = estadoActual;

        const modal = new bootstrap.Modal(document.getElementById("modalCambioEstado"));
        modal.show();
    };

    document.getElementById("btnConfirmarCambioEstado").addEventListener("click", async () => {
        const id = document.getElementById("estadoUsuarioId").value;
        const nuevoEstado = document.getElementById("selectNuevoEstado").value;

        try {
            const res = await fetch(`http://localhost:8080/api/usuarios/${id}/estado?estado=${nuevoEstado}`, {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("adminToken")
                }
            });

            if (!res.ok) throw new Error("Error al cambiar estado");

            Swal.fire("¡Éxito!", "El estado fue actualizado correctamente", "success");
            location.reload();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo cambiar el estado", "error");
        }
    });




    window.abrirDetalle = function (id) {
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) return;

        document.getElementById("detalleId").value = usuario.id;
        document.getElementById("detalleNombre").value = usuario.nombre || "";
        document.getElementById("detalleApellido").value = usuario.apellido || "";
        document.getElementById("detalleTelefono").value = usuario.telefono || "";
        document.getElementById("detallePlaca").value = usuario.placa || "";
        document.getElementById("detalleCodigo").value = usuario.codigoValidacion || "";
        document.getElementById("detallePin").value = usuario.pin || "";

        const modalElement = document.getElementById("detalleUsuarioModal");
        const instanciaPrev = bootstrap.Modal.getInstance(modalElement);
        if (instanciaPrev) instanciaPrev.hide();
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    };

    document.getElementById("guardarCambiosBtn").addEventListener("click", async () => {
        const id = document.getElementById("detalleId").value;

        const actualizado = {
            nombre: document.getElementById("detalleNombre").value,
            apellido: document.getElementById("detalleApellido").value,
            placa: document.getElementById("detallePlaca").value,
        };

        try {
            const res = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("adminToken")
                },
                body: JSON.stringify(actualizado)
            });

            if (!res.ok) throw new Error("Error al guardar");

            Swal.fire("Actualizado", "Los datos fueron guardados correctamente", "success");

            const modalElement = document.getElementById("detalleUsuarioModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();


            const index = usuarios.findIndex(u => u.id == id);
            if (index !== -1) {
                usuarios[index].nombre = actualizado.nombre;
                usuarios[index].apellido = actualizado.apellido;
                usuarios[index].placa = actualizado.placa;
            }


            renderTablaUsuarios();



        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo guardar", "error");
        }

    });



    try {
        const res = await fetch("http://localhost:8080/api/usuarios", {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error("No se pudo obtener la lista");

        usuarios = await res.json();
        usuarios.sort((a, b) => b.id - a.id); // Orden descendente

        renderTablaUsuarios();


    } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudieron cargar los usuarios", "error");
    }

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablaUsuarios();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(usuarios.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderTablaUsuarios();
        }
    });

    window.abrirPagosUsuario = async function (idUsuario) {
        const tablaPagos = document.getElementById("tablaPagosUsuario");
        tablaPagos.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

        try {
            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById("modalPagosUsuario"));
                modal.show();
            }, 100);

            const usuario = usuarios.find(u => u.id === idUsuario);
            if (!usuario || !usuario.placa) throw new Error("Placa no disponible");

            const res = await fetch("http://localhost:8080/api/pagos", {
                headers: { "Authorization": "Bearer " + localStorage.getItem("adminToken") }
            });

            if (!res.ok) throw new Error("No se pudieron obtener los pagos");

            const todosLosPagos = await res.json();
            const pagos = todosLosPagos.filter(p => p.placa === usuario.placa);

            if (pagos.length === 0) {
                tablaPagos.innerHTML = "<tr><td colspan='4'>Sin pagos registrados</td></tr>";
            } else {
                tablaPagos.innerHTML = "";
                console.log("Pagos filtrados por placa:", pagos);
                pagos.forEach(p => {
                    const fila = document.createElement("tr");

                    // Usa preferencia por OCR si existe
                    const fecha = p.paymentDate || "-";
                    const valor = p.amount || 0;

                    fila.innerHTML = `
        <td>${fecha}</td>
        <td>${p.serviceStart || "-"}</td>
        <td>${p.serviceEnd || "-"}</td>
        <td>$${Number(valor).toLocaleString()}</td>
    `;
                    tablaPagos.appendChild(fila);
                });

            }

            const modal = new bootstrap.Modal(document.getElementById("modalPagosUsuario"));
            modal.show();


        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudieron cargar los pagos", "error");
        }
    };

    window.eliminarUsuario = async function (id) {
        const confirmar = await Swal.fire({
            title: "¿Eliminar usuario?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!confirmar.isConfirmed) return;

        try {
            const res = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("adminToken")
                }
            });

            if (!res.ok) throw new Error("Error al eliminar");

            Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");

            usuarios = usuarios.filter(u => u.id !== id);
            renderTablaUsuarios();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo eliminar el usuario", "error");
        }
    };

    // Botono Crear +
    document.getElementById("btnGuardarUsuario").addEventListener("click", async () => {
        const placa = document.getElementById("inputPlaca").value.trim();
        const telefono = document.getElementById("inputTelefono").value.trim();
        const pin = document.getElementById("inputPin").value.trim();

        if (!placa || !telefono || !pin || pin.length !== 4) {
            Swal.fire("Error", "Todos los campos son obligatorios y el PIN debe tener 4 dígitos.", "warning");
            return;
        }

        try {
            // Paso 1: Registrar usuario
            const response = await fetch("http://localhost:8080/api/usuarios/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ placa, telefono })
            });

            if (!response.ok) throw new Error("Error al registrar");

            // Paso 2: Asignar PIN con código recibido
            const data = await response.json();
            const codigo = data.codigoValidacion ?? data.codigo ?? data.codigoValidacionGenerado ?? null;

            if (!codigo) {
                Swal.fire("Advertencia", "El código de validación no se recibió correctamente.", "info");
                return;
            }

            const pinRes = await fetch("http://localhost:8080/api/usuarios/validar?telefono=" + telefono + "&codigo=" + codigo + "&nuevoPin=" + pin, {
                method: "POST"
            });

            if (!pinRes.ok) throw new Error("Error al asignar PIN");

            Swal.fire("¡Éxito!", "Usuario registrado correctamente", "success").then(() => {
                // Opcional: recargar usuarios
                location.reload();
            });

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Hubo un problema al registrar el usuario", "error");
        }
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



});

document.getElementById("modalPagosUsuario").addEventListener("hidden.bs.modal", () => {
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach(b => b.remove());


    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
});

const inputPlaca = document.getElementById("inputPlaca");

inputPlaca.addEventListener("input", function (e) {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); // solo letras y números
    let letras = raw.slice(0, 3);  // máx 3 letras
    let numeros = raw.slice(3, 6); // máx 3 números
    let resultado = letras;

    if (letras.length === 3) {
        resultado += "-";
    }

    if (numeros.length > 0) {
        resultado += numeros;
    }

    e.target.value = resultado;
});




