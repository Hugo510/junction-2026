# Handoff técnico — PostgreSQL V2 → backend FastAPI

**Proyecto:** Hiillos — Junction 2026
**Destinatario:** Owais, responsable del backend
**Fecha de revisión:** 15/11/2026
**Estado:** infraestructura preparada y migración aplicada; integración de repositorios pendiente.

## 1. Referencias y límites de esta revisión

Después de `git fetch origin`, se compararon:

| Referencia | Commit | Papel |
|---|---|---|
| uriel/database | 303ecd41828c631c1372356e03874a172fba8fe5 | Infraestructura V2, PR #11 hacia main |
| origin/owais/backend | 0e47b7cc39e93f134b6ad25c539bdce97f97ad4a | Backend más reciente disponible de Owais |
| origin/main | 107b1beb5405a56966d2bffccf91bce68cb60a23 | Versión integrada disponible y contratos móviles revisados |
| Contrato usado al preparar V2 | f5d5698a6b55f2fa8212d4e9a42bf6b5a58749dc | Sensores, consentimientos y seguridad objetivo |

Los cambios de backend entre f5d5698 y 0e47b7c afectan a configuración/documentación
y a respuestas completas del companion; no cambian los contratos de sensores,
check-ins, alertas ni pacientes usados por V2. Main aún no contiene todas esas
correcciones de Owais: no debe usarse su router antiguo como contrato definitivo.
Estas referencias prueban el código disponible, no qué revisión está desplegada.

Este handoff no ejecuta Alembic ni accede a Aiven. Tampoco modifica endpoints,
modelos, migraciones, algoritmos o código móvil. No contiene credenciales.

## 2. Base de datos ya preparada

La ejecución previamente autorizada aplicó **20261114_0001** en **Hiillos.public**,
PostgreSQL 18.7, con CA de Aiven y TLS verify-full. Se verificaron nueve tablas de
aplicación vacías, public.alembic_version, 9 PK, 11 FK, 3 restricciones UNIQUE,
10 índices explícitos y 26 CHECK. Ver [reporte](VALIDATION.md) para evidencia y fecha.
No se ha vuelto a consultar la base durante este handoff; no afirmar que sigue
vacía sin una nueva inspección autorizada.

Tablas: users, patients, professionals, patient_care_team, patient_consents,
auth_sessions, check_ins, alerts, sensor_aggregates.

**La migración inicial ya está aplicada y es inmutable.** No editarla, repetirla
para resolver discrepancias, hacer stamp sobre un esquema desconocido ni ejecutar
un downgrade. Cualquier cambio futuro del esquema requiere una nueva revisión.

Código reutilizable:

- `app/db/models.py`: nueve modelos; nombres SQL y relaciones.
- `app/db/config.py`: DatabaseSettings, prefijo HIILLOS_DB_, public y TLS.
- `app/db/session.py`: build_engine y build_session_factory, síncronos y perezosos.
- `app/db/tokens.py`: hash_session_token, digest SHA-256 de token opaco aleatorio.
- `app/db/base.py`: metadata y filtro de la tabla técnica de Alembic.
- `alembic/versions/20261114_0001_initial.py`: revisión aplicada.

## 3. Inventario de endpoints y persistencia necesaria

Prefijo común **/api/v1**. La autenticación protegida sigue consultando TOKENS,
incluso en rutas que no guardan datos de negocio.

