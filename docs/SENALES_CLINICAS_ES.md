# Señales clínicas de la depresión: qué respalda la evidencia

*SISU Lab · Junction 2026 · sábado 14 de noviembre, 19:45. Traducción al español de `docs/CLINICAL_SIGNALS.md`, sin siglas, con una sección nueva (§7): la lista completa de señales que la aplicación puede captar como indicadores indirectos. No es investigación nueva; las marcas de evidencia se conservan del original.*

**Marcas:**
- **[verificado]**: se leyó en la página enlazada.
- **[resumen]**: tomado del resumen de un artículo; no se leyó el artículo completo.
- **[secundario]**: viene de un comunicado de prensa o de una revisión que resume otro estudio.
- **[SIN VERIFICAR]**: cifra habitual que no se comprobó en la fuente.

Todo lo que no esté **[verificado]** se revisa antes de ponerlo en una diapositiva.

---

## 0. En resumen

- La señal clínica con evidencia real es **un cuestionario validado que la persona contesta en un calendario fijo, con una acción ligada a cada umbral**. En un ensayo clínico aleatorizado, puntuar con calendario y reglas de decisión subió la remisión del **28.8 % al 73.8 %** (Guo 2015, 120 pacientes, fase aguda con medicamento, no después de la estimulación magnética transcraneal) [verificado].
- Monitorear **sin** acciones predefinidas no mejoró los síntomas (ensayo MONARCA II) [verificado].
- **Ningún sensor está validado para detectar una recaída.** Casi toda la evidencia de sensores compara grupos de personas; Hiillos necesita detectar el cambio *dentro de una misma persona*.
- De ahí nuestra regla: **los sensores preguntan, los cuestionarios deciden, las personas confirman.**

## 1. Los síntomas que definen la depresión

**Episodio depresivo mayor**, según el *Manual diagnóstico y estadístico de los trastornos mentales*, quinta edición: al menos **5 de 9 síntomas durante 2 semanas**, como un cambio respecto a antes. Al menos uno debe ser ánimo deprimido o pérdida de interés [verificado, vía MDCalc].

1. Ánimo deprimido la mayor parte del día, casi todos los días
2. Interés o placer muy reducidos
3. Cambio de peso o de apetito (**hacia arriba o hacia abajo**)
4. Insomnio o exceso de sueño (**dormir de menos o de más**)
5. Agitación o lentitud de movimientos que otras personas notan
6. Cansancio o falta de energía
7. Sentimientos de inutilidad o culpa excesiva
8. Dificultad para concentrarse o para decidir
9. Pensamientos de muerte, ideas suicidas, un plan o un intento

**Qué agrega la *Clasificación Internacional de Enfermedades* y por qué importa en Finlandia:**
- Finlandia codifica con la décima revisión de la Clasificación (F32 episodio único, F33 recurrente). Ahí la **falta de energía es un síntoma central**, cosa que no es en el manual estadounidense [SIN VERIFICAR].
- Las revisiones décima y undécima incluyen **la desesperanza, una visión sombría del futuro**. Ninguno de los cuestionarios que usamos la pregunta directamente. Una pregunta diaria del tipo "¿qué tanta esperanza sientes para los próximos días?" cerraría ese hueco.
- La undécima revisión tiene códigos para **remisión parcial (6A70.6)** y **remisión completa (6A70.7)**, que sirven como etiquetas ya hechas para la pantalla del personal clínico [verificado].
- La regla de la guía clínica finlandesa, citada en una conferencia de 2026: **al menos 2 síntomas centrales y al menos 4 de 10 en total, durante 2 semanas o más** [secundario].

**Los subtipos mueven las señales en direcciones opuestas:**
- **Melancólico:** despertar muy temprano, peor por la mañana, pérdida de peso.
- **Atípico:** **más** sueño y **más** apetito.
- **Estacional:** el riesgo se concentra en otoño e invierno, lo que pesa en Finlandia.

Una regla como "menos sueño = peor" falla con la mitad de las personas. La línea base debe aprender **hacia dónde se mueve cada persona** [el detalle de los subtipos está SIN VERIFICAR].

