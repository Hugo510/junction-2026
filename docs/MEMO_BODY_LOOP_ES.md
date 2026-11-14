# Memo — Hiillos cierra el ciclo a través del cuerpo

*SISU Lab · sábado 14 de noviembre de 2026, 19:50 · de Meg · versión en inglés: `MEMO_BODY_LOOP.md`*
*Estado: **reloj decidido** (Hugo y Uriel están listos para agregarlo). **Anillo propuesto**: se agrega si el equipo está de acuerdo. Registrado como O33 en `DECISIONS.md`.*

---

## 1. Por qué cambiamos la historia

Esta tarde hablamos con el equipo del reto. **No los convenció nuestro "ciclo de atención cerrado"** (desviación → cuestionario → clínica). Ellos quieren un reloj inteligente, que mida de forma continua y más directa.

Al volver a leer su planteamiento, se ve que hablan de otro ciclo:

> El tratamiento de mantenimiento en casa "también podría ser de 'ciclo cerrado', es decir, individualizado según cómo reacciona el cerebro del paciente a las intervenciones".

Es el **sentido de la estimulación cerebral**: **medir el cuerpo o el cerebro → intervenir → medir la respuesta → ajustar.** El planteamiento incluso nombra el dispositivo: los anillos inteligentes miden señales del corazón, sueño, actividad y el sistema nervioso autónomo, "un indicador muy importante del estado mental".

Nuestro ciclo con la clínica se queda, pero como **red de seguridad**, no como titular.

## 2. El nuevo ciclo (una línea para el jurado)

**Hiillos propone un pequeño paso, observa cómo responde su cuerpo esa noche y aprende qué le ayuda de verdad.**

| Paso | Qué pasa | Fuente |
|---|---|---|
| **Medir** | Variabilidad de la frecuencia cardiaca durante la noche, frecuencia cardiaca en reposo, horario y duración del sueño, pasos; todo comparado con *su propia* línea base | Reloj (decidido), anillo (propuesto) |
| **Responder** | Un pequeño paso: caminar, sonidos del mar, escribirle a un amigo, desconectarse antes de dormir… | Aplicación (ya existe) |
| **Medir la respuesta** | La recuperación de esa noche (variabilidad cardiaca, sueño) frente a lo normal para ella, más el toque de ánimo del día siguiente | Reloj o anillo + aplicación |
| **Aprender** | El motor de aprendizaje califica cada paso según *cómo respondieron su cuerpo y su ánimo*, no solo con el pulgar arriba | Aplicación (cambio pequeño, sección 4) |
| **Red de seguridad** | Desviación → dos preguntas → cuestionario de nueve preguntas → la clínica solo cuando importa | Aplicación (ya existe) |
| **Ancla** | El electroencefalograma de la clínica, y la combinación de estimulación magnética transcraneal con electroencefalograma, son su punto de partida cerebral | Clínica (presentación) |

## 3. ¿Reloj o anillo?

| | Reloj | Anillo |
|---|---|---|
| Datos nocturnos (variabilidad cardiaca, sueño) | Muchas veces se lo quitan para dormir | Hecho para usarse de noche: **la señal nocturna más limpia** |
| Actividad y pasos de día | Fuerte | Buena |
| Frecuencia cardiaca en vivo en el escenario | Fácil | Normalmente se sincroniza después |
| Ángulo finlandés | Polar | Oura |
| Precauciones | Si se queda cargando, se rompe el ritmo de 24 horas | En una validación pequeña (35 adultos sanos, 1 noche) el anillo midió la variabilidad cardiaca unos 16 milisegundos por debajo. Los datos pasan por la nube del fabricante (no revisamos sus condiciones) |

**Propuesta:** el reloj para la demostración, y en la presentación decir "cualquier reloj o anillo a través de Health Connect o HealthKit". El anillo es lo mejor para la recuperación nocturna, si el equipo está de acuerdo.

## 4. Cambios de código esta noche (congelamiento de funciones a las 21:00)

