// 05-seed-data.js — Datos semilla de materiales y equipos
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  DEFAULT MATERIALES DATA
// ═══════════════════════════════════════
function loadDefaultMateriales() {
  items = [];
  function a(loc, drawer, n, name, brand, qty, status, obs) {
    items.push({ id: String(nextId++), section: "materiales", location: loc, drawer, num: n, name, brand: brand||"", quantity: String(qty), status, observations: obs||"" });
  }

  // ESCRITORIO
  a("Escritorio","Cajón 1",1,"Marcadores","Genérica",6,"Presente","");
  a("Escritorio","Cajón 1",2,"Borrador de tablero","Madcolor",4,"Presente","");
  a("Escritorio","Cajón 1",3,"Control de televisor","LG",1,"Presente","Sin pilas");
  a("Escritorio","Cajón 1",4,"Reglas","Genérica",4,"Presente","");
  a("Escritorio","Cajón 1",5,"Escuadras","Genérica",3,"Presente","");
  a("Escritorio","Cajón 1",6,"Calza tuercas","Universal",2,"Presente","");
  a("Escritorio","Cajón 1",7,"Pie de rey","Universal",1,"Presente","");
  a("Escritorio","Cajón 1",8,"Lupa","Genérica",1,"Presente","");
  a("Escritorio","Cajón 1",9,"Puntero","Genérica",1,"Presente","");
  a("Escritorio","Cajón 1",10,"Engrapadora","Genérica",1,"Desgastado","Dañada");
  a("Escritorio","Cajón 2",1,"Manual de experimento óptica","ABC",1,"Presente","");
  a("Escritorio","Cajón 2",2,"Manual de experimento mecánica","ABC",1,"Presente","");
  a("Escritorio","Cajón 2",3,"Advanced Physics","Vernier",1,"Presente","");
  a("Escritorio","Cajón 2",4,"Physics Explorations","Vernier",1,"Presente","");
  a("Escritorio","Cajón 2",5,"Libro de mariposas","—",1,"Presente","");
  a("Escritorio","Cajón 2",6,"Papeles y carpetas","—","Varios","Presente","");
  a("Escritorio","Cajón 3",1,"(Vacío)","—","—","No Préstamo","Cajón vacío");
  a("Escritorio","Cajón 4",1,"Multímetro","UNI-T",1,"Presente","");
  a("Escritorio","Cajón 4",2,"LabQuest 3","Vernier",1,"Presente","");
  a("Escritorio","Cajón 5",1,"Flexómetro","Variedad",7,"Presente","");
  a("Escritorio","Cajón 5",2,"Micrómetro","UBERMANN",3,"Presente","");
  a("Escritorio","Cajón 5",3,"Pie de rey","UBERMANN",3,"Presente","");
  a("Escritorio","Cajón 5",4,"Pie de rey","Security",1,"Presente","");
  a("Escritorio","Cajón 5",5,"Pie de rey","Genérica",2,"Presente","");
  a("Escritorio","Cajón 6",1,"Multímetro","UNI-T",3,"Presente","");
  a("Escritorio","Cajón 6",2,"Kit de soldadura","Hi-Troni",1,"Presente","Estuche");
  a("Escritorio","Cajón 7",1,"M-OEK","Vernier",1,"Presente","Caja");
  a("Escritorio","Cajón 7",2,"TOF-VPL","Vernier",1,"Presente","Caja");
  a("Escritorio","Cajón 7",3,"Power Amplifier","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",4,"GD – Thermocouple","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",5,"GD – Photogate","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",6,"GD – Temperature","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",7,"GD – Energy","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",8,"Kit Gas Pressure","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",9,"GD – Magnetic Field","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",10,"GD – Light & Color","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",11,"GD – Sound","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",12,"GD – Static Charge","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",13,"GD – Gas Pressure","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",14,"Interface Shield","Vernier",1,"Presente","");
  a("Escritorio","Cajón 7",15,"Arduino","Vernier",1,"Presente","");
  a("Escritorio","Cajón 8",1,"Kit de imanes","Genérico",1,"Presente","Caja");
  a("Escritorio","Cajón 8",2,"Kit jaula de Faraday","Vernier",1,"Presente","Caja");
  a("Escritorio","Cajón 9",1,"Kit de lentes OEK","Vernier",1,"Presente","Caja");
  a("Escritorio","Cajón 9",2,"GD – Monitor Detector","Vernier",1,"Presente","");
  a("Escritorio","Cajón 9",3,"GD – Rotary Motion Sensor","Vernier",1,"Presente","");
  a("Escritorio","Cajón 9",4,"Spring Set","Vernier",1,"Presente","");
  a("Escritorio","Cajón 9",5,"Instrumentation Amplifier","Vernier",1,"Presente","");
  a("Escritorio","Cajón 9",6,"GD – Force/Acceleration","Vernier",1,"Presente","");
  a("Escritorio","Cajón 10",1,"Kit mesa de fuerza","AZEHEB",1,"Presente","Caja");
  a("Escritorio","Cajón 11",1,"Mototool","DREMEL",1,"Presente","");
  a("Escritorio","Cajón 11",2,"Manuales","Varios","Varios","Presente","");
  a("Escritorio","Cajón 12",1,"Kit Gramera","RUISHAN",2,"Presente","1 kg, base, fuente, gramera");

  // ARMARIO GRIS (vacío por ahora)
  a("Armario Gris","Piso 1",1,"(Pendiente de inventario)","—","—","No Préstamo","Por inventariar");
  a("Armario Gris","Piso 2",1,"(Pendiente de inventario)","—","—","No Préstamo","Por inventariar");
  a("Armario Gris","Piso 3",1,"(Pendiente de inventario)","—","—","No Préstamo","Por inventariar");
  a("Armario Gris","Piso 4",1,"(Pendiente de inventario)","—","—","No Préstamo","Por inventariar");
  a("Armario Gris","Piso 5",1,"(Pendiente de inventario)","—","—","No Préstamo","Por inventariar");


  // Materiales por fuera
  const mp="Materiales por fuera", md="Mesa de laboratorio";
  a(mp,md,1,"Portalámparas con socket en base negra","",2,"Faltante","Kits B y E → B2-5, E2-5. Devueltos");
  a(mp,md,2,"Portalámparas adicionales","",2,"Faltante","Sin kit definido");
  a(mp,md,3,"Poleas ABC (par)","ABC",1,"Faltante","Kit E → E1-6. Devuelto");
  a(mp,md,4,"Esferas de vidrio / matraz esférico","",2,"Dañado","Kit E → E1-3. 1 ROTA");
  a(mp,md,5,"Espejo cóncavo en soporte metálico","",1,"Faltante","Sin kit definido (Óptica)");
  a(mp,md,6,"Imanes en U (herradura)","",2,"Faltante","Sin kit definido (Electricidad)");
  a(mp,md,7,"Soportes trípode negros","",3,"Faltante","Kits B, C, D o E (Mecánica)");
  a(mp,md,8,"Soporte universal (varillas)","",1,"Faltante","Sin kit definido");
  a(mp,md,9,"Fuente de alimentación / transformador","",1,"Faltante","Sin kit definido (Óptica)");
  a(mp,md,10,"Péndulos de demostración","",1,"Faltante","Material de demostración");
  a(mp,md,11,"Cajas acrílicas transparentes","",2,"Faltante","Sin kit definido");
  a(mp,md,12,"Poleas blancas con soporte de disco","",3,"Faltante","Sacados para demostración");
  a(mp,md,13,"Pinzas / mordazas de sujeción","",4,"Faltante","Componente genérico");
  a(mp,md,14,"Carrete de hilo negro","",1,"Faltante","Material de consumo");
  a(mp,md,15,"Bombilla roja en portalámpara","",1,"Faltante","Sin kit definido (Electricidad)");
  a(mp,md,16,"Pieza negra en forma de gota / pantalla","",1,"Faltante","Posible accesorio de banco óptico");
  a(mp,md,17,"Fuente de poder (equipo azul)","",1,"Faltante","Equipo con pantalla digital, no estándar ABC");
  a(mp,md,18,"Figura / modelo demostrativo","",1,"Faltante","Material didáctico");
}


