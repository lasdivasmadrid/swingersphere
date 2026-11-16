# Política de Seguridad y Programa de Bug Bounty — SwingerSphere

En **SwingerSphere**, la privacidad, discreción y seguridad de nuestra comunidad y de los clubes asociados es nuestra prioridad absoluta. Agradecemos y apoyamos activamente el trabajo de investigadores de seguridad ética (hackers éticos) para ayudarnos a mantener la plataforma protegida frente a amenazas emergentes.

---

## 1. Alcance del Programa (Scope)

### ✅ En Alcance (In-Scope)
- **Aplicación Web / PWA:** `https://www.swingersphere.com`
- **Código Fuente y Configuración del Repositorio:** `https://github.com/lasdivasmadrid/swingersphere`
- **Integraciones y Lógica de Negocio:**
  - Sistema de reputación y consentimiento: **TrustScore™** y **Consent Vault™**.
  - Control de accesos y validación de membresías PRO / Trial.
  - Sincronización y perfiles de clubes (inyecciones, exposición indebida de datos, bypass de reservas).
  - Sanitización de entradas y prevención de ataques XSS / CSRF / Inyecciones.
  - Almacenamiento seguro en cliente (cifrado WebCrypto AES-GCM / HMAC).

### ❌ Fuera de Alcance (Out-of-Scope)
- Ataques de denegación de servicio (DoS / DDoS).
- Ingeniería social, phishing o ataques físicos contra empleados, socios o clubes.
- Vulnerabilidades en pasarelas o servicios de terceros (Google Gemini, OpenAI, Tronscan, Etherscan, Transak).
- Problemas teóricos sin prueba de concepto (PoC) explotable demostrada.
- Reportes automatizados de escáneres (sin verificación manual ni impacto real probado).

---

## 2. Niveles de Severidad y Recompensas (Bug Bounty Tiers)

Clasificamos las vulnerabilidades según el estándar **CVSS v3.1**:

| Nivel | Severidad | Tipología de Vulnerabilidades | Recompensa / Reconocimiento |
| :---: | :---: | :--- | :--- |
| **P1** | **Crítica** (CVSS 9.0 - 10.0) | Ejecución remota de código (RCE), Bypass total de autenticación, Filtración masiva de datos privados de usuarios (PII / chats), Robo de fondos/cripto. | Recompensa monetaria preferencial + Membresía PRO Vitalicia + Hall of Fame |
| **P2** | **Alta** (CVSS 7.0 - 8.9) | Inyección SQL / NoSQL, XSS almacenado (Stored XSS) de alto impacto, Acceso no autorizado a perfiles privados (BOLA/IDOR), Falsificación de firmas criptográficas. | Recompensa monetaria / Bono + Membresía PRO Vitalicia + Hall of Fame |
| **P3** | **Media** (CVSS 4.0 - 6.9) | XSS reflejado (Reflected XSS), CSRF con impacto sensible, Escalada menor de privilegios en el estado de prueba, Fallos en lógica de reservas. | Recompensa o Bono + Suscripción Anual PRO + Hall of Fame |
| **P4** | **Baja / Informativa** (CVSS 0.1 - 3.9) | Divulgación de versiones, Cabeceras de seguridad ausentes sin impacto directo, Clickjacking en páginas no sensibles. | Agradecimiento en el Hall of Fame |

---

## 3. Cláusula de Puerto Seguro (Safe Harbor)

Si realizas tus actividades de investigación de seguridad conforme a esta política:
- Consideramos tu investigación **autorizada y legal** bajo la legislación aplicable de protección de datos y ciberdelincuencia.
- Nos comprometemos a **no emprender acciones legales** civiles ni penales contra ti.
- Si un tercero emprende acciones legales en tu contra en relación con actividades cubiertas por este programa, dejaremos constancia de que actuaste de buena fe y con nuestra autorización.

### Reglas de Compromiso de Buena Fe:
1. No destruyas ni alteres datos reales de usuarios o de salas comerciales.
2. Si descubres acceso a datos privados, detén inmediatamente la prueba y notifícalo sin descargar ni compartir los datos.
3. Respeta un plazo de **divulgación coordinada (Coordinated Disclosure)** de 90 días antes de publicar cualquier información técnica, para permitir que el equipo de ingeniería parchee la vulnerabilidad.

---

## 4. Proceso de Reporte y Acuerdos de Nivel de Servicio (SLAs)

Para reportar una vulnerabilidad:
- Envía un correo cifrado (o texto plano si no manejas PGP) a: **`security@swingersphere.com`**
- Asunto sugerido: `[VULN REPORT] - Tipo de Fallo - Componente Afectado`
- Incluye:
  1. Descripción detallada del impacto.
  2. Pasos de reproducción paso a paso o script PoC.
  3. Capturas de pantalla o logs relevantes.
  4. Tu nombre o alias para el Hall of Fame.

### Nuestros Compromisos de Respuesta:
- **Primer Acuse de Recibo:** Menos de **24 horas**.
- **Evaluación y Triaje Inicial:** Menos de **48 horas**.
- **Notificación del Parche / Corrección:** Menos de **7 a 14 días** según criticidad.

---

## 5. Contacto Canónico (RFC 9116)
Nuestro archivo canónico de contacto de seguridad se encuentra en:
`https://www.swingersphere.com/.well-known/security.txt`