| Método y ruta | Implementación actual de Owais | Tablas / modelos ORM necesarios |
|---|---|---|
| POST /auth/demo-login | DEMO_USERS y TOKENS en auth.py; token nuevo en memoria | users/User, auth_sessions/AuthSession; perfiles sintéticos deben provisionarse por separado |
| GET /me | PATIENTS; perfil anidado en memoria | patients/Patient, patient_consents/PatientConsents, patient_care_team/PatientCareTeam; users/professionals para identidad y asignación |
| PATCH /me | model_copy sobre PATIENTS | patients; traducción explícita de companion/settings a columnas |
| PUT /me/consents | Sustituye Consents dentro de PATIENTS | patient_consents y validación del paciente; timestamp de servidor |
| POST /checkins | CHECKINS como lista por usuario; crea ALERTS si hay riesgo urgente | check_ins/CheckIn y alerts/Alert en una transacción; patients para nombre histórico |
| PUT /checkins/{day} | Reemplaza solo entrada ordinaria, conserva id/created_at; puede crear alerta | check_ins y alerts; bloquear/revalidar el registro reemplazable |
| GET /checkins | Filtra CHECKINS en memoria | check_ins, filtrado por patient_id y rango inclusivo |
| GET /alerts | ALERTS y PATIENTS; solo doctor asignado | alerts + patient_care_team + professionals/patients; no devolver toda la tabla |
| POST /sensors/aggregates | SENSOR_AGGREGATES por paciente, clave (type, periodStart) | sensor_aggregates/SensorAggregate + patient_consents; lote atómico |
| GET /health | Estado/versión estáticos | Ninguna tabla; hoy no prueba disponibilidad PostgreSQL |
| GET /crisis-resources | Catálogo CRISIS_RESOURCES en código | Ninguna tabla; conservar disponibilidad sin depender de PostgreSQL |
| GET /companion/status | Presencia de configuración LLM/voz | Ninguna tabla |
| POST /companion/reply | Token en memoria; regla fija de seguridad y llamada externa | users/auth_sessions para autenticación; no persistir conversación |
| POST /companion/speech | Token en memoria; audio externo devuelto en base64 | users/auth_sessions para autenticación; no persistir texto/audio |

No existen rutas remotas de PHQ, historial de aprendizaje, resultados de acciones
ni lectura de sensores. No crear repositorios imaginando que esos contratos existen.
La detección de crisis del companion devuelve `crisis=true`; esa ruta no crea una
fila en ALERTS. No convertirla silenciosamente en un nuevo contrato de alertas.

## 4. Mapeos obligatorios entre Pydantic y SQLAlchemy

Mantener DTO Pydantic y modelos ORM separados: Patient, CheckIn, Alert y
SensorAggregate tienen nombres repetidos. Usar alias de importación claros.
No devolver directamente objetos ORM: los JSON actuales están anidados y las
columnas no. `from_attributes` por sí solo no reconstruye esos objetos.

| Contrato HTTP / Pydantic | Esquema V2 / precaución |
|---|---|
| Patient.id, userId | UUID interno; patients.id también referencia users.id |
| displayName, language, timeZone, createdAt | display_name, language, time_zone, created_at |
| companion.species/name | companion_species / companion_name |
| settings.theme/largeText/reduceMotion/haptics | Columnas de patients; conservar valores ausentes según la semántica actual de PATCH |
| careTeamIds | Lista reconstruida desde patient_care_team, no un array en patients |
| consents.* | Columnas de patient_consents; careTeamAfterSilence → care_team_after_silence |
| CheckIn.energy/anxiety | Nullable; no completar con 3 ni cero |
| kind | full/chat/journal, default full |
| safety.selfHarmThoughts | self_harm_thoughts obligatorio |
| reactionGame | Cuatro columnas, todas NULL o todas presentes; ausente no equivale a valores cero |
| sleepHours | sleep_hours nullable, horas 0–24; diferente del sueño wearable |
| Alert.patientId / acknowledgedBy | En DTO son strings; en SQL UUID/FK; convertir explícitamente |
| Alert.patientDisplayName | Instantánea histórica; no sustituir por un JOIN al nombre actual |
| Alert.reasons | Array JSONB ordenado de objetos key/text/weight; validar cada objeto con Reason |
| Alert.check_in_id | Columna interna opcional, sin campo equivalente en el DTO actual; no añadirlo a la respuesta HTTP sin revisar contrato |
| Alert.acknowledgedBy | FK a professionals; autorizar asignación en el servicio, no solo existencia de la FK |
| SensorAggregate.type | sensor_type; no cambiar el campo HTTP a sensorType |
| periodStart / periodEnd | period_start / period_end, timestamptz |

### Datos sensibles y huecos deliberados

El backend permite note, emotions y bodyMap, pero el adaptador móvil los excluye.
V2 conserva la columna note nullable de V1; **no autoriza sincronizar ni persistir
notas**. No tiene columnas emotions/body_map. Acordar una política antes de conectar
un repositorio que acepte esos campos: no descartarlos ni guardarlos silenciosamente.
No añadir un JSONB genérico para introducir datos que el diseño excluyó.

