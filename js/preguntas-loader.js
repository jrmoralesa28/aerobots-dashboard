// =====================================================
// AEROBOTS - CARGADOR DE PREGUNTAS FRECUENTES
// =====================================================

let preguntasActuales = [];
let esEditor = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Pagina Preguntas cargada');

    await verificarRolEditor();
    await cargarPreguntas();
});

// =====================================================
// CARGAR PREGUNTAS DESDE SUPABASE
// =====================================================
async function cargarPreguntas() {
    const container = document.getElementById('faq-container');
    container.innerHTML = '<p class="loading-text">Cargando preguntas...</p>';

    const { data, error } = await supabaseClient
        .from('preguntas')
        .select('*')
        .order('categoria', { ascending: true })
        .order('orden', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error al cargar preguntas:', error);
        container.innerHTML = '<p class="error-text">Error al cargar las preguntas.</p>';
        return;
    }

    preguntasActuales = data || [];

    if (preguntasActuales.length === 0) {
        container.innerHTML = '<p class="empty-text">No hay preguntas registradas.</p>';
        return;
    }

    container.innerHTML = '';

    // Separar por categoria
    const generales = preguntasActuales.filter(p => p.categoria === 'general');
    const tecnicas = preguntasActuales.filter(p => p.categoria === 'tecnica');

    // Renderizar Generales
    if (generales.length > 0) {
        const header = document.createElement('h2');
        header.className = 'faq-category';
        header.textContent = 'Generales';
        container.appendChild(header);

        generales.forEach(pregunta => {
            container.appendChild(crearTarjetaPregunta(pregunta));
        });
    }

    // Renderizar Tecnicas
    if (tecnicas.length > 0) {
        const header = document.createElement('h2');
        header.className = 'faq-category';
        header.textContent = 'Tecnicas';
        container.appendChild(header);

        tecnicas.forEach(pregunta => {
            container.appendChild(crearTarjetaPregunta(pregunta));
        });
    }

    // Activar acordeon
    activarAcordeon();

    console.log(`Preguntas cargadas: ${preguntasActuales.length}`);
}

// =====================================================
// CREAR TARJETA DE PREGUNTA
// =====================================================
function crearTarjetaPregunta(pregunta) {
    const card = document.createElement('div');
    card.className = 'faq-card';
    card.dataset.preguntaId = pregunta.id;

    const accionesHTML = esEditor ? `
        <div class="step-actions">
            <button class="btn-step-action btn-step-edit" data-pregunta-id="${pregunta.id}">Editar</button>
            <button class="btn-step-action btn-step-delete" data-pregunta-id="${pregunta.id}">Eliminar</button>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="faq-header">
            <h3 class="faq-question">${pregunta.pregunta}</h3>
            <div class="faq-toggle">v</div>
        </div>
        <div class="faq-body">
            <p>${pregunta.respuesta}</p>
            ${accionesHTML}
        </div>
    `;

    // Eventos de botones
    if (esEditor) {
        card.querySelector('.btn-step-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalEditarPregunta(pregunta.id);
        });

        card.querySelector('.btn-step-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarPregunta(pregunta.id);
        });
    }

    return card;
}

// =====================================================
// ACTIVAR ACORDEON
// =====================================================
function activarAcordeon() {
    const faqCards = document.querySelectorAll('.faq-card');

    faqCards.forEach(card => {
        const header = card.querySelector('.faq-header');

        header.addEventListener('click', (e) => {
            if (e.target.closest('.step-actions')) return;

            const isExpanded = card.classList.contains('expanded');
            faqCards.forEach(c => c.classList.remove('expanded'));
            if (!isExpanded) {
                card.classList.add('expanded');
            }
        });
    });
}

// =====================================================
// VERIFICAR ROL
// =====================================================
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
        document.getElementById('btn-add-pregunta').style.display = 'inline-block';
    }
}