## 2. Señales de alerta temprana: el mejor argumento para una "firma personal"

- **Antes de los episodios hay una fase previa**, típicamente con **ansiedad, tensión, irritabilidad y molestias físicas**. Puede durar desde menos de un mes hasta varios años (revisión sistemática de 25 estudios longitudinales, 2021) [verificado, resumen].
- **La fase previa de cada persona se repite en sus propios episodios** y se parece a los **síntomas que le quedaron** del episodio anterior [verificado, resumen]. Esa es la evidencia detrás de "la clínica define las señales tempranas" (tarea S3 del plan).
- La ansiedad y la irritabilidad aparecen pronto, así que un cuestionario solo de depresión puede pasar por alto las primeras señales. Eso justifica agregar la **escala de ansiedad generalizada de siete preguntas** o una pregunta de ansiedad/irritabilidad.
- **Los síntomas que quedan después del tratamiento aumentan el riesgo de recaída:** cada punto extra lo subió alrededor de un 7 % (razón de riesgos 1.07, metaanálisis con datos individuales, Breedvelt 2021) [verificado]. La cifra antigua de "76 % frente a 25 %" (Paykel 1995) está [SIN VERIFICAR].
- **Ninguna fuente mostró que un síntoma en particular, como el sueño, regrese siempre primero.**

## 3. Cuestionarios y umbrales

| Instrumento | Qué es | Umbral o regla | Estado |
|---|---|---|---|
| **Cuestionario de Salud del Paciente de nueve preguntas** (en el código: `phq9`) | 9 preguntas, una por síntoma; **últimas 2 semanas**; puntaje 0 a 27. Gratuito. Versión en finés presentada por el Instituto Finlandés de Salud y Bienestar. El distrito hospitalario de Helsinki y Uusimaa lo usa al derivar a estimulación magnética transcraneal | Bandas 5 / 10 / 15 / 20 = leve / moderada / moderadamente grave / grave. **10 o más** es el mejor punto de corte: sensibilidad 0.88 y especificidad 0.85 frente a entrevistas clínicas semiestructuradas (17,357 personas). **En atención primaria, cerca de la mitad de los resultados positivos son falsos positivos**, por eso confirma una persona del equipo clínico | [verificado] Kroenke 2001, Levis 2019, Instituto Finlandés |
| **Cambio en ese cuestionario** (regla del Instituto Finlandés) | — | Cuenta un cambio de **5 puntos o más**. El Instituto llama "recuperación" a empezar en 10 o más, terminar por debajo de 10 y bajar al menos 5 puntos (no es la misma "recuperación" de la sección 4) | [verificado] |
| **Pregunta 9** de ese cuestionario | Pensamientos de que estaría mejor muerto o de hacerse daño | **Cualquier respuesta mayor que cero:** unas **10 veces más** intentos de suicidio en un año (0.4 % → 4 %) y muertes (0.03 % → 0.3 %), comparando "casi todos los días" con "nunca". El riesgo extra **empieza en días y dura meses** (84,418 pacientes) | [verificado] Simon 2013 |
| Remisión con ese cuestionario | — | Menos de 5 | [SIN VERIFICAR] |
| **Versión de dos preguntas** (ánimo e interés; en el código: `phq2`) | Las 2 primeras preguntas | 3 o más → cuestionario completo de nueve preguntas *(la regla que usa la tarea M3)* | [SIN VERIFICAR]; revisar antes de la presentación |
| Versión de ocho preguntas | Sin la pregunta 9 | Para cuando nadie puede dar seguimiento humano a una respuesta de riesgo | [SIN VERIFICAR] |
| **Inventario rápido de sintomatología depresiva, autoinforme de 16 preguntas** | Autoinforme; recuerda los últimos 7 días | 5 o menos = remisión; 6 a 8 = respuesta parcial; 9 o más = sin respuesta (reglas del ensayo de Guo) | [verificado]; no se confirmó una versión en finés |
| **Escala de Hamilton para la depresión** y **escala de Montgomery-Åsberg** | Escalas que aplica el personal clínico; probablemente las que tiene la clínica de estimulación | Remisión en Hamilton: 7 o menos [verificado]. Remisión en Montgomery-Åsberg: 10 o menos [SIN VERIFICAR]. Existe una tabla de equivalencias con el cuestionario de nueve preguntas, pero no se verificó | mixto |
| **Escala de ansiedad generalizada de siete preguntas** | Ansiedad, últimas 2 semanas | 10 o más | [SIN VERIFICAR] |
| **Escala de Columbia para la severidad del riesgo suicida**, versión de detección | Seguimiento estructurado cuando la pregunta 9 es mayor que cero; citada en una conferencia de la guía clínica finlandesa | — | [secundario] |

