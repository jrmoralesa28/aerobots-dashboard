// =====================================================
// AEROBOTS - DASHBOARD PRINCIPAL
// =====================================================

let esEditor = false;
let categoriasActuales = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Aerobots Dashboard cargado');

    await verificarSesion();
    await cargarCategorias();

    setupModalLogin();
    setupModalEditarCategoria();
});

// =====================================================
// CARGAR CATEGORIAS DESDE SUPABASE
// =====================================================
async function cargarCategorias() {
    const container = document.getElementById('categorias-container');
    container.innerHTML = '<p class="loading-text">Cargando categorias...</p>';

    const { data, error } = await supabaseClient
        .from('categorias')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error al cargar categorias:', error);
        container.innerHTML = '<p class="error-text">Error al cargar categorias.</p>';
        return;
    }

    categoriasActuales = data || [];
    container.innerHTML = '';

    // Generar tarjetas de categorias
    categoriasActuales.forEach((cat, index) => {
        const card = document.createElement('a');
        card.href = `procesos/${cat.slug}.html`;
        card.className = 'process-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        const badgeClass = cat.estado === 'authorized' ? 'aprobado' : 'pendiente';
        const badgeText = cat.estado === 'authorized' ? 'Aprobado' : 'Pendiente';

        const accionesHTML = esEditor ? `
            <button class="btn-cat-edit" data-categoria-id="${cat.id}" title="Editar categoria">Editar</button>
        ` : '';

        card.innerHTML = `
            <div class="card-header">
                <h2>${cat.nombre}</h2>
            </div>
            <p class="card-description">${cat.descripcion || ''}</p>
            <div class="card-status">
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="card-footer">
                <span class="arrow">-></span>
            </div>
            ${accionesHTML}
        `;

        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);

        if (esEditor) {
            const btnEdit = card.querySelector('.btn-cat-edit');
            btnEdit.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirModalEditarCategoria(cat.id);
            });
        }
    });

    agregarTarjetaEditor();

    console.log('Categorias cargadas:', categoriasActuales.length);
}

// =====================================================
// AGREGAR TARJETA DE EDITOR / CERRAR SESION
// =====================================================
function agregarTarjetaEditor() {
    const container = document.getElementById('categorias-container');

    const card = document.createElement('a');
    card.href = '#';
    card.className = 'process-card editor-card';
    card.id = 'btn-editor';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    const titulo = esEditor ? 'Cerrar Sesion' : 'Modo Editor';
    const descripcion = esEditor ? 'Finalizar la sesion activa' : 'Iniciar sesion para editar procesos';
    const badgeHTML = esEditor ? '' : '<span class="badge editor">Acceso restringido</span>';

    card.innerHTML = `
        <div class="card-header">
            <h2>${titulo}</h2>
        </div>
        <p class="card-description">${descripcion}</p>
        <div class="card-status">
            ${badgeHTML}
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
    }, categoriasActuales.length * 100);

    card.addEventListener('click', async (e) => {
        e.preventDefault();

        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const confirmar = confirm('Ya has iniciado sesion. ¿Deseas cerrar sesion?');
            if (confirmar) {
                await cerrarSesion();
            }
            return;
        }

        document.getElementById('modal-login').classList.add('active');
        document.getElementById('modal-message').textContent = '';
        document.getElementById('form-login').reset();
    });
}

// =====================================================
// MODAL DE LOGIN
// =====================================================
function setupModalLogin() {
    const modalLogin = document.getElementById('modal-login');
    const modalClose = document.getElementById('modal-close');
    const formLogin = document.getElementById('form-login');
    const modalMessage = document.getElementById('modal-message');
    const btnLogin = document.getElementById('btn-login');

    modalClose.addEventListener('click', () => {
        modalLogin.classList.remove('active');
    });

    modalLogin.addEventListener('click', (e) => {
        if (e.target === modalLogin) {
            modalLogin.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalLogin.classList.remove('active');
            document.getElementById('modal-edit-categoria').classList.remove('active');
        }
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        modalMessage.textContent = 'Verificando...';
        modalMessage.style.color = 'var(--text-secondary)';
        btnLogin.disabled = true;
        btnLogin.textContent = 'Entrando...';

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';

        if (error) {
            console.error('Error de login:', error);
            modalMessage.textContent = 'Credenciales incorrectas. Verifica tu correo y contrasena.';
            modalMessage.style.color = 'var(--danger)';
            return;
        }

        modalMessage.textContent = 'Acceso correcto. Redirigiendo...';
        modalMessage.style.color = 'var(--success)';

        setTimeout(async () => {
            modalLogin.classList.remove('active');
            await verificarSesion();
            await cargarCategorias();
        }, 800);
    });
}

// =====================================================
// MODAL DE EDITAR CATEGORIA
// =====================================================
function setupModalEditarCategoria() {
    const modal = document.getElementById('modal-edit-categoria');
    const modalClose = document.getElementById('modal-cat-close');
    const form = document.getElementById('form-edit-categoria');
    const message = document.getElementById('modal-cat-message');
    const btnSave = document.getElementById('btn-save-categoria');

    if (!modal || !form) return;

    modalClose.addEventListener('click', () => modal.classList.remove('active'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('cat-nombre').value.trim();
        const descripcion = document.getElementById('cat-descripcion').value.trim();
        const estado = document.getElementById('cat-estado').value;
        const categoriaId = form.dataset.categoriaId;

        if (!nombre) {
            message.textContent = 'El nombre es obligatorio.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = 'Guardando...';
        message.style.color = 'var(--text-secondary)';
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const { error } = await supabaseClient
            .from('categorias')
            .update({
                nombre: nombre,
                descripcion: descripcion || null,
                estado: estado
            })
            .eq('id', categoriaId);

        btnSave.disabled = false;
        btnSave.textContent = 'Guardar cambios';

        if (error) {
            console.error('Error al guardar:', error);
            message.textContent = 'Error al guardar. Intenta de nuevo.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = 'Cambios guardados correctamente.';
        message.style.color = 'var(--success)';

        setTimeout(async () => {
            modal.classList.remove('active');
            await cargarCategorias();
        }, 1000);
    });
}

function abrirModalEditarCategoria(categoriaId) {
    const cat = categoriasActuales.find(c => c.id == categoriaId);
    if (!cat) return;

    document.getElementById('cat-nombre').value = cat.nombre;
    document.getElementById('cat-descripcion').value = cat.descripcion || '';
    document.getElementById('cat-estado').value = cat.estado;
    document.getElementById('form-edit-categoria').dataset.categoriaId = categoriaId;

    document.getElementById('modal-cat-message').textContent = '';
    document.getElementById('modal-edit-categoria').classList.add('active');
}

// =====================================================
// VERIFICAR SESION
// =====================================================
async function verificarSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    const userStatus = document.getElementById('user-status');

    if (session) {
        const { data: perfil } = await supabaseClient
            .from('perfiles')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        const rol = perfil?.rol || 'viewer';
        const email = session.user.email;

        esEditor = rol === 'editor';

        if (userStatus) {
            userStatus.innerHTML = `<span class="user-email">${email}</span><span class="badge rol-${rol}">${rol}</span>`;
        }

        console.log('Sesion activa:', email, '- Rol:', rol);
    } else {
        esEditor = false;
        if (userStatus) userStatus.innerHTML = '';
        console.log('No hay sesion activa');
    }
}

async function cerrarSesion() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesion:', error);
        return;
    }
    console.log('Sesion cerrada');
    await verificarSesion();
    await cargarCategorias();
}