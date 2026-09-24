// =====================================================
// AEROBOTS - CARGADOR DE EQUIPOS
// =====================================================

let categoriaActual = null;
let origenActual = null;

async function cargarEquipos(categoriaId, origen) {
    categoriaActual = categoriaId;
    origenActual = origen;

    const container = document.getElementById('equipos-container');
    container.innerHTML = '<p class="loading-text">Cargando equipos...</p>';

    const { data, error } = await supabaseClient
        .from('equipos')
        .select('id, nombre, estado, descripcion')
        .eq('categoria_id', categoriaId)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error al cargar equipos:', error);
        container.innerHTML = '<p class="error-text">Error al cargar equipos. Verifica la conexion.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="empty-text">No hay equipos en esta categoria.</p>';
        return;
    }

    container.innerHTML = '';

    const equiposConPasos = await Promise.all(data.map(async (equipo) => {
        const { count } = await supabaseClient
            .from('pasos')
            .select('*', { count: 'exact', head: true })
            .eq('equipo_id', equipo.id);

        return { ...equipo, numPasos: count || 0 };
    }));

    equiposConPasos.forEach((equipo, index) => {
        const card = document.createElement('a');
        card.href = '#';
        card.className = 'process-card equipo-card';
        card.dataset.equipo = equipo.nombre;
        card.dataset.equipoId = equipo.id;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        const badgeClass = equipo.estado === 'authorized' ? 'aprobado' : 'pendiente';
        const badgeText = equipo.estado === 'authorized' ? 'Aprobado' : 'Pendiente';

        const descripcionHTML = equipo.descripcion
            ? `<p class="card-description">${equipo.descripcion}</p>`
            : '';

        card.innerHTML = `
            <div class="card-header">
                <h2>${equipo.nombre}</h2>
            </div>
            ${descripcionHTML}
            <div class="card-meta">
                <span class="step-count">${equipo.numPasos} pasos</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="card-footer">
                <span class="arrow">-></span>
            </div>
        `;

        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 60);

        card.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `equipo.html?id=${equipo.id}&origen=${origen}`;
        });
    });

    console.log(`Equipos cargados: ${equiposConPasos.length}`);

    await verificarRolParaCrear();
}

async function verificarRolParaCrear() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const btnAdd = document.getElementById('btn-add-equipo');

    if (!session || !btnAdd) return;

    const { data: perfil } = await supabaseClient
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();

    if (perfil?.rol === 'editor') {
        btnAdd.style.display = 'inline-block';
    }
}