**Frecuencia:** el cuestionario de nueve preguntas **cada 2 semanas**, que coincide con su ventana de recuerdo y con el espaciado del ensayo de Guo. Aplicarlo cada semana hace que las ventanas se encimen. **Ninguna guía fija una frecuencia de monitoreo para la fase de mantenimiento**, así que nuestra frecuencia es una inferencia.

## 4. Reglas de tiempo: ¿sin remisión, recaída o recurrencia?

Grupo de trabajo del Colegio Estadounidense de Neuropsicofarmacología, 2006 [verificado, resumen]:

| Término | Significado | Regla de tiempo |
|---|---|---|
| Respuesta | El puntaje baja 50 % o más respecto al inicio | — |
| **Remisión** | Síntomas mínimos | **3 semanas seguidas** |
| **Recaída** | Regresa el mismo episodio | Dentro de los **4 meses** posteriores a la remisión |
| **Recuperación** | El episodio terminó | **4 meses o más** en remisión |
| **Recurrencia** | Un episodio nuevo | Después de la recuperación |

**Para la pantalla clínica:** muchas personas terminan la estimulación magnética transcraneal con respuesta solo parcial. Quien nunca tuvo 3 semanas de síntomas mínimos sigue **sin remisión**; no está en recaída, y la clínica puede responder de otra forma. **Ninguna guía define la recaída con puntajes del cuestionario de nueve preguntas**, así que nuestra regla de la lista "llamar" es una inferencia.

## 5. Señales medibles, ordenadas por evidencia

*Casi todo compara grupos en un solo momento. Nada se ha probado después de la estimulación magnética transcraneal.*

| Señal | Dirección en la depresión | Cifra clave | Evidencia | Problema principal |
|---|---|---|---|---|
| **Pasos al día** | Más pasos, menos síntomas | **Riesgo relativo 0.91 por cada 1,000 pasos diarios más** (prospectivo). 33 estudios, 96,173 personas | **Moderada** [secundario]; 27 de los 33 estudios son transversales | Celular olvidado en la mesa |
| **Ritmo de actividad y descanso en 24 horas** | Menos contraste entre día y noche | 91,105 personas (UK Biobank); no se obtuvieron las razones de momios | **Moderada** [secundario] | Hay que llevar el dispositivo de noche |
| **Exposición a la luz** | Luz de noche: riesgo cerca de +30 %. Luz de día: cerca de −20 % | 86,772 personas | **Moderada** [secundario], observacional | La manga tapa el sensor de muñeca |
| **Variabilidad de la frecuencia cardiaca** (diferencia cuadrática media entre latidos sucesivos) | Más baja | Tamaño de efecto −0.46, 21 estudios | **Moderada** para la diferencia entre grupos [verificado] | **Los antidepresivos la bajan más que la propia depresión**: solo se lee dentro de la misma persona |
| Hora y duración del sueño | En cualquier dirección (sección 1) | — | A nivel de síntoma | Usar hora y duración, no las fases del sueño de dispositivos de consumo (no validadas en depresión) |
| **Movilidad por el sistema de posicionamiento global / tiempo en casa** | Menos movimiento, más tiempo en casa | Correlación cerca de −0.6 con el cuestionario de nueve preguntas | **Débil**: 28 personas, 2 semanas; los autores lo llaman "muy preliminar" [verificado] | Batería; dato sensible; 12 de 40 excluidos por falta de datos |
| **Uso del celular / tiempo de pantalla** | Relacionado con el cuestionario, pero **el signo no coincide entre el resumen y los resultados del artículo** | Correlación −0.54 | **Débil e inconsistente** [verificado] | Lo confunden el trabajo y los hábitos |
| Ritmo al escribir | Más variable, pausas más largas | Efectos de pocos por ciento | De débil a moderada [verificado] | La edad pesa más |
| Voz: cambio dentro de la misma persona | Sigue la mejoría | 1,857 personas, con replicación | **Emergente** [resumen] | Usar siempre el mismo texto; no hay estudios en finés ni en sueco |
| Voz: solo el tono promedio | — | No significativo | Metaanálisis **negativo** [resumen] | — |
| Electroencefalograma | — | "No existe un método establecido" | **Débil** [resumen]; la asimetría frontal de la onda alfa salió **negativa** [verificado] | Ver `EEG_FOR_URIEL.md` |
| Actividad eléctrica de la piel / temperatura de la piel | — | No se encontró ningún estudio en depresión | Muy débil | — |
| Inestabilidad del ánimo ("desaceleración crítica") | Suben la variación y la autocorrelación antes de los cambios | A nivel de grupo | Exploratoria [verificado, resumen] | Requiere registros frecuentes; no sirve como alarma |
| Registros faltantes / dispositivo sin usar | Puede indicar aislamiento | — | Inferencia | Mensaje suave y etiqueta "contacto perdido"; **nunca** cuenta como evidencia de recaída |