Tampoco hay columnas de careEnded, bipolarFlag, señales clínicas configurables,
PHQ o referencias clínicas en patients. No trasladar esos flags móviles a otros
pacientes ni inferir estados clínicos del silencio. Si se necesitan remotamente,
acordar DTO, permisos y una migración posterior.

## 5. Semántica de check-ins y alertas que debe conservarse

1. POST permite un único check-in **ordinario** por paciente/día. Los reportes con
   selfHarmThoughts=true siempre se aceptan, aunque exista otro registro ese día.
2. El índice `uq_check_ins_ordinary_patient_date` es único por patient_id/date solo
   donde self_harm_thoughts=false. No usar un UPSERT general por paciente/fecha ni
   volver a añadir una unicidad sin predicado.
3. Traducir únicamente la violación de ese índice a 409. No convertir cualquier
   IntegrityError en un falso "ya existe": puede ser una FK o un CHECK inválido.
4. PUT solo puede elegir la entrada ordinaria reemplazable y preservar id y
   created_at. Concurrencia: bloquear y revalidar dentro de la transacción. Una
   entrada positiva de seguridad ya existente nunca se sobrescribe. Un PUT que
   convierte una entrada ordinaria en positiva debe conservar ese historial.
5. Guardar check-in y alerta urgente de forma atómica. Conservar la instantánea de
   nombre y las razones. Hay múltiples alertas permitidas por check-in: no deduplicar
   reportes de seguridad por paciente/día sin una decisión de idempotencia explícita.
6. La FK compuesta alerts(patient_id, check_in_id) impide referencias cruzadas.
   check_in_id puede ser NULL; añadir la asociación cuando exista la evidencia.
7. GET /checkins devuelve date y created_at descendentes, con extremos inclusivos.
   Actualmente el rango predeterminado va de to-14 a to: incluye hasta 15 fechas.
   No cambiarlo a 14 ni cambiar UTC por zona local sin acordar el contrato.
8. compute_priority recibe el historial de siete días referido a check_in.date,
   no necesariamente a hoy. Preservar la selección actual de registros y el servicio;
   no reemplazarlo con un cálculo SQL ni con el algoritmo móvil.
9. Los sensores por sí solos no crean alertas clínicas. Diferenciar prioridad,
   riesgo, pérdida de contacto, recomendaciones PHQ y revisión humana.

## 6. Sensores: compatibilidad real y ausencias

| Tipo HTTP permitido | Unidad / valor actual | Consentimiento |
|---|---|---|
| activity | Unidades del enum general; value >=0 | motion |
| steps | Unidades del enum general; value >=0 | motion |
| outdoor_daylight | Unidades del enum general; value >=0 | approximate_location |
| screen_engagement | Unidades del enum general; value >=0 | touch_pattern |
| sleep | hours; 0–24 | wearable |
| resting_heart_rate | bpm; 20–250 | wearable |

El enum general de unidades es minutes, steps, index_0_1, count, hours, bpm.
index_0_1 limita value a 0–1. No estrechar los otros tipos a una unidad específica
sin coordinarlo: el contrato actual es más amplio. Source admite phone (default),
wearable, manual y synthetic. Ninguna etiqueta de fuente concede consentimiento.

- V2 coincide con estos tipos/unidades; periodEnd debe ser posterior a periodStart.
- UNIQUE(patient_id, sensor_type, period_start) corresponde a la clave en memoria.
  En conflicto, actualizar end/value/unit/source y updated_at, conservando UUID y
  created_at. No incluir source en la clave ni convertir intervalos a días fijos.
- Validar todos los items (1–200) y sus permisos antes de escribir; cualquier falta
  produce 403 sin guardar parte del lote. Resolver revocación concurrente con una
  política de bloqueo/versión de consentimiento dentro de la transacción.
- Evitar errores con tipos numéricos no finitos: Python no rechaza explícitamente
  NaN/Infinity para todos los casos y PostgreSQL compara NaN de forma distinta.
  Acordar validación explícita antes de producción; no inventar umbrales clínicos.

