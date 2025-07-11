document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    console.log({ username, password });

    const response = await fetch("http://localhost:8080/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const token = await response.text();
      localStorage.setItem("adminToken", token);

      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        window.location.href = "../dashboard/usuarios.html"; // o el panel que diseñes
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Credenciales inválidas",
        text: "Verifica usuario y contraseña",
      });
    }
  } catch (err) {
    console.error("Error:", err);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo conectar con el servidor",
    });
  }
});