**Predicción de recaída combinando señales:** área bajo la curva entre 0.70 y 0.88, casi siempre validada solo internamente; el 75 % de los estudios con alto riesgo de sesgo (Fang 2026) [resumen]. **No citarla como precisión en el mundo real.**

## 6. Cómo se compara Hiillos con esto (revisión honesta)

| Hiillos usa | Evidencia | Nota |
|---|---|---|
| Versión de dos preguntas → cuestionario de nueve preguntas, con la pregunta 9 → regla fija de seguridad | **La más fuerte** | El centro de nuestra propuesta. Revisar el corte de 3 en la versión de dos preguntas y la redacción oficial en finés y sueco (pendiente O28) |
| Lista "llamar": 10 o más y +5 sobre su línea base, dos veces; o cualquier 15 o más | Umbrales verificados; la combinación es inferencia nuestra | Decir "reglas transparentes que la clínica puede ajustar" |
| La clínica define las señales tempranas (tarea S3) | **Respaldado:** la fase previa se repite en cada persona | Buena frase para la presentación |
| Desviación en ambas direcciones respecto a su propia línea base | **Respaldado:** los subtipos se mueven en direcciones opuestas | — |
| Actividad, luz del día | **Moderada** (pasos, luz) | Nuestros sensores mejor respaldados |
| **Tiempo en casa, hora en que se apaga la pantalla** | **Débil** (estudio de 28 personas; resultados de uso del celular inconsistentes) | Presentarlos como *disparadores de una pregunta*, nunca como marcadores. ⚠️ La afirmación del plan sobre un "estudio de 1,013 personas, 2 semanas antes" **no está en nuestra nota de investigación**: hay que encontrar la fuente o quitar la cifra |
| **Regularidad** de la hora en que se apaga la pantalla (ritmo de la hora de dormir) | La evidencia de ritmo es moderada, pero viene de sensores de muñeca, no de la pantalla del celular | La pantalla es un indicador indirecto de la hora de dormir; etiquetarlo así |

**Falta en Hiillos y es barato agregar después:** una pregunta de esperanza en el futuro, una pregunta de ansiedad o irritabilidad (o la escala de siete preguntas) y los pasos.

---

## 7. Lista completa: señales que la aplicación puede captar como indicadores indirectos

**Regla de privacidad para todas** (barandilla 10 del plan): se calculan **dentro del celular**, solo sale un puntaje o un resumen diario; **nunca** se leen contenidos (mensajes, nombres, pantallas, lo que ve o escribe); hay consentimiento explícito y revocable por cada tipo de dato. Ninguna señal diagnostica ni alerta a la clínica por sí sola: **solo dispara una pregunta**.