### HRV, reposo y sueño: móvil frente al backend

| Móvil / fuente sintética | Envío remoto actual | Estado |
|---|---|---|
| nightHrvMs (RMSSD, ms), desde average_hrv | No se envía | **No hay tipo HRV ni unidad ms** en Owais o V2 |
| restingHr, desde hr_lowest del anillo | resting_heart_rate, bpm | Compatible numéricamente; hr_lowest es mínimo nocturno, no necesariamente otro método de reposo |
| sleepMinutes, desde total en segundos /60 | sleep en horas, redondeado a una décima | Conversión con pérdida de precisión; no confundir con sleepHours autodeclarado |
| wakeTime, wearMinutes, wearableSource watch/ring | No se envían como campos propios | Source remoto no distingue watch/ring |

La noche móvil pertenece a la fecha de la tarde en que comienza; el espejo envía
00:00:00Z–23:59:59Z. No asumir que ese intervalo UTC representa la noche local.
TIMESTAMPTZ no conserva el nombre de la zona original. Definir atribución de noche,
procedencia/método y zonas antes de ampliar el contrato corporal.

**No añadir HRV ni empaquetarlo como otro tipo/unidad.** Hace falta acuerdo entre
Hugo/Owais/Uriel, consentimiento y una nueva migración porque V2 ya está aplicada.
El aprendizaje (`rewardFor`, `bodyResponse`) y feedback siguen en móvil/AsyncStorage;
no hay endpoint ni tabla intervention_outcomes. No duplicar el algoritmo en SQL.

## 7. Autenticación y datos iniciales

La base se verificó vacía al desplegar V2. Cambiar PATIENTS por consultas no basta:
los dos usuarios demo, el perfil de paciente, el profesional, los consentimientos
y la relación de equipo deben existir antes de que GET /me funcione.

Preparar un aprovisionamiento separado, idempotente y explícitamente autorizado,
solo sintético, preservando los UUID demo usados por auth.py/store.py. No hacerlo
en cada arranque ni dentro de la migración aplicada. Este handoff no inserta datos.

Migrar también get_current_user: calcular hash_session_token del bearer y buscar
auth_sessions/users. Guardar solo el digest; devolver el token original únicamente
al iniciar sesión. La expiración/revocación necesitan política explícita: las
columnas existen pero el servidor actual no expira tokens. No introducir un nuevo
401 silencioso. La reutilización de un dict TOKENS tras reiniciar o escalar seguiría
rompiendo sesiones aunque el resto de las tablas ya fuese persistente.

patient_care_team es autorización relacional para GET /alerts. Consultar por el
profesional autenticado en SQL; una FK solo comprueba identidad, no permiso. Evitar
cargar todas las alertas para filtrarlas después en Python.

## 8. Despliegue Modal: cambios que Owais debe preparar

El modal_app.py revisado instala solo fastapi/pydantic-settings/httpx, copia `app/`,
inyecta únicamente hiillos-ai y mantiene min/max_containers=1 con 50 entradas
concurrentes. **Hoy no instala SQLAlchemy, psycopg o Alembic ni configura la CA.**
No se ha inspeccionado ni cambiado el despliegue real.

### Variables de la base (solo HIILLOS_DB_*)

| Variable | Configuración requerida |
|---|---|
| HIILLOS_DB_HOST | Hostname de Aiven; no sustituir por IP |
| HIILLOS_DB_PORT | Puerto del servicio |
| HIILLOS_DB_NAME | Hiillos |
| HIILLOS_DB_USER | Cuenta de aplicación con privilegios mínimos |
| HIILLOS_DB_PASSWORD | Secreto; nunca en repositorio, logs o EXPO_PUBLIC_* |
| HIILLOS_DB_SSLMODE | verify-full |
| HIILLOS_DB_SSLROOTCERT | Ruta Linux absoluta a la CA existente dentro del contenedor |
| HIILLOS_DB_CONNECT_TIMEOUT | 10 por defecto; revisar según despliegue |