| # | Cambio | Responsable | Tiempo aprox. |
|---|---|---|---|
| B1 | **Campos opcionales nuevos** en `SensorAggregate`: `nightHrvMs` (variabilidad de la frecuencia cardiaca nocturna, raíz cuadrada media de las diferencias entre latidos sucesivos, en milisegundos), `restingHr` (latidos por minuto en reposo), `sleepMinutes`, `wakeTime` ("HH:mm"), `wearMinutes`, `wearableSource` ("watch" o "ring"). `bedtime` y `steps` ya existen. *Los nombres son una propuesta; Hugo confirma.* | Hugo | 20 min |
| B2 | **Datos sintéticos de reloj o anillo para las 5 personas.** Aino: caminar → más variabilidad cardiaca esa noche. Juho: le ayudan los sonidos del mar, caminar no. Elias: semana con gripe → sube la frecuencia en reposo y baja la variabilidad → Hiillos le pregunta → cuestionario bajo → sin alerta a la clínica. Leena: estable. Sara: huecos sin usar el dispositivo → "contacto perdido", nunca recaída | Claude + Meg | 30 min |
| B3 | **La respuesta del cuerpo entra en la calificación** (`rewardFor` en `interventionPicker.ts`). Hoy es calificación + 0.25 × cambio de ánimo del día siguiente. Agregar **+ 0.25 × variabilidad cardiaca de la noche siguiente frente a su propia línea base de 14 días** (en desviaciones estándar, con tope de ±2). El peso es un valor ajustable e ilustrativo | Uriel | 45–60 min |
| B4 | **La tarjeta "Lo que te ayuda" explica por qué:** "Después de caminar, tu recuperación nocturna fue más alta que tu normal." Sin palabras médicas | Hugo | 15 min |
| B5 | **Pantalla clínica:** una pequeña tendencia de variabilidad cardiaca y sueño frente a su línea base, junto a las razones. Los sensores siguen sin alertar a la clínica por sí solos | Uriel | 30 min |
| B6 | *Opcional:* la **frecuencia cardiaca en vivo** del reloj de alguien del equipo en el escenario; solo se muestra, no se guarda, y con el consentimiento de esa persona. Necesita el sí del equipo, porque el plan dice que no usamos datos reales de miembros del equipo | Hugo o Uriel | solo si es fácil |

## 5. Nuevo orden de la presentación

1. Historia del nombre → idea radical ("El tratamiento no termina al dar de alta: cambia de forma").
2. **El ciclo del cuerpo, en vivo:** Aino sale a caminar → sube su recuperación nocturna → Hiillos aprende "a *ti* te ayuda caminar". Juho: lo contrario.
3. Elias: el cuerpo dice "algo pasa" → Hiillos pregunta → el cuestionario dice que está bien → **ninguna falsa alarma a la clínica.**
4. Red de seguridad: la clínica solo cuando importa, con una razón de una línea.
5. **La propuesta al laboratorio:** datos del reloj o anillo en casa, emparejados con el electroencefalograma y la combinación de estimulación con electroencefalograma de la clínica antes y después del tratamiento, persona por persona, entre el alta y la recaída. Algo que el laboratorio hoy no tiene.

## 6. Lo que debemos decir con honestidad

- La variabilidad cardiaca es real pero pequeña a nivel de grupo (tamaño de efecto cerca de −0.46). **Los antidepresivos la bajan más que la propia depresión**, así que solo comparamos a cada persona consigo misma y reiniciamos la línea base cuando cambia el medicamento.
- **No investigamos** si la respuesta de la variabilidad cardiaca de una noche después de una caminata predice algo sobre la depresión. Decimos *"aprende a qué responde su cuerpo"*, nunca *"trata"* ni *"detecta recaídas"*.
- Todos los datos de la demostración son **sintéticos**. Los tamaños de efecto son **ilustrativos, no calibrados**.

## 7. Una pregunta para el laboratorio esta noche

**"¿Les servirían para su investigación los datos de reloj o anillo en casa, emparejados con su electroencefalograma y su combinación de estimulación con electroencefalograma del tratamiento?"** Su respuesta define la diapositiva de cierre y el premio a "la idea más prometedora".