// ═══════════════════════════════════════
//  DEFAULT EQUIPOS DATA
// ═══════════════════════════════════════
function loadDefaultEquipos() {
  // Remove any existing equipos items
  items = items.filter(i => i.section !== "equipos");

  function addRef(kit, mod, n, name, brand, qty, status, obs) {
    items.push({ id: String(nextId++), section: "equipos", location: kit, drawer: mod, num: n, name, brand: brand||"ABC", quantity: String(qty), status, observations: obs||"" });
  }

  // ABC reference data per module - same for all kits
  function loadKitData(kit) {
    // ── Acústica ──
    const ac = "Acústica";
    addRef(kit,ac,1,"Diapasón con caja de resonancia (par)","ABC",1,"Presente","");
    addRef(kit,ac,2,"Diapasón registrador","ABC",1,"Presente","");
    addRef(kit,ac,3,"Fonendoscopio","ABC",1,"Presente","");
    addRef(kit,ac,4,"Lámina acrílica blanca 210 x 138 mm","ABC",1,"Presente","");
    addRef(kit,ac,5,"Marimba","ABC",1,"Presente","");
    addRef(kit,ac,6,"Monocordio-sonómetro","ABC",1,"Presente","Incluye: cejilla movible, vaso porta pesas");
    addRef(kit,ac,7,"Modelo principio de teléfono","ABC",1,"Presente","");
    addRef(kit,ac,8,"Silbato","ABC",1,"Presente","");
    addRef(kit,ac,9,"Tubo labial abierto","ABC",1,"Presente","");
    addRef(kit,ac,10,"Tubo labial cerrado","ABC",1,"Presente","");
    addRef(kit,ac,11,"Estuche","ABC",1,"Presente","");
    addRef(kit,ac,12,"Manual de experiencias","ABC",1,"Presente","");
    addRef(kit,ac,13,"4 arandelas rígidas (Tubo de Kundt)","ABC",4,"Presente","");
    addRef(kit,ac,14,"Base en madera con prensa (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,15,"Polvo de corcho o licopodio (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,16,"Tubo metálico (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,17,"Tubo en vidrio exterior (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,18,"Tubo en vidrio interior (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,19,"Varilla en madera (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,20,"Embudo (Tubo de Kundt)","ABC",1,"Presente","");
    addRef(kit,ac,21,"Tapones de caucho (Tubo de Kundt)","ABC",2,"Presente","");

    // ── Calorimetría ──
    // Ítems organizados por bandeja física según fotos del manual ABC
    const cal = "Calorimetría";
    // — Bandeja izquierda (instrumentos alargados y accesorios pequeños) —
    addRef(kit,cal,1,"Soporte metálico triangular, varilla de 70 cm","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,2,"Refrigerante recto de Liebig de 200 mm","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,3,"Dilatómetro de metales (pirómetro)","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,4,"Aparato de Ingenhousz","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,5,"Agitador de vidrio","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,6,"Escala centimétrica","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,7,"Tubos de vidrio","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,8,"Termómetros para laboratorio","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,9,"Tubos de ensayo refractario","ABC",3,"Presente","Bandeja izquierda");
    addRef(kit,cal,10,"Cilindros de aluminio de 25 g","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,11,"Cilindros de cobre de 25 g","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,12,"Tapón de caucho T-0 con perforación para tubo de 6 mm","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,13,"Tapón de caucho T-4 para balón de destilación, con orificio para termómetro","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,14,"Tapón de caucho T-4 para balón de destilación","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,15,"Tapón de caucho T-6 sin perforaciones","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,16,"Tapón T-6 con orificio para termómetro","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,17,"Tapón de caucho T-1 para balón de 50 ml","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,18,"Nueces o pinzas para sujeción N-4011C","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,19,"Pinza para tubos de ensayo en madera","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,20,"Pinzas para erlenmeyers, balones, etc","ABC",2,"Presente","Bandeja izquierda");
    addRef(kit,cal,21,"Pinza para bureta sencilla E-1006","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,22,"Jeringa plástica","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,23,"Manguera de látex de 3 x 7 mm (1 m long.)","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,24,"Manguera de caucho para laboratorio de 8 x 12 mm (2 m)","ABC",1,"Presente","Bandeja izquierda");
    addRef(kit,cal,25,"Puntas de conexión juego x 2","ABC",1,"Presente","Bandeja izquierda");
    // — Bandeja derecha (aparatos grandes y vidriería) —
    addRef(kit,cal,26,"Balanza","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,27,"Calorímetro de Joule","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,28,"Anillo y bola de Gravesande","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,29,"Pulsómetro de Franklin","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,30,"Erlenmeyer","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,31,"Balón de destilación corriente","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,32,"Balón fondo redondo","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,33,"Vaso de precipitado","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,34,"Mechero de alcohol","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,35,"Trípode en hierro","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,36,"Malla en alambre galvanizado c/ asbesto","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,37,"Azul de metileno indic. color. frasco x 25 g","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,38,"Parafina sólida en trozos de 100 g","ABC",1,"Presente","Bandeja derecha");
    addRef(kit,cal,39,"Manual guía de experimentación","ABC",1,"Presente","Bandeja derecha");

    // ── Mecánica ──
    const mec = "Mecánica";
    addRef(kit,mec,1,"Aparato de péndulo con juego de cuatro","ABC",1,"Presente","");
    addRef(kit,mec,2,"Aparato para la determinación de momentos y fuerzas","ABC",1,"Presente","");
    addRef(kit,mec,3,"Calibrador Vernier en acero","ABC",1,"Presente","");
    addRef(kit,mec,4,"Carrete de hilo","ABC",1,"Presente","");
    addRef(kit,mec,5,"Carros dinámicos (Juego de 2)","ABC",2,"Presente","");
    addRef(kit,mec,6,"Cronómetro plástico","ABC",1,"Presente","");
    addRef(kit,mec,7,"Dinamómetros","ABC",3,"Presente","");
    addRef(kit,mec,8,"Disparador o tiro parabólico","ABC",1,"Presente","");
    addRef(kit,mec,9,"Escala centimétrica","ABC",1,"Presente","");
    addRef(kit,mec,10,"Esfera de madera pequeña con gancho","ABC",1,"Presente","");
    addRef(kit,mec,11,"Esferas de madera grande con gancho","ABC",2,"Presente","");
    addRef(kit,mec,12,"Esferómetro de demostración","ABC",1,"Presente","");
    addRef(kit,mec,13,"Figuras centro de gravedad juego por 4","ABC",1,"Presente","");
    addRef(kit,mec,14,"Giroscopio modelo sencillo","ABC",1,"Presente","");
    addRef(kit,mec,15,"Nuez con gancho N-4015 GA","ABC",1,"Presente","");
    addRef(kit,mec,16,"Nuez o pinza para sujeción fija N-4011C","ABC",1,"Presente","");
    addRef(kit,mec,17,"Nuez o pinza para sujeción giratoria N-4055GI","ABC",1,"Presente","");
    addRef(kit,mec,18,"Pesas con gancho en juego 6 unidades","ABC",1,"Presente","");
    addRef(kit,mec,19,"Plano inclinado con juego de accesorios","ABC",1,"Presente","");
    addRef(kit,mec,20,"Polea diferencial","ABC",1,"Presente","");
    addRef(kit,mec,21,"Poleas sencillas con gancho","ABC",3,"Presente","");
    addRef(kit,mec,22,"Polea en paralelo (juego de 2)","ABC",1,"Presente","");
    addRef(kit,mec,23,"Polea en paralelo (juego de 3)","ABC",1,"Presente","");
    addRef(kit,mec,24,"Polipastos de 3 poleas triescalonadas","ABC",2,"Presente","");
    addRef(kit,mec,25,"Registrador de tiempo (ticómetro)","ABC",1,"Presente","");
    addRef(kit,mec,26,"Regla graduada de 50 cm acrílica","ABC",1,"Presente","");
    addRef(kit,mec,27,"Resortes de diferente elongación","ABC",3,"Presente","");
    addRef(kit,mec,28,"Tornillo micrométrico en acero inoxidable 0 a 25","ABC",1,"Presente","");
    addRef(kit,mec,29,"Torre inclinada de estabilidad","ABC",1,"Presente","");
    // ── Aro de Muller (accesorios Mecánica) ──
    addRef(kit,mec,30,"Anillo con mango","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,31,"Aros metálicos","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,32,"Bases triangulares","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,33,"Dedal con hilo","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,34,"Esferas de acero, cojinete para dedal","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,35,"Nueces dobles N-4011C","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,36,"Pesas para momento con prisionero / juego","ABC",4,"Presente","Aro de Muller");
    addRef(kit,mec,37,"Pesas para movimiento en juego","ABC",4,"Presente","Aro de Muller");
    addRef(kit,mec,38,"Polea sencilla con mango","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,39,"Porta pesas","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,40,"Prensa de mesa en aluminio","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,41,"Tensores graduables con hilo","ABC",3,"Presente","Aro de Muller");
    addRef(kit,mec,42,"Tope para aro de Muller","ABC",1,"Presente","Aro de Muller");
    addRef(kit,mec,43,"Varillas, una con orificio superior","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,44,"Varillas de rotación","ABC",2,"Presente","Aro de Muller");
    addRef(kit,mec,45,"Varilla metálica de 70 cm","ABC",1,"Presente","Aro de Muller");
    // ── Ondas ──
    const ond = "Ondas";
    addRef(kit,ond,1,"Cubeta de ondas (bandeja azul con vidrio)","ABC",1,"Presente","Con barreras internas");
    addRef(kit,ond,2,"Adaptador para fuente vibradora","ABC",1,"Presente","Con cable");
    addRef(kit,ond,3,"Varillas de soporte (par)","ABC",2,"Presente","Negras, largas");
    addRef(kit,ond,4,"Soporte trípode","ABC",1,"Presente","");
    addRef(kit,ond,5,"Disco estroboscópico rojo","ABC",1,"Presente","");
    addRef(kit,ond,6,"Pinzas / abrazaderas","ABC",2,"Presente","");
    addRef(kit,ond,7,"Barreras y accesorios de ondas","ABC",1,"Presente","");
    addRef(kit,ond,8,"Manual de experiencias","ABC",1,"Presente","");
    addRef(kit,ond,9,"Estuche","ABC",1,"Presente","");
    addRef(kit,ond,10,"Fuente vibradora","ABC",1,"Presente","");
    addRef(kit,ond,11,"Generador de ondas","ABC",1,"Presente","");
    addRef(kit,ond,12,"Lámina de vidrio","ABC",1,"Presente","");
    addRef(kit,ond,13,"Pantalla de reflexión","ABC",1,"Presente","");
    addRef(kit,ond,14,"Peine para difracción","ABC",1,"Presente","");
    addRef(kit,ond,15,"Rendija simple y doble","ABC",1,"Presente","");
    addRef(kit,ond,16,"Superficie de absorción","ABC",1,"Presente","");
    addRef(kit,ond,17,"Superficie parabólica","ABC",1,"Presente","");
    addRef(kit,ond,18,"Barrera de vidrio plana","ABC",1,"Presente","");
    addRef(kit,ond,19,"Varilla de agitación","ABC",1,"Presente","");
    addRef(kit,ond,20,"Nivel de burbuja","ABC",1,"Presente","");
    addRef(kit,ond,21,"Bombilla para estroboscopio","ABC",1,"Presente","");
    addRef(kit,ond,22,"Espejo plano","ABC",1,"Presente","");

    // ── Electrónica II ──
    const elec = "Electrónica II";
    addRef(kit,elec,1,"Tablero de Electrónica II","ABC",1,"Presente","Con terminales, resistencias, parlante, antena");
    addRef(kit,elec,2,"Amperímetro analógico","ABC",1,"Presente","Escala de aguja");
    addRef(kit,elec,3,"Multímetro digital","ABC",1,"Presente","");
    addRef(kit,elec,4,"Punta de prueba / cable con caimán","ABC",1,"Presente","");
    addRef(kit,elec,5,"Bobinas de 400 espiras","ABC",3,"Presente","");
    addRef(kit,elec,6,"Bobinas de 1000 espiras","ABC",2,"Presente","");
    addRef(kit,elec,7,"Panel indicador de espiras","ABC",1,"Presente","");
    addRef(kit,elec,8,"Portalámpara con bombilla","ABC",1,"Presente","En base negra");
    addRef(kit,elec,9,"Bobina de cobre pequeña","ABC",1,"Presente","");
    addRef(kit,elec,10,"Reóstato de alambre","ABC",1,"Presente","Cilíndrico");
    addRef(kit,elec,11,"Láminas / placas rojas (electroimán)","ABC",5,"Presente","Con terminales");
    addRef(kit,elec,12,"Imán cilíndrico","ABC",1,"Presente","");
    addRef(kit,elec,13,"Varillas y conectores varios","ABC",4,"Presente","");
    addRef(kit,elec,14,"Alambres de conexión (juego)","ABC",1,"Presente","");
    addRef(kit,elec,15,"Resistencias 1/4 W (juego)","ABC",1,"Presente","");
    addRef(kit,elec,16,"Circuitos integrados (juego)","ABC",1,"Presente","");
    addRef(kit,elec,17,"Transistores y diodos (juego)","ABC",1,"Presente","");
    addRef(kit,elec,18,"Condensadores (juego)","ABC",1,"Presente","");
    addRef(kit,elec,19,"Manual de experiencias","ABC",1,"Presente","");
    addRef(kit,elec,20,"Estuche","ABC",1,"Presente","");
    // Additional from original Electrónica section
    addRef(kit,elec,21,"Juego de pesas patrón (base madera)","ABC",1,"Presente","6 pesas negras");
    addRef(kit,elec,22,"Cables de conexión con caimanes","ABC",1,"Presente","");
    addRef(kit,elec,23,"Galvanómetro/Amperímetro de cero central","ABC",1,"Presente","");
    addRef(kit,elec,24,"Resistencia de década","ABC",1,"Presente","");
    addRef(kit,elec,25,"Capacitor de década","ABC",1,"Presente","");
    addRef(kit,elec,26,"Parlante electromagnético","ABC",1,"Presente","Sobre tablero");

    // ── Mesa de Fuerzas (según manual oficial ABC) ──
    const mf = "Mesa de Fuerzas";
    addRef(kit,mf,1,"Soporte en hierro tipo H con 4 tornillos en la base, para su nivelación","ABC",1,"Presente","");
    addRef(kit,mf,2,"Varilla cromada, con rosca","ABC",1,"Presente","");
    addRef(kit,mf,3,"Arandelas en bronce, una fija y una móvil","ABC",2,"Presente","");
    addRef(kit,mf,4,"Tuerca cabeza redonda en bronce","ABC",1,"Presente","");
    addRef(kit,mf,5,"Mesa circular con doble graduación, divisiones de 1°, de 0 hasta 360°, plato de 30 cm de diámetro","ABC",1,"Presente","");
    addRef(kit,mf,6,"Prensas móviles metálicas con poleas","ABC",3,"Presente","");
    addRef(kit,mf,7,"Pesas con ranura de 200 gramos en bronce","ABC",3,"Presente","");
    addRef(kit,mf,8,"Pesas con ranura de 100 gramos en bronce","ABC",3,"Presente","");
    addRef(kit,mf,9,"Pesas con ranura de 50 gramos en bronce","ABC",3,"Presente","");
    addRef(kit,mf,10,"Pesas con ranura de 20 gramos de bronce","ABC",3,"Presente","");
    addRef(kit,mf,11,"Porta Pesas de 6 cm de largo en bronce con hilo","ABC",3,"Presente","");
    addRef(kit,mf,12,"Platillo en acero inoxidable de 7 cm de diámetro","ABC",1,"Presente","");
    addRef(kit,mf,13,"Anillo en cobre","ABC",1,"Presente","");
    addRef(kit,mf,14,"Manual guía","ABC",1,"Presente","");
    addRef(kit,mf,15,"Estuche de lujo en madera","ABC",1,"Presente","");

    // ── Óptica (listado oficial ABC) ──
    const op = "Óptica";
    addRef(kit,op,1,"Banco óptico de 50 cm","ABC",2,"Presente","");
    addRef(kit,op,2,"Base para prisma","ABC",1,"Presente","");
    addRef(kit,op,3,"Cubeta en acrílico para índice de refracción","ABC",1,"Presente","");
    addRef(kit,op,4,"Disco óptico de Hartl","ABC",1,"Presente","");
    addRef(kit,op,5,"Diodo láser","ABC",1,"Presente","");
    addRef(kit,op,6,"Espejo angular con escala de medición","ABC",1,"Presente","");
    addRef(kit,op,7,"Espejo cóncavo","ABC",1,"Presente","");
    addRef(kit,op,8,"Espejo convexo","ABC",1,"Presente","");
    addRef(kit,op,9,"Espejo plano","ABC",1,"Presente","");
    addRef(kit,op,10,"Espejo plano con tornillo","ABC",1,"Presente","");
    addRef(kit,op,11,"Fuente de poder 12 V","ABC",1,"Presente","");
    addRef(kit,op,12,"Lámpara de Reuter de 12 volt / 15 watt","ABC",1,"Presente","");
    // Juego de 6 lentes de vidrio circular
    addRef(kit,op,13,"Lente en vidrio circular de +6","ABC",1,"Presente","Juego de lentes");
    addRef(kit,op,14,"Lente en vidrio circular de +10","ABC",1,"Presente","Juego de lentes");
    addRef(kit,op,15,"Lente en vidrio circular de +12","ABC",1,"Presente","Juego de lentes");
    addRef(kit,op,16,"Lente en vidrio circular de +15","ABC",1,"Presente","Juego de lentes");
    addRef(kit,op,17,"Lente en vidrio circular de +28","ABC",1,"Presente","Juego de lentes");
    addRef(kit,op,18,"Lente en vidrio circular de -15","ABC",1,"Presente","Juego de lentes");
    // Modelos ópticos geométricos
    addRef(kit,op,19,"Lente biconvexa (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,20,"Lente bicóncava (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,21,"Lente plano convexo (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,22,"Prisma isósceles (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,23,"Prisma triangular (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,24,"Prisma trapezoidal (modelo geométrico)","ABC",1,"Presente","Modelo óptico geométrico");
    addRef(kit,op,25,"Pantalla de proyección","ABC",1,"Presente","");
    addRef(kit,op,26,"Porta placas","ABC",1,"Presente","");
    // Juego de 11 placas
    addRef(kit,op,27,"Placa de 1 ranura en línea","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,28,"Placa de 5 ranuras en línea","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,29,"Placa de 3 ranuras en línea","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,30,"Placa de 1 ranura en L","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,31,"Placa de 1 orificio pequeño 1.35 mm","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,32,"Placa de 1 orificio regular 2 mm","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,33,"Placa de 1 orificio circular mayor 2.7 mm","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,34,"Placa de 5 orificios regulares","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,35,"Placa en acrílico de color azul","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,36,"Placa en acrílico de color verde","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,37,"Placa en acrílico de color rojo","ABC",1,"Presente","Juego de 11 placas");
    addRef(kit,op,38,"Solución para índice de refracción y fenómeno de Tyndall","ABC",1,"Presente","");
    addRef(kit,op,39,"Soporte para diodo láser en acrílico","ABC",1,"Presente","");
    addRef(kit,op,40,"Soporte para disco óptico","ABC",1,"Presente","");
    addRef(kit,op,41,"Soportes para banco óptico","ABC",4,"Presente","");
    addRef(kit,op,42,"Estuche de lujo","ABC",1,"Presente","");
    addRef(kit,op,43,"Manual de experiencias","ABC",1,"Presente","");

    // ── Electricidad y Magnetismo ──
    const em = "Electricidad y Magnetismo";
    addRef(kit,em,1,"Fuente de poder DC 4 Amp","ABC",1,"Presente","Con voltímetro analógico");
    addRef(kit,em,2,"Bombilla con socket y cables caimán","ABC",1,"Presente","");
    addRef(kit,em,3,"Imanes de barra","ABC",2,"Presente","");
    addRef(kit,em,4,"Cables de conexión con caimanes","ABC",1,"Presente","Rojo/negro");
    addRef(kit,em,5,"Soportes trípode","ABC",2,"Presente","");
    addRef(kit,em,6,"Poleas ABC (par)","ABC",2,"Presente","");
    addRef(kit,em,7,"Brújula","ABC",1,"Presente","");
    addRef(kit,em,8,"Electroimán","ABC",1,"Presente","");
    addRef(kit,em,9,"Galvanómetro","ABC",1,"Presente","");
    addRef(kit,em,10,"Interruptor","ABC",1,"Presente","");
    addRef(kit,em,11,"Bombillos (juego)","ABC",3,"Presente","");
    addRef(kit,em,12,"Resistencias (juego)","ABC",1,"Presente","");
    addRef(kit,em,13,"Condensadores (juego)","ABC",1,"Presente","");
    addRef(kit,em,14,"Imanes en herradura","ABC",2,"Presente","");
    addRef(kit,em,15,"Núcleo de hierro dulce","ABC",1,"Presente","");
    addRef(kit,em,16,"Barras para electrostática","ABC",2,"Presente","");
    addRef(kit,em,17,"Paños de frotamiento","ABC",2,"Presente","");
  }

  // Generate data for all 6 kits
  ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"].forEach(kit => loadKitData(kit));

  // Apply photo review findings
  applyPhotoFindings();
}

// ═══════════════════════════════════════
//  PHOTO REVIEW FINDINGS (Sep 2026)
// ═══════════════════════════════════════
function applyPhotoFindings() {
  // Helper: find item by kit, module, and item number, then update status + obs
  function mark(kit, mod, num, status, obs) {
    const it = items.find(i => i.section==="equipos" && i.location===kit && i.drawer===mod && i.num===num);
    if (it) { it.status = status; if (obs) it.observations = obs; }
  }

  const allKits = ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"];
  const em = "Electricidad y Magnetismo";
  const ond = "Ondas";
  const mf = "Mesa de Fuerzas";
  const mec = "Mecánica";
  const op = "Óptica";

  // ══ ELECTRICIDAD Y MAGNETISMO — Todos los kits ══
  // Cajones consistentemente semivacíos. Solo visibles: fuente, trípodes, cables, imanes barra.
  allKits.forEach(kit => {
    mark(kit,em,7,"Faltante","No visible en revisión fotográfica");  // Brújula
    mark(kit,em,8,"Faltante","No visible en revisión fotográfica");  // Electroimán
    mark(kit,em,9,"Faltante","No visible en revisión fotográfica");  // Galvanómetro
    mark(kit,em,10,"Faltante","No visible en revisión fotográfica"); // Interruptor
    mark(kit,em,11,"Faltante","No visible en revisión fotográfica"); // Bombillos juego
    mark(kit,em,12,"Faltante","No visible en revisión fotográfica"); // Resistencias
    mark(kit,em,13,"Faltante","No visible en revisión fotográfica"); // Condensadores
    mark(kit,em,14,"Faltante","No visible en revisión fotográfica"); // Imanes herradura
    mark(kit,em,15,"Faltante","No visible en revisión fotográfica"); // Núcleo hierro dulce
    mark(kit,em,16,"Faltante","No visible en revisión fotográfica"); // Barras electrostática
    mark(kit,em,17,"Faltante","No visible en revisión fotográfica"); // Paños frotamiento
  });

  // ══ CUBETA DE ONDAS — Todos los kits ══
  // Consistentemente faltan la mayoría de accesorios
  allKits.forEach(kit => {
    mark(kit,ond,8,"Faltante","No visible en revisión fotográfica");  // Manual
    mark(kit,ond,9,"Faltante","No visible en revisión fotográfica");  // Estuche
    mark(kit,ond,11,"Faltante","No visible en revisión fotográfica"); // Generador ondas
    mark(kit,ond,12,"Faltante","No visible en revisión fotográfica"); // Lámina vidrio
    mark(kit,ond,13,"Faltante","No visible en revisión fotográfica"); // Pantalla reflexión
    mark(kit,ond,14,"Faltante","No visible en revisión fotográfica"); // Peine difracción
    mark(kit,ond,15,"Faltante","No visible en revisión fotográfica"); // Rendija simple/doble
    mark(kit,ond,16,"Faltante","No visible en revisión fotográfica"); // Superficie absorción
    mark(kit,ond,18,"Faltante","No visible en revisión fotográfica"); // Barrera vidrio plana
    mark(kit,ond,19,"Faltante","No visible en revisión fotográfica"); // Varilla agitación
    mark(kit,ond,20,"Faltante","No visible en revisión fotográfica"); // Nivel burbuja
    mark(kit,ond,21,"Faltante","No visible en revisión fotográfica"); // Bombilla estroboscopio
    mark(kit,ond,22,"Faltante","No visible en revisión fotográfica"); // Espejo plano
  });
  // Fuente vibradora: faltante en F, A, C
  ["Kit F","Kit A","Kit C"].forEach(kit => {
    mark(kit,ond,10,"Faltante","No visible en revisión fotográfica");
  });
  // Disco estroboscópico: faltante en A, B
  ["Kit A","Kit B"].forEach(kit => {
    mark(kit,ond,5,"Faltante","No visible en revisión fotográfica");
  });
  // Superficie parabólica: faltante en todos excepto D
  ["Kit A","Kit B","Kit C","Kit E","Kit F"].forEach(kit => {
    mark(kit,ond,17,"Faltante","No visible en revisión fotográfica");
  });

  // ══ MESA DE FUERZAS ══
  // (Datos corregidos en migración v11 con ítems del manual oficial ABC.
  //  Los estados deben verificarse manualmente con la nueva lista.)

  // ══ CALORIMETRÍA ══
  // (Datos corregidos en migración v12 con ítems del manual oficial ABC, divididos en 2 bandejas.
  //  Los estados deben verificarse manualmente con la nueva lista.)

  // ══ MECÁNICA — Kit C ══
  // Aparato de péndulo faltante solo en Kit C
  mark("Kit C",mec,1,"Faltante","No visible en revisión fotográfica — faltante significativo");
  // Cronómetro y pesas dudosos en Kit C
  mark("Kit C",mec,6,"Faltante","No claramente visible en revisión fotográfica");
  mark("Kit C",mec,18,"Faltante","No claramente visible en revisión fotográfica");
  // Segundo carro no visible en C y D
  // (ya están como qty 2 con status Presente, marcamos observación)

  // ══ ÓPTICA — Kit C ══
  // Pantalla manchada
  mark("Kit C",op,25,"Desgastado","Pantalla de proyección manchada con salpicaduras blancas");
}