DatabaseSettings lee backend/.env en desarrollo y prioriza el entorno del proceso.
En Modal inyectar estas variables mediante un Secret de base de datos separado
(nombre propuesto: hiillos-db), conservando hiillos-ai. No subir el .env local.
La ruta Windows local de la CA no existe en Linux: provisionar la CA por un canal
controlado y hacerla disponible en la ruta configurada ANTES de crear Settings o
abrir conexiones. Una variable con una ruta no monta el archivo. Nunca usar
sslmode=require/disable como solución a un certificado faltante.

Las conexiones fijan search_path=public; no existe HIILLOS_DB_SCHEMA. Alembic exige
Hiillos y public.alembic_version, pero no debe ejecutarse desde el arranque de cada
contenedor. La revisión ya está aplicada. Para futuras revisiones, usar un paso
operativo autorizado con cuenta de migración separada de la cuenta de aplicación.

Pasos para la imagen y ciclo de vida:

1. Incluir los nuevos módulos app/db del PR #11 y las dependencias de requirements;
   no basta añadir variables a la imagen actual. No copiar todo backend/ sin excluir
   .env, certificados locales, .venv y temporales. Puede mantenerse el copiado de app/.
2. Inyectar Secret de base de datos y provisionar CA; verificar en el mismo entorno
   Modal seleccionado, sin imprimir contraseñas ni DSN.
3. Crear un Engine/sessionmaker por contenedor, y una Session por solicitud/unidad
   de trabajo. No compartir una Session global ni reutilizarla entre tareas.
4. Los factories actuales son síncronos (postgresql+psycopg): no usar await sobre
   sus Session ni bloquear el event loop con consultas en async def. Resolver el
   acceso mediante dependencias síncronas/threadpool o una transición async revisada.
5. Flush/commit/rollback deben tener un dueño claro. Cerrar sesiones y no mantener
   transacciones abiertas durante llamadas largas a Gemini/ElevenLabs.
6. El pool actual tiene size=2 y max_overflow=2 (hasta 4 conexiones por Engine).
   Revisar límites Aiven, contenedores, procesos y concurrencia; 50 solicitudes no
   equivalen a 50 conexiones disponibles. Mantener pequeño y medir antes de escalar.
7. Mantener el límite de contenedores mientras quede estado por migrar. Un contenedor
   caliente no garantiza durabilidad. Escalar solo tras retirar dependencias de todos
   los diccionarios de estado, incluidos TOKENS y PATIENTS.
8. Conservar configuración AI existente: GEMINI_API_KEY/GEMINI_MODEL/
   GEMINI_THINKING_LEVEL, ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID/
   ELEVENLABS_MODEL/ELEVENLABS_VOICES y CORS_ORIGINS. No reintroducir la versión
   antigua de companion que truncaba respuestas al integrar ramas.