**Cómo leer las columnas:**
- **Evidencia:** la que da la investigación de las secciones 2 y 5. "No revisada" significa que no la investigamos.
- **En Hiillos hoy:** si ya existe en los datos de las personas sintéticas o en la aplicación.
- **Viabilidad técnica:** de memoria, **por verificar** en la documentación actual de cada plataforma y de Expo. No prometer nada en la presentación sin revisarlo.

### A. Del celular solo, sin pulsera ni reloj (pasivas)

| # | Señal | Indicador indirecto de qué síntoma | Cómo se capta | Evidencia | En Hiillos hoy | Viabilidad técnica (por verificar) |
|---|---|---|---|---|---|---|
| 1 | **Pasos al día** | Cansancio, falta de energía, lentitud de movimientos | Podómetro y acelerómetro del celular | Moderada | No (hay minutos de actividad) | Ambas plataformas tienen contador de pasos; en Android puede requerir permiso de actividad física |
| 2 | **Minutos de actividad física** | Cansancio, lentitud, pérdida de interés | Acelerómetro; detección de caminar, correr o ir en vehículo | Moderada (ligada a pasos) | **Sí**: `activityMinutes` | Probable en ambas |
| 3 | **Tiempo en casa** | Aislamiento, pérdida de interés, cansancio | Geocerca alrededor de casa; solo se guardan minutos, no coordenadas | Débil | **Sí**: `homeMinutes` | Requiere ubicación en segundo plano; limitaciones fuertes en ambas plataformas |
| 4 | **Número de lugares distintos visitados al día** | Pérdida de interés, aislamiento | Agrupar puntos de ubicación dentro del celular | Débil | No | Igual que la 3 |
| 5 | **Variedad del tiempo repartido entre lugares** (qué tan parejo se reparte el tiempo entre sitios) | Pérdida de interés, aislamiento | Cálculo sobre los lugares de la 4 | Débil (correlación cerca de −0.58) | No | Igual que la 3 |
| 6 | **Distancia recorrida al día** | Cansancio, aislamiento | Suma de desplazamientos | Débil | No | Igual que la 3 |
| 7 | **Regularidad diaria del movimiento** (si sale y vuelve a horas parecidas cada día) | Ritmo diario alterado, sueño | Comparar el patrón de ubicación hora por hora entre días | Débil (correlación cerca de −0.63) | No | Igual que la 3 |
| 8 | **Hora en que se apaga la pantalla por última vez en la noche** | Hora de dormir, insomnio | Último evento de pantalla apagada antes de una pausa larga | Débil como señal de celular; el ritmo de sueño en sí es moderado | **Sí**: `screenOffTime` | En iOS el acceso a eventos de pantalla es muy limitado |
| 9 | **Hora del primer desbloqueo de la mañana** | Hora de despertar, despertar temprano o dormir de más | Primer desbloqueo después de la pausa nocturna | Débil (indirecta) | No | Igual que la 8 |
| 10 | **Duración estimada del sueño** | Insomnio o exceso de sueño | Pausa entre la señal 8 y la 9 | Débil (indirecta) | No | Igual que la 8 |
| 11 | **Regularidad de la hora de dormir y despertar** | Ritmo diario alterado | Variación de las señales 8 y 9 contra su propia semana | Moderada para el ritmo; débil como medida desde el celular | Parcial (se puede calcular de `screenOffTime`) | Igual que la 8 |
| 12 | **Minutos de pantalla encendida durante la noche** | Sueño interrumpido, insomnio | Pantalla encendida entre medianoche y la madrugada | Débil | No | Igual que la 8 |
| 13 | **Tiempo total de pantalla al día** | Aislamiento, cansancio (dirección inconsistente) | Suma de minutos con pantalla encendida | Débil e inconsistente | No | En iOS muy restringido; en Android requiere un permiso especial de estadísticas de uso que la tienda de Google revisa |
| 14 | **Número de desbloqueos al día** | Inquietud o retraimiento | Conteo de desbloqueos | No revisada | No | Igual que la 13 |
| 15 | **Luz de día** | Exposición a la luz, salir de casa | Tiempo fuera de casa en horas de luz, o sensor de luz del celular (mal indicador: el celular suele estar en el bolsillo) | Moderada para la luz; débil desde el celular | **Sí**: `daylightMinutes` (falta confirmar cómo lo calcula la aplicación) | El sensor de luz no está disponible de la misma forma en ambas plataformas |
| 16 | **Número y duración de llamadas** (nunca con quién ni qué se dijo) | Aislamiento, contacto social | Registro de llamadas | No revisada | No | iOS no da el registro de llamadas a otras aplicaciones; en Android es un permiso muy restringido por la tienda de Google |
| 17 | **Número de mensajes enviados y recibidos** (nunca el contenido) | Aislamiento, contacto social | Registro de mensajes | No revisada | No | Igual que la 16, o más restringido |
| 18 | **Personas cerca** (cuántos dispositivos con conexión inalámbrica de corto alcance hay alrededor) | Contacto social cara a cara | Escaneo periódico | No revisada (se usó en el conjunto de datos de estudiantes) | No | Limitado en segundo plano; gasta batería |
| 19 | **Ritmo al escribir** (tiempo entre teclas, pausas, correcciones automáticas; nunca el texto) | Lentitud, dificultad para concentrarse | Requiere un teclado propio instalado | De débil a moderada | No | Fuera de alcance este fin de semana |
| 20 | **Patrón de carga del celular** | Rutina diaria | Horas a las que se conecta el cargador | No revisada | No | Probable en ambas |
| 21 | **Días sin registro diario** | Aislamiento o pérdida de contacto (nunca recaída por sí solo) | Días seguidos sin tocar la aplicación | Inferencia | **Sí**: escalera de silencio de 2, 4 y 7 días | Ya funciona |
| 22 | **Días sin datos de sensores** | Igual que la 21 | Huecos en los datos | Inferencia | Parcial | — |

