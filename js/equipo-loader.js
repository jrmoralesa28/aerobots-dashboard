// =====================================================
// AEROBOTS - CARGADOR DE EQUIPO Y PASOS
// =====================================================

let equipoActual = null;
let pasosActuales = [];
let esEditor = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Pagina Equipo cargada');

    const params = new URLSearchParams(window.location.search);
    const equipoId = params.get('id');
    const origen = params.get('origen') || 'armado';

    if (!equipoId) {
        document.getElementById('equipo-title').textContent = 'Equipo no encontrado';
        document.getElementById('steps-container').innerHTML = '<p class="error-text">No se especifico un equipo.</p>';
        return;
    }

    const backLink = document.getElementById('back-link');
    const origenesValidos = ['armado', 'mantenimiento', 'limpieza', 'materiales'];
    if (origenesValidos.includes(origen)) {
        backLink.href = `${origen}.html`;
    } else {
        backLink.href = '../index.html';
    }

    await verificarRolEditor();
    await cargarEquipo(equipoId);
    await cargarPasos(equipoId);
});

async function cargarEquipo(equipoId) {
    const { data, error } = await supabaseClient
        .from('equipos')
        .select('id, nombre, estado, descripcion, categoria_id')
        .eq('id', equipoId)
        .single();

    if (error || !data) {
        console.error('Error al cargar equipo:', error);
        document.getElementById('equipo-title').textContent = 'Equipo no encontrado';
        return;
    }

    equipoActual = data;
    document.getElementById('equipo-title').textContent = data.nombre;

    const badge = document.getElementById('equipo-badge');
    badge.style.display = 'inline-block';
    if (data.estado === 'authorized') {
        badge.textContent = 'Aprobado';
        badge.className = 'badge aprobado';
    } else {
        badge.textContent = 'Pendiente';
        badge.className = 'badge pendiente';
    }
}

async function cargarPasos(equipoId) {
    const container = document.getElementById('steps-container');
    container.innerHTML = '<p class="loading-text">Cargando pasos...</p>';

    const { data, error } = await supabaseClient
        .from('pasos')
        .select('*')
        .eq('equipo_id', equipoId)
        .order('numero_paso', { ascending: true });

    if (error) {
        console.error('Error al cargar pasos:', error);
        container.innerHTML = '<p class="error-text">Error al cargar los pasos.</p>';
        return;
    }

    pasosActuales = data || [];

    const stepCount = document.getElementById('equipo-step-count');
    stepCount.textContent = `${pasosActuales.length} pasos`;

    if (pasosActuales.length === 0) {
        container.innerHTML = '<p class="empty-text">Este equipo aun no tiene pasos registrados.</p>';
        return;
    }

    container.innerHTML = '';

    pasosActuales.forEach((paso) => {
        const card = document.createElement('div');
        card.className = 'step-card';
        card.dataset.pasoId = paso.id;

        const tipoLabels = {
            'herramienta': 'Herramienta',
            'componente': 'Componente',
            'material': 'Material',
            'equipo': 'Equipo'
        };
        const tipoTexto = tipoLabels[paso.tipo_objeto] || 'General';
        const tipoClase = paso.tipo_objeto ? `tipo-${paso.tipo_objeto}` : '';

        let imagenHTML = '';
        if (paso.imagen_url) {
            imagenHTML = `
                <div class="step-image-wrapper">
                    <img src="${paso.imagen_url}" alt="Imagen del paso" class="step-image" onclick="abrirImagen('${paso.imagen_url}')">
                </div>
            `;
        }

        let herramientasHTML = '';
        if (paso.herramientas_necesarias && paso.herramientas_necesarias.length > 0) {
            herramientasHTML = `
                <div class="step-section">
                    <h4>Herramientas necesarias</h4>
                    <ul class="step-list">
                        ${paso.herramientas_necesarias.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        let advertenciasHTML = '';
        if (paso.advertencias && paso.advertencias.length > 0) {
            advertenciasHTML = `
                <div class="step-section">
                    <h4>Advertencias / Notas</h4>
                    <ul class="step-list step-warnings">
                        ${paso.advertencias.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        const accionesHTML = esEditor ? `
            <div class="step-actions">
                <button class="btn-step-action btn-step-edit" data-paso-id="${paso.id}">Editar</button>
                <button class="btn-step-action btn-step-delete" data-paso-id="${paso.id}">Eliminar</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="step-header">
                <div class="step-number">${paso.numero_paso}</div>
                <div class="step-title-wrapper">
                    <h3 class="step-title">${paso.titulo}</h3>
                    ${paso.tipo_objeto ? `<span class="step-type ${tipoClase}">${tipoTexto}</span>` : ''}
                </div>
                <div class="step-toggle">v</div>
            </div>
            <div class="step-body">
                <p class="step-description">${paso.descripcion || 'Sin descripcion.'}</p>
                ${imagenHTML}
                ${herramientasHTML}
                ${advertenciasHTML}
                ${accionesHTML}
            </div>
        `;

        container.appendChild(card);
    });

    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach(card => {
        const header = card.querySelector('.step-header');
        header.addEventListener('click', (e) => {
            if (e.target.closest('.step-actions')) return;
            if (e.target.closest('.step-image')) return;
            const isExpanded = card.classList.contains('expanded');
            stepCards.forEach(c => c.classList.remove('expanded'));
            if (!isExpanded) {
                card.classList.add('expanded');
            }
        });
    });

    container.querySelectorAll('.btn-step-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalEditarPaso(btn.dataset.pasoId);
        });
    });

    container.querySelectorAll('.btn-step-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarPaso(btn.dataset.pasoId);
        });
    });
}

async function verificarRolEditor() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: perfil } = await supabaseClient
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();

    if (perfil?.rol === 'editor') {
        esEditor = true;
        document.getElementById('btn-edit-equipo').style.display = 'inline-block';
        document.getElementById('btn-delete-equipo').style.display = 'inline-block';
        document.getElementById('btn-add-paso').style.display = 'inline-block';
    }
}

function abrirImagen(url) {
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.innerHTML = `<img src="${url}" alt="Imagen ampliada">`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}