Referencias oficiales: [Modal Secrets](https://modal.com/docs/guide/secrets) explica
la inyección como variables; [Modal Images](https://modal.com/docs/guide/images)
explica la disponibilidad de archivos locales en el contenedor. No se ha creado
ningún Secret, imagen o despliegue durante este trabajo.

## 9. Riesgos concretos para la aplicación móvil

- El móvil sigue local-first y conserva fallbacks. Una respuesta HTTP exitosa no
  prueba persistencia; comprobar lectura tras reiniciar el contenedor con datos
  sintéticos autorizados, y no solo el estado online mostrado por la app.
- El espejo usa un usuario paciente demo predeterminado; cambiar la persona local
  no cambia por sí solo la identidad remota. Evitar mezclar cinco historiales bajo
  un mismo paciente. Definir identidad antes de sincronizar perfiles múltiples.
- `mirrorConsents` no envía wearable, y PUT tiene default false: puede revocar ese
  permiso accidentalmente después de conectar el dispositivo. Acordar con Hugo si
  el cliente debe enviar el snapshot completo; no reinterpretar PUT como PATCH.
- `mirrorWearable` copia sueño y reposo con source=synthetic; no envía HRV ni steps.
  Los pasos requieren motion, no wearable. No anunciar persistencia de todo el loop.
- Existe fallback legacy que rellena energía/ansiedad tras un 422 de servidor viejo.
  Evitar usarlo como solución a errores nuevos; el backend objetivo admite NULL.
- 409 tiene significado de seguridad además del registro ordinario. Cambiarlo
  puede hacer que el cliente intente reemplazar una entrada que debe conservarse.
- No colapsar varias entradas ordinarias móviles a cero/una entrada sin entender
  que el espejo actual ya hace POST→PUT y el backend guarda una ordinaria por día.
- La lectura de alertas requiere doctor y equipo asignado; usar el token paciente
  del cliente demo produce 403, no demuestra que la tabla de alertas esté vacía.
- Los esquemas de Patient/Alert y sus IDs no coinciden directamente entre móvil y
  backend. Conservar los adaptadores y no tratar UUID de servidor como ids de fixture.
- No confundir falta de uso del wearable, quiet o careEnded con recuperación,
  recaída o autorización para contactar. No crear alertas clínicas solo por sensores.

## 10. Orden recomendado y criterios de aceptación

| Paso | Trabajo de Owais | Criterio de salida |
|---|---|---|
| 1 | Revisar/combinar PR #11 con su backend reciente en una rama propia | Sin perder arreglos de seguridad, sensores o companion; sin editar revisión aplicada |
| 2 | Acordar huecos de privacidad y contratos antes de activar repositorios | Política de notas/emociones/mapa, identidad demo, consentimiento wearable y floats no finitos |
| 3 | Preparar imagen, Secrets, CA y dependencia de Session | Imports y conexión TLS válidos; sin migración automática ni exposición de secretos |
| 4 | Aprovisionar identidades sintéticas autorizadas y migrar auth/perfiles/consentimientos/equipo | GET/PATCH /me y PUT consents conservan JSON; tokens sobreviven reinicio; permisos correctos |
| 5 | Integrar check-ins y alertas como unidad transaccional | 409 ordinario; seguridad repetida aceptada e inmutable; id/created_at estables; rollback conjunto |
| 6 | Integrar GET /alerts con JOIN de asignación | Doctor asignado ve sus pacientes; paciente u otro doctor no acceden |
| 7 | Integrar lotes de sensores con upsert y consentimiento | Lote completo o ninguno; misma clave actualiza fila; timestamps y unidades preservados |
| 8 | Probar API + móvil y reinicios en un entorno de pruebas autorizado | Sin regresiones 401/403/404/409/422 ni pérdida de datos; pool dentro del límite |
| 9 | Acordar ampliaciones corporales posteriores | Contrato HRV/noche local/consentimiento y nueva migración; no reutilizar un tipo existente |

Pruebas de infraestructura ya disponibles: 19 offline en tests/test_database_schema.py.
No cubren concurrencia, comportamiento HTTP ni permisos de un repositorio todavía
inexistente. Añadir pruebas transaccionales contra PostgreSQL de pruebas autorizado:
registro ordinario duplicado, varias entradas positivas, PUT protegido, alertas
cruzadas rechazadas, lote sin consentimiento, rollback total, upsert estable,
filtrado profesional y persistencia tras reinicio. No usar pacientes reales.

## 11. Checklist de entrega de Owais

- [ ] Contratos base Owais más infraestructura V2 integrados, sin migraciones reescritas.
- [ ] Política explícita para campos sensibles aún sin persistencia aprobada.
- [ ] Configuración Modal y CA Linux correctas; verificación TLS obligatoria.
- [ ] Identidades/equipo/consentimientos sintéticos aprovisionados con autorización.
- [ ] TOKENS, PATIENTS, CHECKINS, ALERTS y SENSOR_AGGREGATES sustituidos de forma coherente.
- [ ] Transacciones, permisos y errores HTTP preservados.
- [ ] Pruebas de concurrencia y reinicio; métricas sin contenido sensible.
- [ ] HRV no se anuncia como remoto hasta definir y desplegar su contrato.
- [ ] Sin conversaciones/audio/GPS/señales crudas ni secretos en PostgreSQL/Git/logs.

Documentación relacionada: [esquema](SCHEMA.md), [decisiones](DECISIONS.md),
[compatibilidad V1/V2](COMPATIBILITY.md), [validación](VALIDATION.md),
[README de PostgreSQL](../../README.md).