### B. Del celular, con una tarea corta (activas)

| # | Señal | Indicador indirecto de qué síntoma | Cómo se capta | Evidencia | En Hiillos hoy |
|---|---|---|---|---|---|
| 23 | **Voz al leer siempre el mismo texto corto** (20 a 30 segundos, en el idioma de la persona) | Lentitud, ánimo plano, cansancio | Micrófono; solo se guardan medidas de la voz, comparadas con su propia línea base | Emergente; sin estudios en finés ni sueco | No |
| 24 | **Tiempo de reacción** (juego corto) | Dificultad para concentrarse, lentitud | Juego de reacción en la aplicación | No revisada (exploratoria) | **Sí**, opcional |
| 25 | **Mapa del cuerpo** ("¿Dónde está tu fuego hoy?") | Estado emocional sentido en el cuerpo; solo autoinforme, **nunca** diagnóstico | Pintar cálido o frío sobre una silueta | Método de investigación de Aalto (mapas corporales de las emociones); no validado para la depresión | Planeado (tarea S6) |

### C. Lo que la persona responde (autoinforme: es lo que **decide**)

| # | Señal | Síntoma que cubre | Frecuencia | En Hiillos hoy |
|---|---|---|---|---|
| 26 | **Ánimo con un toque** (cinco brasas) | Ánimo deprimido | Diario | **Sí** |
| 27 | **Energía** | Cansancio | En el registro semanal | **Sí** |
| 28 | **Horas de sueño reportadas** | Insomnio o exceso de sueño | En el registro semanal | **Sí** |
| 29 | **Ansiedad** | Fase previa (ansiedad, tensión) | En el registro semanal | **Sí** |
| 30 | **Irritabilidad** | Fase previa | — | No (barato de agregar) |
| 31 | **Esperanza en el futuro** | Desesperanza (en la Clasificación Internacional, no en los cuestionarios) | — | No (barato de agregar) |
| 32 | **Interés o placer** | Pérdida de interés | Dentro de la versión de dos preguntas | **Sí** |
| 33 | **Versión de dos preguntas** del cuestionario de salud del paciente | Ánimo e interés | Cuando la puntuación llega a "media" | **Sí** |
| 34 | **Cuestionario de salud del paciente de nueve preguntas**, con la pregunta 9 de seguridad | Los nueve síntomas | Cada 2 semanas, o cuando lo dispara la versión de dos preguntas | **Sí** |
| 35 | **Escala de ansiedad generalizada de siete preguntas** | Ansiedad | Mensual o cuando se dispare | No |
| 36 | **"¿Te ayudó?"** después de cada pequeño paso | Qué le funciona a cada persona (aprendizaje) | Después de cada acción | **Sí** |

