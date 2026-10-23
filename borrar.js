// H68: borra el correo de recuperación sin la app. Habla solo con las funciones de Supabase (ver la CSP del HTML).
"use strict";

const SERVIDOR = "https://nykddykyageaxbeqivaa.supabase.co/functions/v1";
const $ = (id) => document.getElementById(id);
let correo = "";

function mostrar(paso) {
  for (const id of ["paso-correo", "paso-codigo", "paso-listo"]) $(id).hidden = id !== paso;
}

function avisar(texto, error = false) {
  $("mensaje").textContent = texto;
  $("mensaje").className = error ? "error" : "";
}

async function llamar(funcion, cuerpo) {
  const respuesta = await fetch(`${SERVIDOR}/${funcion}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  return { codigo: respuesta.status, estado: datos.estado };
}

async function conBoton(boton, accion) {
  boton.disabled = true;
  try {
    await accion();
  } catch {
    avisar("No se pudo conectar. Revisa tu internet e inténtalo de nuevo.", true);
  } finally {
    boton.disabled = false;
  }
}

$("enviar").addEventListener("click", () =>
  conBoton($("enviar"), async () => {
    const valor = $("correo").value.trim();
    if (!$("correo").checkValidity() || valor === "") return avisar("Escribe un correo válido.", true);
    const r = await llamar("request-delete", { email: valor });
    if (r.codigo === 429) return avisar("Ya pediste 3 códigos en la última hora. Espera un rato e inténtalo de nuevo.", true);
    if (r.codigo !== 200) return avisar("Algo falló en el servidor. Inténtalo de nuevo en unos minutos.", true);
    correo = valor;
    avisar("");
    mostrar("paso-codigo");
    $("codigo").focus();
  }),
);

$("confirmar").addEventListener("click", () =>
  conBoton($("confirmar"), async () => {
    const valor = $("codigo").value.trim();
    if (!/^\d{6}$/.test(valor)) return avisar("El código tiene 6 dígitos.", true);
    const r = await llamar("confirm-delete", { email: correo, code: valor });
    if (r.codigo === 200) {
      avisar("");
      return mostrar("paso-listo");
    }
    const textos = {
      incorrecto: "Código incorrecto. Revísalo e inténtalo de nuevo.",
      agotado: "Se agotaron los intentos para este código. Pide uno nuevo.",
      sin_codigo: "El código venció o ya se usó. Pide uno nuevo.",
    };
    avisar(textos[r.estado] ?? "Algo falló en el servidor. Inténtalo de nuevo en unos minutos.", true);
  }),
);

$("otro").addEventListener("click", () => {
  $("codigo").value = "";
  avisar("");
  mostrar("paso-correo");
});