### D. De una pulsera, reloj o anillo, a través de las plataformas de salud del celular (Health Connect en Android, HealthKit en iOS): hoja de ruta, no este fin de semana

| # | Señal | Indicador indirecto de qué síntoma | Evidencia | Nota |
|---|---|---|---|---|
| 37 | **Pasos y minutos de actividad** del dispositivo | Cansancio, lentitud | Moderada | Más confiable que el celular olvidado en la mesa |
| 38 | **Ritmo de actividad y descanso en 24 horas** (contraste día–noche y regularidad entre días) | Ritmo diario, sueño, cansancio | Moderada | Requiere usarlo de noche |
| 39 | **Hora de dormir, hora de despertar y duración del sueño** | Insomnio o exceso de sueño | A nivel de síntoma | No usar las fases del sueño |
| 40 | **Frecuencia cardiaca en reposo y durante la noche** | Estado físico general | No revisada para la depresión | Leer solo contra su propia línea base |
| 41 | **Variabilidad de la frecuencia cardiaca durante la noche** | Estrés y equilibrio del sistema nervioso | Moderada a nivel de grupo | **Los antidepresivos la alteran**: reiniciar la línea base si cambia el medicamento; un anillo comercial la subestimó unos 16 milisegundos |
| 42 | **Luz ambiental** (algunos relojes) | Exposición a la luz | Moderada | La manga tapa el sensor |
| 43 | **Temperatura de la piel** | — | Muy débil (sin estudios en depresión) | Solo exploratoria |
| 44 | **Actividad eléctrica de la piel** | — | Muy débil | Solo exploratoria |

### E. De la clínica, no de la aplicación

| # | Señal | Uso |
|---|---|---|
| 45 | Puntajes clínicos del tratamiento (escalas de Hamilton o de Montgomery-Åsberg) | Punto de partida al alta |
| 46 | **Señales tempranas personales** que define la clínica al alta (por ejemplo: duerme más tarde, se queda en casa, irritable) | Hiillos vigila exactamente esas (tarea S3) |
| 47 | Electroencefalograma de la clínica antes y después del tratamiento | Capa de investigación, nunca alarma (ver `EEG_FOR_URIEL.md`) |
| 48 | Cambios de medicamento | Anotar o reiniciar la línea base de la variabilidad de la frecuencia cardiaca |

**Lo que Hiillos nunca capta:** contenido de mensajes, llamadas, correos o pantallas; qué aplicaciones o videos ve la persona; coordenadas exactas; cámara o pupila; reconocimiento facial.

## 8. Antes de poner algo en una diapositiva

- Confirmar con el socio clínico la ruta de la pregunta 9, el número de la línea de crisis y la situación regulatoria. Una aplicación que alerta a la clínica sobre riesgo suicida probablemente sea un producto sanitario según el reglamento europeo (es una inferencia).
- Revisar en su fuente original cada cifra marcada [SIN VERIFICAR].
- Decir "ilustrativo, no calibrado" para cualquier tamaño de efecto de los datos sintéticos.
- Verificar la viabilidad técnica de cada señal de la sección 7 en la documentación actual de Expo, Android e iOS antes de prometerla.

*Fuente: nota de investigación "Score symptoms first, let sensors prompt" (proyecto Junction, `claude/junction2026_research_depression_symptoms_signals.md`). Versión en inglés: `docs/CLINICAL_SIGNALS.md`.*
